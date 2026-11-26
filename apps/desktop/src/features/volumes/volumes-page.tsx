import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

import { segmentColor } from "@/features/metrics/segment-color";
import { formatBytes, plural } from "@/lib/format";
import type { VolumeSummary } from "@/lib/ipc/bindings";
import { useSelection } from "@/lib/use-selection";
import { Crumb, Page } from "@/shell/page";
import { BulkDelete } from "@/ui/bulk-delete";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { ListSection } from "@/ui/list-section";
import { Lede, PageHeading } from "@/ui/page-heading";
import { Segmented } from "@/ui/segmented";
import { useRowOrder } from "@/ui/table-layout";
import { Tile } from "@/ui/tile";
import { UsageBar } from "@/ui/usage-bar";

import { pickBackup, useBackupVolume, useRemoveVolumes, useVolumes } from "./api";
import { matchesVolume, type VolumeFilter, volumeName, volumeStats } from "./model";
import { VOLUMES_TABLE, type VolumeHandlers, volumeColumns } from "./volume-columns";
import { type VolumeDialog, VolumeDialogs } from "./volume-dialogs";
import { VolumeTable } from "./volume-table";

/** The bar names the largest few; the many small ones share one segment instead of a comb. */
const LARGEST = 8;

function Sizes({ volumes, onClean }: { volumes: VolumeSummary[]; onClean: () => void }) {
  const stats = volumeStats(volumes);
  const sized = volumes
    .filter((volume) => (volume.sizeBytes ?? 0) > 0)
    .toSorted((a, b) => (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0));
  const rest = sized.slice(LARGEST);
  const segments = [
    ...sized.slice(0, LARGEST).map((volume) => ({
      id: volume.name,
      label: volumeName(volume),
      value: volume.sizeBytes ?? 0,
      color: segmentColor({
        kind: volume.project ? "project" : "standalone",
        label: volume.project ?? "",
      }),
    })),
    ...(rest.length > 0
      ? [
          {
            id: "rest",
            label: plural(rest.length, "smaller volume"),
            value: rest.reduce((total, volume) => total + (volume.sizeBytes ?? 0), 0),
            color: "var(--line-strong)",
          },
        ]
      : []),
  ];
  return (
    <>
      <div className="flex items-center gap-3">
        <Lede>
          <b className="tabular">{formatBytes(stats.totalBytes)}</b> in{" "}
          {plural(stats.count, "volume")}.{" "}
          {stats.unattached > 0
            ? `${stats.unattached} ${stats.unattached === 1 ? "isn't" : "aren't"} attached to any container (${formatBytes(stats.unattachedBytes)}).`
            : "All are attached."}
        </Lede>
        <Button
          size="sm"
          className="ml-auto shrink-0"
          disabled={stats.unattached === 0}
          onClick={onClean}
        >
          <IconTrash />
          Clean up
        </Button>
      </div>
      <UsageBar segments={segments} label="Volume sizes" format={formatBytes} />
    </>
  );
}

export function VolumesPage() {
  const { data: volumes } = useVolumes();
  const backup = useBackupVolume();
  const [filter, setFilter] = useState<VolumeFilter>("all");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<VolumeDialog | null>(null);
  const all = volumes ?? [];
  const stats = volumeStats(all);
  const visible = all.filter((volume) => matchesVolume(volume, filter, query));
  const order = useRowOrder(VOLUMES_TABLE, volumeColumns);
  const selection = useSelection(
    order(visible)
      .filter((volume) => volume.usedBy.length === 0)
      .map((volume) => volume.name),
  );
  const chosen = visible.filter((volume) => selection.has(volume.name));
  const removeMany = useRemoveVolumes();
  const restoreInto = (volume: string | null) =>
    pickBackup()
      .then((file) => (file ? setDialog({ kind: "restore", file, volume }) : undefined))
      .catch(() => undefined);
  const create = (
    <span className="flex gap-2">
      <Button onClick={() => restoreInto(null)}>Restore…</Button>
      <Button variant="brand" onClick={() => setDialog({ kind: "new" })}>
        <IconPlus />
        New volume
      </Button>
    </span>
  );
  const handlers: VolumeHandlers = {
    onBackup: (volume) => backup.run(volume.name),
    onClone: (volume) => setDialog({ kind: "clone", volume }),
    onRestore: (volume) => restoreInto(volume.name),
    onDelete: (volume) => setDialog({ kind: "delete", volume }),
  };
  return (
    <Page crumbs={<Crumb>Volumes</Crumb>}>
      {volumes?.length === 0 ? (
        <EmptyState
          art={<Tile icon="volume" size="xl" />}
          title="No volumes yet"
          className="h-full"
          actions={create}
        >
          Volumes keep data when containers are recreated.
        </EmptyState>
      ) : (
        <>
          <PageHeading title="Volumes" action={create}>
            <Sizes volumes={all} onClean={() => setDialog({ kind: "prune" })} />
          </PageHeading>
          <ListSection
            query={query}
            onQuery={setQuery}
            placeholder="Filter volumes"
            filter={
              <Segmented
                label="Show"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "All", count: stats.count },
                  { value: "used", label: "In use", count: stats.count - stats.unattached },
                  { value: "unused", label: "Unattached", count: stats.unattached },
                  ...(stats.anonymous > 0
                    ? [{ value: "anonymous" as const, label: "Anonymous", count: stats.anonymous }]
                    : []),
                ]}
              />
            }
          >
            {volumes && visible.length === 0 ? (
              <EmptyState title="No volumes match this filter" />
            ) : (
              <VolumeTable volumes={visible} selection={selection} {...handlers} />
            )}
          </ListSection>
          <BulkDelete
            selection={selection}
            chosen={chosen}
            noun="volume"
            name={volumeName}
            onDelete={(items) => removeMany.mutate(items)}
          >
            Their data is deleted with them. Back a volume up first if you may need it. This can't
            be undone.
          </BulkDelete>
        </>
      )}
      <VolumeDialogs dialog={dialog} volumes={all} onClose={() => setDialog(null)} />
    </Page>
  );
}
