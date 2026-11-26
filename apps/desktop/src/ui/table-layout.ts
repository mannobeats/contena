import type { ReactNode } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** One column of a `DataTable`. */
export type Column<Item> = {
  id: string;
  header: string;
  /** Keeps the header for screen readers only. */
  hiddenHeader?: boolean;
  /** The starting width in pixels. The one column without a width fills what is left. */
  width?: number;
  /** Narrowest it can be dragged; for the filling column, the narrowest it gets before scrolling. */
  minWidth?: number;
  align?: "left" | "right";
  /** Makes the header sort by this value. */
  sortValue?: (item: Item) => string | number | null;
  /** Can be turned off from the header's right-click menu. */
  optional?: boolean;
  hiddenByDefault?: boolean;
  /** When the window is narrow, optional columns with the lowest priority step aside first. */
  priority?: number;
  /** Extra classes for the column's cells, such as `font-mono text-mono-12`. */
  className?: string;
  cell: (item: Item) => ReactNode;
};

export type SortState = { column: string; desc: boolean };

/** What a person changed about one table: column widths, hidden columns and the sort. */
export type TableLayout = {
  widths: Record<string, number>;
  /** Optional columns turned off, or turned on when they start hidden: `true` means shown. */
  shown: Record<string, boolean>;
  sort: SortState | null;
};

const EMPTY: TableLayout = { widths: {}, shown: {}, sort: null };

type TableLayouts = {
  layouts: Record<string, TableLayout>;
  setWidth: (table: string, column: string, width: number) => void;
  setShown: (table: string, column: string, shown: boolean) => void;
  setSort: (table: string, sort: SortState | null) => void;
  reset: (table: string) => void;
};

function update(
  layouts: Record<string, TableLayout>,
  table: string,
  change: (layout: TableLayout) => Partial<TableLayout>,
) {
  const layout = layouts[table] ?? EMPTY;
  return { layouts: { ...layouts, [table]: { ...layout, ...change(layout) } } };
}

/** Remembered per table id, so a column dragged wider stays wide the next time. */
export const useTableLayouts = create<TableLayouts>()(
  persist(
    (set) => ({
      layouts: {},
      setWidth: (table, column, width) =>
        set((state) =>
          update(state.layouts, table, (layout) => ({
            widths: { ...layout.widths, [column]: Math.round(width) },
          })),
        ),
      setShown: (table, column, shown) =>
        set((state) =>
          update(state.layouts, table, (layout) => ({
            shown: { ...layout.shown, [column]: shown },
          })),
        ),
      setSort: (table, sort) => set((state) => update(state.layouts, table, () => ({ sort }))),
      reset: (table) =>
        set((state) => {
          const { [table]: _, ...rest } = state.layouts;
          return { layouts: rest };
        }),
    }),
    { name: "contena.tables" },
  ),
);

export function useTableLayout(table: string): TableLayout {
  return useTableLayouts((state) => state.layouts[table]) ?? EMPTY;
}

/** Header click: ascending, then descending, then back to the list's own order. */
export function nextSort(current: SortState | null, column: string): SortState | null {
  if (current?.column !== column) {
    return { column, desc: false };
  }
  return current.desc ? null : { column, desc: true };
}

type Sortable = string | number | null;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/** Sorts a copy; empty values go last whichever way the sort runs. */
export function sortRows<Item>(
  rows: Item[],
  value: ((item: Item) => Sortable) | undefined,
  desc: boolean,
): Item[] {
  if (!value) {
    return rows;
  }
  return rows.toSorted((a, b) => {
    const left = value(a);
    const right = value(b);
    if (left === null || right === null) {
      return Number(left === null) - Number(right === null);
    }
    const order =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : collator.compare(String(left), String(right));
    return desc ? -order : order;
  });
}

/**
 * The table's current sort, for a page that needs rows in the order they show, such as for the
 * ⇧-click range of a selection.
 */
export function useRowOrder<Item>(table: string, columns: Column<Item>[]) {
  const { sort } = useTableLayout(table);
  const value = columns.find((column) => column.id === sort?.column)?.sortValue;
  return (items: Item[]) => sortRows(items, value, sort?.desc ?? false);
}

export const SELECT_WIDTH = 44;
const FILL_MIN = 180;

/** Optional columns follow the person's choice, or start shown unless marked hidden. */
function shownColumns<Item>(columns: Column<Item>[], shown: Record<string, boolean>) {
  return columns.filter(
    (column) => !column.optional || (shown[column.id] ?? !column.hiddenByDefault),
  );
}

/** The narrowest the table gets before it scrolls sideways: every fixed width plus the filler's. */
export function tableMinWidth<Item>(
  visible: Column<Item>[],
  widths: Record<string, number>,
  extra: number,
) {
  return visible.reduce(
    (total, column) =>
      total +
      (column.width === undefined
        ? (column.minWidth ?? FILL_MIN)
        : (widths[column.id] ?? column.width)),
    extra,
  );
}

/**
 * The columns that fit in `room` pixels. Optional columns nobody turned on themselves step aside
 * from the right until the rest fit, so a narrow window loses detail instead of scrolling sideways.
 */
export function fitColumns<Item>(
  columns: Column<Item>[],
  layout: TableLayout,
  room: number | null,
  extra: number,
): Column<Item>[] {
  let visible = shownColumns(columns, layout.shown);
  if (room === null) {
    return visible;
  }
  const yielding = visible
    .filter((column) => column.optional && layout.shown[column.id] === undefined)
    .toSorted((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  while (tableMinWidth(visible, layout.widths, extra) > room) {
    const drop = yielding.pop();
    if (!drop) {
      break;
    }
    visible = visible.filter((column) => column !== drop);
  }
  return visible;
}
