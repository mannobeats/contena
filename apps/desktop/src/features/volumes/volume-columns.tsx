import { formatBytes, formatRelative } from "@/lib/format";
import type { VolumeSummary } from "@/lib/ipc/bindings";
import { Chip } from "@/ui/chip";
import { Dash } from "@/ui/dash";
import { FaceStack } from "@/ui/face-stack";
import type { Column } from "@/ui/table-layout";
import { Truncate } from "@/ui/truncate";
import { VolumeName } from "./volume-cells";

export const VOLUMES_TABLE = "volumes";

export type VolumeHandlers = {
  onBackup: (volume: VolumeSummary) => void;
  onClone: (volume: VolumeSummary) => void;
  onRestore: (volume: VolumeSummary) => void;
  onDelete: (volume: VolumeSummary) => void;
};

const faces = (volume: VolumeSummary) =>
  volume.usedBy.map((user) => ({
    id: user.containerId,
    name: user.container,
    running: user.running,
  }));

export const volumeColumns: Column<VolumeSummary>[] = [
  {
    id: "name",
    header: "Name",
    minWidth: 220,
    sortValue: (volume) => (volume.anonymous ? `~${volume.name}` : volume.name),
    cell: (volume) => <VolumeName volume={volume} />,
  },
  {
    id: "project",
    priority: 3,
    header: "Project",
    width: 140,
    optional: true,
    sortValue: (volume) => volume.project,
    cell: (volume) => (volume.project ? <Chip>{volume.project}</Chip> : <Dash />),
  },
  {
    id: "usedBy",
    header: "Used by",
    width: 220,
    sortValue: (volume) => volume.usedBy[0]?.container ?? null,
    cell: (volume) => <FaceStack faces={faces(volume)} />,
  },
  {
    id: "mountedAt",
    priority: 1,
    header: "Mounted at",
    width: 200,
    optional: true,
    className: "font-mono text-mono-12 text-ink-3",
    cell: (volume) => {
      const path = volume.usedBy[0]?.mountedAt;
      return path ? <Truncate text={path} /> : <Dash />;
    },
  },
  {
    id: "size",
    header: "Size",
    width: 96,
    align: "right",
    sortValue: (volume) => volume.sizeBytes,
    cell: (volume) => (volume.sizeBytes === null ? <Dash /> : formatBytes(volume.sizeBytes)),
  },
  {
    id: "created",
    priority: 2,
    header: "Created",
    width: 124,
    optional: true,
    sortValue: (volume) => (volume.createdAt ? Date.parse(volume.createdAt) : null),
    className: "text-ink-3",
    cell: (volume) =>
      volume.createdAt ? formatRelative(Date.parse(volume.createdAt) / 1000) : <Dash />,
  },
];
