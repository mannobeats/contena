import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

import type { Selection } from "@/lib/use-selection";

import { Checkbox } from "./checkbox";
import { rowActions } from "./classes";
import { Tip } from "./tooltip";

/** Other props reach the `<tr>`, so a `ContextMenu` around the row can open on right-click. */
type RowProps = ComponentProps<"tr"> & { dim?: boolean; selected?: boolean };

/** A hoverable row. Give its first cell a `rowLink` link with `data-row-link` to open on click. */
export function Row({ dim = false, selected = false, className, children, ...props }: RowProps) {
  return (
    <tr
      {...props}
      aria-selected={selected || undefined}
      className={clsx(
        "group/row h-9 transition-colors duration-140 hover:bg-hover data-[state=open]:bg-hover [&>td]:border-b-[0.5px] [&>td]:border-line [&>td]:px-2.5 [&>td]:whitespace-nowrap",
        dim && "[&>td]:text-ink-3",
        selected && "bg-select hover:bg-select",
        className,
      )}
    >
      {children}
    </tr>
  );
}

/** Row actions: hidden until the row is hovered or focused. */
export function RowActions({ children }: { children: ReactNode }) {
  return (
    <td className="text-right">
      <span className={rowActions}>{children}</span>
    </td>
  );
}

/**
 * Boxes stay out of sight until they can be used, as in Mail: on the hovered row, while the
 * keyboard is on one, or once anything is selected.
 */
const reveal =
  "inline-flex align-middle opacity-0 transition-opacity duration-140 group-hover/row:opacity-100 group-hover/head:opacity-100 group-aria-selected/row:opacity-100 group-data-selecting/table:opacity-100 has-focus-visible:opacity-100";

/** The header's box: selects every row that can be selected, or none. */
export function SelectAll({ selection, label }: { selection: Selection; label: string }) {
  return (
    <th className="w-11">
      <span className={reveal}>
        <Checkbox checked={selection.all} onCheckedChange={selection.setAll} label={label} />
      </span>
    </th>
  );
}

type SelectCellProps = {
  selection: Selection;
  id: string;
  label: string;
  /** Why the row can't be selected, such as "In use by web-1"; the box is greyed out. */
  blocked?: string | undefined;
};

/** A row's box, for acting on many rows at once. */
export function SelectCell({ selection, id, label, blocked }: SelectCellProps) {
  if (blocked) {
    return (
      <td className="w-11">
        <Tip label={blocked}>
          <span className={reveal}>
            <Checkbox checked={false} onCheckedChange={() => undefined} label={label} disabled />
          </span>
        </Tip>
      </td>
    );
  }
  return (
    <td className="w-11">
      <span className={reveal}>
        <Checkbox
          checked={selection.has(id)}
          onCheckedChange={() => selection.toggle(id)}
          label={label}
        />
      </span>
    </td>
  );
}
