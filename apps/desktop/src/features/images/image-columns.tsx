import { formatBytes, formatRelative } from "@/lib/format";
import type { ContainerSummary, ImageSummary } from "@/lib/ipc/bindings";
import { Chip } from "@/ui/chip";
import { Dash } from "@/ui/dash";
import type { Column } from "@/ui/table-layout";
import { ImageName, UsedBy } from "./image-cells";
import { imageName, shortId, usersOf } from "./model";

export const IMAGES_TABLE = "images";

export function imageColumns(containers: ContainerSummary[]): Column<ImageSummary>[] {
  return [
    {
      id: "repository",
      header: "Repository",
      minWidth: 220,
      sortValue: (image) => (image.dangling ? null : imageName(image)),
      cell: (image) => <ImageName image={image} />,
    },
    {
      id: "tag",
      header: "Tag",
      width: 130,
      sortValue: (image) => image.tag,
      cell: (image) =>
        image.tag ? (
          <Chip mono className="max-w-full">
            <span className="truncate">{image.tag}</span>
          </Chip>
        ) : (
          <Dash />
        ),
    },
    {
      id: "id",
      priority: 1,
      header: "Image ID",
      width: 124,
      optional: true,
      className: "font-mono text-mono-12 text-ink-3",
      cell: (image) => shortId(image.id),
    },
    {
      id: "size",
      header: "Size",
      width: 90,
      align: "right",
      sortValue: (image) => image.sizeBytes,
      cell: (image) => formatBytes(image.sizeBytes),
    },
    {
      id: "created",
      priority: 2,
      header: "Created",
      width: 124,
      optional: true,
      className: "text-ink-3",
      // Reproducible builds stamp 1970 on their images; that date says nothing.
      sortValue: (image) => (image.createdAt > 0 ? image.createdAt : null),
      cell: (image) => (image.createdAt > 0 ? formatRelative(image.createdAt) : <Dash />),
    },
    {
      id: "usedBy",
      header: "Used by",
      width: 210,
      sortValue: (image) => image.containers,
      cell: (image) => <UsedBy image={image} users={usersOf(image, containers)} />,
    },
  ];
}
