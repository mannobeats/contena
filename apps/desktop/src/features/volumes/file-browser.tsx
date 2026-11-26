import { IconDownload, IconFile, IconFolder, IconLink } from "@tabler/icons-react";
import { useState } from "react";

import { copyText } from "@/lib/clipboard";
import { formatBytes, formatRelative } from "@/lib/format";
import type { VolumeFile } from "@/lib/ipc/bindings";
import { errorMessage } from "@/lib/ipc/errors";
import { Banner } from "@/ui/banner";
import { Dash } from "@/ui/dash";
import { DataTable } from "@/ui/data-table";
import { EmptyState } from "@/ui/empty-state";
import { IconAction } from "@/ui/icon-action";
import { ContextMenu } from "@/ui/menu";
import { Skeleton } from "@/ui/progress";
import type { Column } from "@/ui/table-layout";
import { Truncate } from "@/ui/truncate";

import { useDownloadFromVolume, useVolumeFiles } from "./api";
import { isFolder, joinPath } from "./model";

const icons = { directory: IconFolder, link: IconLink, file: IconFile, other: IconFile } as const;

function Breadcrumbs({
  volume,
  path,
  onOpen,
}: {
  volume: string;
  path: string;
  onOpen: (path: string) => void;
}) {
  const parts = path.split("/").filter(Boolean);
  return (
    <nav
      aria-label="Folder"
      className="flex min-w-0 items-center gap-1 px-5 py-2.5 text-13 text-ink-3"
    >
      <button
        type="button"
        className="rounded-[5px] px-1 hover:bg-hover hover:text-ink"
        onClick={() => onOpen("")}
      >
        {volume}
      </button>
      {parts.map((part, index) => (
        <span key={parts.slice(0, index + 1).join("/")} className="flex items-center gap-1">
          /
          <button
            type="button"
            className="rounded-[5px] px-1 hover:bg-hover hover:text-ink"
            onClick={() => onOpen(parts.slice(0, index + 1).join("/"))}
          >
            {part}
          </button>
        </span>
      ))}
    </nav>
  );
}

function EntryName({ entry, onOpen }: { entry: VolumeFile; onOpen: () => void }) {
  const Icon = icons[entry.kind];
  if (!isFolder(entry)) {
    return (
      <span className="flex min-w-0 items-center gap-2 text-ink">
        <Icon className="text-ink-3" aria-hidden />
        <Truncate text={entry.name} className="select-text" />
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-w-0 items-center gap-2 text-ink"
      data-row-link
    >
      <Icon className="text-ink-3" aria-hidden />
      <Truncate text={entry.name} />
    </button>
  );
}

/** Folders first, as Finder lists them, then by name. */
const folderFirst = (entry: VolumeFile) => `${isFolder(entry) ? 0 : 1}${entry.name}`;

function fileColumns(open: (entry: VolumeFile) => void): Column<VolumeFile>[] {
  return [
    {
      id: "name",
      header: "Name",
      minWidth: 200,
      sortValue: folderFirst,
      cell: (entry) => <EntryName entry={entry} onOpen={() => open(entry)} />,
    },
    {
      id: "size",
      header: "Size",
      width: 100,
      align: "right",
      sortValue: (entry) => (isFolder(entry) ? null : entry.sizeBytes),
      cell: (entry) => (isFolder(entry) ? <Dash /> : formatBytes(entry.sizeBytes)),
    },
    {
      id: "modified",
      header: "Modified",
      width: 140,
      sortValue: (entry) => entry.modifiedAt,
      className: "text-ink-3",
      cell: (entry) => formatRelative(entry.modifiedAt),
    },
  ];
}

/** Browses a volume read-only and copies files out to the Mac. */
export function FileBrowser({ volume }: { volume: string }) {
  const [path, setPath] = useState("");
  const { data: entries, error, isPending, refetch } = useVolumeFiles(volume, path);
  const download = useDownloadFromVolume();
  const save = (entry: VolumeFile) =>
    download.run({ name: volume, path: joinPath(path, entry.name) });
  return (
    <div className="flex min-h-0 flex-1 flex-col border-t-[0.5px] border-line">
      <Breadcrumbs volume={volume} path={path} onOpen={setPath} />
      <ContextMenu entries={[{ label: "Refresh", onSelect: () => refetch() }]}>
        <div className="flex min-h-0 flex-1 flex-col">
          {error ? (
            <Banner tone="bad" className="mx-5 mb-3">
              {errorMessage(error)}
            </Banner>
          ) : null}
          {isPending ? <Skeleton className="mx-5 w-64" /> : null}
          {entries?.length === 0 ? (
            <EmptyState title="This folder is empty" className="py-10" />
          ) : null}
          {entries && entries.length > 0 ? (
            <DataTable
              layoutKey="volume-files"
              label={`Files in ${path || volume}`}
              columns={fileColumns((entry) => setPath(joinPath(path, entry.name)))}
              rows={entries}
              rowKey={(entry) => entry.name}
              menu={(entry) => [
                ...(isFolder(entry)
                  ? [{ label: "Open", onSelect: () => setPath(joinPath(path, entry.name)) }]
                  : []),
                { label: "Download…", onSelect: () => save(entry) },
                { kind: "separator" },
                {
                  label: "Copy Path",
                  onSelect: () => copyText("Path", `/${joinPath(path, entry.name)}`),
                },
                { label: "Copy Name", onSelect: () => copyText("Name", entry.name) },
              ]}
              actionsWidth={52}
              actions={(entry) => (
                <IconAction label="Save to the Mac" target={entry.name} onClick={() => save(entry)}>
                  <IconDownload />
                </IconAction>
              )}
            />
          ) : null}
        </div>
      </ContextMenu>
    </div>
  );
}
