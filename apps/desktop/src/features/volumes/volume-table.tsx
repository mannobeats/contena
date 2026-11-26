import { IconArchive } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";

import { copyText } from "@/lib/clipboard";
import type { VolumeSummary } from "@/lib/ipc/bindings";
import type { Selection } from "@/lib/use-selection";
import { DataTable } from "@/ui/data-table";
import { IconAction } from "@/ui/icon-action";
import { type MenuEntry, MoreMenu } from "@/ui/menu";

import { inUseReason, volumeName } from "./model";
import { VOLUMES_TABLE, type VolumeHandlers, volumeColumns } from "./volume-columns";

type VolumeTableProps = VolumeHandlers & { volumes: VolumeSummary[]; selection: Selection };

export function VolumeTable({ volumes, selection, ...handlers }: VolumeTableProps) {
  const navigate = useNavigate();
  const menu = (volume: VolumeSummary): MenuEntry[] => [
    {
      label: "Browse Files",
      onSelect: () => navigate({ to: "/volumes/$name", params: { name: volume.name } }),
    },
    { kind: "separator" },
    { label: "Back Up to .tar.gz…", onSelect: () => handlers.onBackup(volume) },
    { label: "Restore from Backup…", onSelect: () => handlers.onRestore(volume) },
    { label: "Clone…", onSelect: () => handlers.onClone(volume) },
    { kind: "separator" },
    { label: "Copy Name", onSelect: () => copyText("Name", volume.name) },
    { kind: "separator" },
    { label: "Delete Volume…", danger: true, onSelect: () => handlers.onDelete(volume) },
  ];
  return (
    <DataTable
      layoutKey={VOLUMES_TABLE}
      label="Volumes"
      columns={volumeColumns}
      rows={volumes}
      rowKey={(volume) => volume.name}
      rowLabel={volumeName}
      muted={(volume) => volume.usedBy.length === 0}
      menu={menu}
      select={{
        selection,
        all: "Select all volumes no container uses",
        blocked: (volume) =>
          volume.usedBy.length > 0 ? inUseReason(volume.usedBy.length) : undefined,
      }}
      actions={(volume) => (
        <>
          <IconAction
            label="Back up to .tar.gz"
            target={volumeName(volume)}
            onClick={() => handlers.onBackup(volume)}
          >
            <IconArchive />
          </IconAction>
          <MoreMenu entries={menu(volume)} target={volumeName(volume)} />
        </>
      )}
    />
  );
}
