import { Link, useNavigate } from "@tanstack/react-router";

import { formatRelative } from "@/lib/format";
import type { BuildRecord } from "@/lib/ipc/bindings";
import { useNow } from "@/lib/use-now";
import { rowLink } from "@/ui/classes";
import { Dash } from "@/ui/dash";
import { DataTable } from "@/ui/data-table";
import { MoreMenu } from "@/ui/menu";
import { Progress } from "@/ui/progress";
import type { Column } from "@/ui/table-layout";
import { Tile } from "@/ui/tile";
import { Truncate } from "@/ui/truncate";

import { useRemoveBuild } from "./api";
import { buildMenu } from "./build-menu";
import { BuildStatusLabel } from "./build-status";
import {
  buildName,
  buildProgress,
  buildTileState,
  cachedLabel,
  elapsed,
  formatDuration,
  runningCount,
  sortBuilds,
} from "./model";

function Duration({ build, now }: { build: BuildRecord; now: number }) {
  const time = <span className="tabular">{formatDuration(elapsed(build, now))}</span>;
  if (build.status !== "running") {
    return time;
  }
  return (
    <span className="flex items-center justify-end gap-2.5">
      <Progress
        value={buildProgress(build)}
        label={`${buildName(build)} progress`}
        className="w-20"
      />
      {time}
    </span>
  );
}

function BuildName({ build }: { build: BuildRecord }) {
  return (
    <Link to="/builds/$id" params={{ id: build.id }} className={rowLink} data-row-link>
      <Tile icon="build" state={buildTileState(build)} />
      <Truncate text={buildName(build)} className="font-medium text-ink" />
    </Link>
  );
}

function buildColumns(now: number): Column<BuildRecord>[] {
  return [
    {
      id: "name",
      header: "Name",
      minWidth: 200,
      sortValue: buildName,
      cell: (build) => <BuildName build={build} />,
    },
    {
      id: "status",
      header: "Status",
      width: 130,
      sortValue: (build) => build.status,
      cell: (build) => <BuildStatusLabel status={build.status} />,
    },
    {
      id: "started",
      header: "Started",
      width: 150,
      sortValue: (build) => build.startedAtMs,
      className: "text-ink-3",
      cell: (build) => formatRelative(build.startedAtMs / 1000, now),
    },
    {
      id: "cache",
      priority: 1,
      header: "Cache",
      width: 140,
      optional: true,
      className: "text-ink-3 tabular",
      cell: (build) => cachedLabel(build) ?? <Dash />,
    },
    {
      id: "duration",
      header: "Duration",
      width: 160,
      align: "right",
      sortValue: (build) => elapsed(build, now),
      cell: (build) => <Duration build={build} now={now} />,
    },
  ];
}

export function BuildTable({ builds }: { builds: BuildRecord[] }) {
  const now = useNow(runningCount(builds) > 0);
  const navigate = useNavigate();
  const remove = useRemoveBuild();
  const menu = (build: BuildRecord) =>
    buildMenu(build, {
      open: () => navigate({ to: "/builds/$id", params: { id: build.id } }),
      remove: () => remove.mutate({ id: build.id, name: buildName(build) }),
    });
  return (
    <DataTable
      layoutKey="builds"
      label="Builds"
      columns={buildColumns(now)}
      rows={sortBuilds(builds)}
      rowKey={(build) => build.id}
      menu={menu}
      actionsWidth={52}
      actions={(build) => <MoreMenu entries={menu(build)} target={buildName(build)} />}
    />
  );
}
