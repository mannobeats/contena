import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import clsx from "clsx";
import { type ReactNode, useState } from "react";

import type { Selection } from "@/lib/use-selection";

import { ColumnResizer } from "./column-resizer";
import { ContextMenu, type MenuEntry } from "./menu";
import { openRowOnClick } from "./row-click";
import { Row, RowActions, SelectAll, SelectCell } from "./table";
import {
  type Column,
  fitColumns,
  nextSort,
  SELECT_WIDTH,
  type SortState,
  tableMinWidth,
  useRowOrder,
  useTableLayout,
  useTableLayouts,
} from "./table-layout";

/** What a group's header row needs to line its own cells up under the table's columns. */
export type GroupCells = {
  /** Every cell in a row, for a header that is one wide cell. */
  span: number;
  /** The ids of the columns shown, in order, after the selection box. */
  columns: string[];
  select: boolean;
  actions: boolean;
};

type RowGroup<Item> = {
  id: string;
  rows: Item[];
  /** Whether its rows are folded away under its header row. */
  collapsed?: boolean;
  /** The group's header `<tr>`, laid out against the columns shown. */
  head: (cells: GroupCells) => ReactNode;
};

type SelectOptions<Item> = {
  selection: Selection;
  /** The header box's label: "Select all volumes no container uses". */
  all: string;
  /** Why a row can't be picked, such as "In use by web-1". */
  blocked?: (item: Item) => string | undefined;
};

type DataTableProps<Item> = {
  /** Remembers widths, hidden columns and the sort under this name. */
  layoutKey: string;
  label: string;
  columns: Column<Item>[];
  rowKey: (item: Item) => string;
  /** The rows in their own order, or `groups` of them. */
  rows?: Item[];
  groups?: RowGroup<Item>[];
  /** What screen readers say a row is, for its box: "Select web-1". */
  rowLabel?: (item: Item) => string;
  /** Greys out rows that are done or stopped. */
  muted?: (item: Item) => boolean;
  /** The row's right-click menu; pass the same entries to its ⋯ button. */
  menu?: (item: Item) => MenuEntry[];
  /** Buttons shown while the row is hovered, at its right end. */
  actions?: (item: Item) => ReactNode;
  actionsWidth?: number;
  select?: SelectOptions<Item>;
};

const DEFAULT_MIN = 56;

function SortMark({ sort, column }: { sort: SortState | null; column: string }) {
  if (sort?.column !== column) {
    return null;
  }
  return sort.desc ? (
    <IconChevronDown aria-hidden className="size-3! text-ink-2" />
  ) : (
    <IconChevronUp aria-hidden className="size-3! text-ink-2" />
  );
}

function ariaSort(sort: SortState | null, column: string) {
  if (sort?.column !== column) {
    return undefined;
  }
  return sort.desc ? "descending" : "ascending";
}

type HeadProps<Item> = {
  table: string;
  columns: Column<Item>[];
  visible: Column<Item>[];
  select: SelectOptions<Item> | undefined;
  actions: boolean;
};

function Head<Item>({ table, columns, visible, select, actions }: HeadProps<Item>) {
  const layout = useTableLayout(table);
  const setWidth = useTableLayouts((state) => state.setWidth);
  const setShown = useTableLayouts((state) => state.setShown);
  const setSort = useTableLayouts((state) => state.setSort);
  const reset = useTableLayouts((state) => state.reset);
  const widthOf = (column: Column<Item>) => layout.widths[column.id] ?? column.width ?? 0;
  const resizer = (index: number) => {
    const column = visible[index];
    if (!column) {
      return null;
    }
    // Dragging the filling column's edge gives it room from the column on its right.
    const target = column.width === undefined ? visible[index + 1] : column;
    const initial = target?.width;
    if (!target || initial === undefined) {
      return null;
    }
    return (
      <ColumnResizer
        column={column.header}
        width={widthOf(target)}
        min={target.minWidth ?? DEFAULT_MIN}
        direction={target === column ? 1 : -1}
        onChange={(width) => setWidth(table, target.id, width)}
        onReset={() => setWidth(table, target.id, initial)}
      />
    );
  };
  const optional = columns.filter((column) => column.optional);
  const shown = new Set(visible.map((column) => column.id));
  const entries: MenuEntry[] = [
    ...(optional.length > 0 ? [{ kind: "label" as const, label: "Columns" }] : []),
    ...optional.map((column) => {
      const on = shown.has(column.id);
      return {
        label: column.header,
        checked: on,
        onSelect: () => setShown(table, column.id, !on),
      };
    }),
    ...(optional.length > 0 ? [{ kind: "separator" as const }] : []),
    { label: "Reset Columns", onSelect: () => reset(table) },
  ];
  return (
    <thead>
      <ContextMenu entries={entries}>
        <tr className="group/head [&>th]:sticky [&>th]:top-[var(--table-top,0px)] [&>th]:z-[2] [&>th]:h-[30px] [&>th]:border-b-[0.5px] [&>th]:border-line [&>th]:bg-bg [&>th]:px-2.5 [&>th]:text-left [&>th]:text-12 [&>th]:font-medium [&>th]:whitespace-nowrap [&>th]:text-ink-3">
          {select ? <SelectAll selection={select.selection} label={select.all} /> : null}
          {visible.map((column, index) => (
            <th
              key={column.id}
              aria-sort={ariaSort(layout.sort, column.id)}
              className={clsx(column.align === "right" && "text-right!")}
            >
              {column.hiddenHeader ? (
                <span className="sr-only">{column.header}</span>
              ) : (
                <HeaderLabel
                  column={column}
                  sort={layout.sort}
                  onSort={() => setSort(table, nextSort(layout.sort, column.id))}
                />
              )}
              {resizer(index)}
            </th>
          ))}
          {actions ? (
            <th>
              <span className="sr-only">Actions</span>
            </th>
          ) : null}
        </tr>
      </ContextMenu>
    </thead>
  );
}

function HeaderLabel<Item>({
  column,
  sort,
  onSort,
}: {
  column: Column<Item>;
  sort: SortState | null;
  onSort: () => void;
}) {
  if (!column.sortValue) {
    return <span className="block truncate">{column.header}</span>;
  }
  return (
    <button
      type="button"
      onClick={onSort}
      className={clsx(
        "-mx-1 inline-flex max-w-[calc(100%+8px)] items-center gap-0.5 rounded-xs px-1 transition-colors duration-140 hover:text-ink",
        column.align === "right" && "flex-row-reverse",
        sort?.column === column.id && "text-ink-2",
      )}
    >
      <span className="truncate">{column.header}</span>
      <SortMark sort={sort} column={column.id} />
    </button>
  );
}

type BodyRowProps<Item> = {
  item: Item;
  id: string;
  visible: Column<Item>[];
  rowLabel: ((item: Item) => string) | undefined;
  muted: ((item: Item) => boolean) | undefined;
  menu: ((item: Item) => MenuEntry[]) | undefined;
  actions: ((item: Item) => ReactNode) | undefined;
  select: SelectOptions<Item> | undefined;
};

function BodyRow<Item>({
  item,
  id,
  visible,
  rowLabel,
  muted,
  menu,
  actions,
  select,
}: BodyRowProps<Item>) {
  const selection = select?.selection;
  const row = (
    <Row
      dim={muted?.(item) ?? false}
      selected={selection?.has(id) ?? false}
      {...(selection ? { onClick: (event) => selection.click(id, event) } : {})}
    >
      {select ? (
        <SelectCell
          selection={select.selection}
          id={id}
          label={`Select ${rowLabel?.(item) ?? id}`}
          blocked={select.blocked?.(item)}
        />
      ) : null}
      {visible.map((column) => (
        <td
          key={column.id}
          className={clsx(
            "max-w-0 truncate",
            column.align === "right" && "text-right tabular",
            column.className,
          )}
        >
          {column.cell(item)}
        </td>
      ))}
      {actions ? <RowActions>{actions(item)}</RowActions> : null}
    </Row>
  );
  return menu ? <ContextMenu entries={menu(item)}>{row}</ContextMenu> : row;
}

function ColGroup<Item>({
  visible,
  widths,
  select,
  actionsWidth,
}: {
  visible: Column<Item>[];
  widths: Record<string, number>;
  select: boolean;
  actionsWidth: number | null;
}) {
  return (
    <colgroup>
      {select ? <col style={{ width: SELECT_WIDTH }} /> : null}
      {visible.map((column) => (
        <col
          key={column.id}
          style={
            column.width === undefined ? undefined : { width: widths[column.id] ?? column.width }
          }
        />
      ))}
      {actionsWidth === null ? null : <col style={{ width: actionsWidth }} />}
    </colgroup>
  );
}

/**
 * The list table every page uses: columns that resize by dragging their edge (remembered), sort
 * from their header, and can be turned off from the header's right-click menu. Rows open on click
 * through their `rowLink`, select with ⌘- and ⇧-click, and show their actions on hover.
 */
export function DataTable<Item>(props: DataTableProps<Item>) {
  const { layoutKey: id, label, columns, rowKey, rows, groups, select, actions } = props;
  const actionsWidth = actions ? (props.actionsWidth ?? 84) : null;
  const layout = useTableLayout(id);
  const [room, setRoom] = useState<number | null>(null);
  const extra = (select ? SELECT_WIDTH : 0) + (actionsWidth ?? 0);
  const visible = fitColumns(columns, layout, room, extra);
  const order = useRowOrder(id, columns);
  const cells: GroupCells = {
    span: visible.length + (select ? 1 : 0) + (actions ? 1 : 0),
    columns: visible.map((column) => column.id),
    select: select !== undefined,
    actions: actions !== undefined,
  };
  const attach = (table: HTMLTableElement | null) => {
    const parent = table?.parentElement;
    if (!(table && parent)) {
      return;
    }
    const stopClicks = openRowOnClick(table);
    const observer = new ResizeObserver(([entry]) => setRoom(entry?.contentRect.width ?? null));
    observer.observe(parent);
    return () => {
      stopClicks?.();
      observer.disconnect();
    };
  };
  const body = (items: Item[]) =>
    order(items).map((item) => (
      <BodyRow
        key={rowKey(item)}
        item={item}
        id={rowKey(item)}
        visible={visible}
        rowLabel={props.rowLabel}
        muted={props.muted}
        menu={props.menu}
        actions={actions}
        select={select}
      />
    ));
  const bodies = (groups ?? [{ id: "rows", rows: rows ?? [], head: () => null }]).map((group) => (
    <tbody key={group.id}>
      {group.head(cells)}
      {group.collapsed ? null : body(group.rows)}
    </tbody>
  ));
  return (
    <table
      ref={attach}
      aria-label={label}
      data-selecting={(select?.selection.chosen.length ?? 0) > 0 || undefined}
      style={{ minWidth: tableMinWidth(visible, layout.widths, extra) }}
      className="group/table w-full table-fixed border-separate border-spacing-0 text-13 [&_td:first-child]:pl-5 [&_td:last-child]:pr-5 [&_th:first-child]:pl-5 [&_th:last-child]:pr-5"
    >
      <ColGroup
        visible={visible}
        widths={layout.widths}
        select={select !== undefined}
        actionsWidth={actionsWidth}
      />
      <Head
        table={id}
        columns={columns}
        visible={visible}
        select={select}
        actions={actions !== undefined}
      />
      {bodies}
    </table>
  );
}
