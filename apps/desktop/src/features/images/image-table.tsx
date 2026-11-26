import { IconTrash } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";

import type { ImageSummary } from "@/lib/ipc/bindings";
import type { Selection } from "@/lib/use-selection";
import { DataTable } from "@/ui/data-table";
import { IconAction } from "@/ui/icon-action";
import { MoreMenu } from "@/ui/menu";
import type { Column } from "@/ui/table-layout";

import { type ImageDialog, imageMenu } from "./image-actions";
import { IMAGES_TABLE } from "./image-columns";
import { imageName, inUseReason } from "./model";

type ImageTableProps = {
  images: ImageSummary[];
  columns: Column<ImageSummary>[];
  selection: Selection;
  onDialog: (dialog: ImageDialog) => void;
};

export function ImageTable({ images, columns, selection, onDialog }: ImageTableProps) {
  const navigate = useNavigate();
  const menu = (image: ImageSummary) =>
    imageMenu(image, {
      open: () => navigate({ to: "/images/$id", params: { id: image.id } }),
      onDialog,
    });
  return (
    <DataTable
      layoutKey={IMAGES_TABLE}
      label="Images"
      columns={columns}
      rows={images}
      rowKey={(image) => image.id}
      rowLabel={(image) => image.references[0] ?? imageName(image)}
      muted={(image) => image.dangling}
      menu={menu}
      select={{
        selection,
        all: "Select all images that aren't in use",
        blocked: (image) => (image.containers > 0 ? inUseReason(image.containers) : undefined),
      }}
      actions={(image) => {
        const inUse = image.containers > 0;
        return (
          <>
            <IconAction
              label={inUse ? "In use, stop its containers first" : "Delete"}
              target={imageName(image)}
              disabled={inUse}
              onClick={() => onDialog({ kind: "delete", image })}
            >
              <IconTrash />
            </IconAction>
            <MoreMenu entries={menu(image)} target={imageName(image)} />
          </>
        );
      }}
    />
  );
}
