import { IconTrash } from "@tabler/icons-react";
import { type ReactNode, useState } from "react";

import { type Selection, useSelectionKeys } from "@/lib/use-selection";

import { Button } from "./button";
import { DeleteManySheet } from "./delete-many-sheet";
import { SelectionBar } from "./selection-bar";

type BulkDeleteProps<Item> = {
  selection: Selection;
  /** The selected rows, in the list's order. */
  chosen: Item[];
  /** Singular, as `plural` takes it: "volume". */
  noun: string;
  name: (item: Item) => string;
  onDelete: (items: Item[]) => void;
  /** What deleting means for this kind of thing, under the names. */
  children: ReactNode;
};

/**
 * What a list people clean up gets: the bar while rows are selected, ⌘⌫ and Esc, and the sheet
 * that names what goes before it does.
 */
export function BulkDelete<Item>({
  selection,
  chosen,
  noun,
  name,
  onDelete,
  children,
}: BulkDeleteProps<Item>) {
  const [deleting, setDeleting] = useState<Item[]>([]);
  useSelectionKeys(selection, () => setDeleting(chosen));
  return (
    <>
      <SelectionBar count={chosen.length} label={`Selected ${noun}s`} onClear={selection.clear}>
        <Button variant="dangerGhost" size="sm" onClick={() => setDeleting(chosen)}>
          <IconTrash />
          Delete
        </Button>
      </SelectionBar>
      <DeleteManySheet
        names={deleting.map(name)}
        noun={noun}
        onCancel={() => setDeleting([])}
        onConfirm={() => {
          onDelete(deleting);
          setDeleting([]);
          selection.clear();
        }}
      >
        {children}
      </DeleteManySheet>
    </>
  );
}
