import { IconChevronDown, IconPlayerPlay, IconPlayerStop, IconRefresh } from "@tabler/icons-react";
import clsx from "clsx";

import { useProjectMenu } from "@/features/compose/project-menu";
import { formatMemory, formatPercent } from "@/lib/format";
import type { ContainerSummary, ContainerUsage } from "@/lib/ipc/bindings";
import { Button } from "@/ui/button";
import type { GroupCells } from "@/ui/data-table";
import { IconAction } from "@/ui/icon-action";
import { ContextMenu, type MenuEntry, MoreMenu } from "@/ui/menu";
import { StatusLabel } from "@/ui/status-label";
import { Tile } from "@/ui/tile";

import type { ContainerCallbacks } from "./container-callbacks";
import { type ContainerGroup, isCrashed, isRunning, runningLabel } from "./model";

/** Columns the project row fills with its own totals; the title spans everything before them. */
const TOTALS = ["cpu", "memory", "status"];

type ProjectRowProps = Pick<ContainerCallbacks, "act"> & {
  group: ContainerGroup;
  /** Every container in the project, including those the filter or search hides. */
  members: ContainerSummary[];
  usage: Map<string, ContainerUsage>;
  collapsed: boolean;
  onCollapse: () => void;
  cells: GroupCells;
};

type Totals = {
  members: ContainerSummary[];
  up: ContainerSummary[];
  usage: ProjectRowProps["usage"];
};

function TotalCell({ column, totals }: { column: string; totals: Totals }) {
  const { members, up, usage } = totals;
  if (up.length > 0 && column === "cpu") {
    const cpu = up.reduce((total, c) => total + (usage.get(c.id)?.cpuPercent ?? 0), 0);
    return <td className="text-right text-12 text-ink-3 tabular">{formatPercent(cpu)}</td>;
  }
  if (up.length > 0 && column === "memory") {
    const bytes = up.reduce((total, c) => total + (usage.get(c.id)?.memoryBytes ?? 0), 0);
    return <td className="text-right text-12 text-ink-3 tabular">{formatMemory(bytes)}</td>;
  }
  const crashed = members.filter(isCrashed).length;
  if (column === "status" && crashed > 0) {
    return (
      <td>
        <StatusLabel tone="bad" label={`${crashed} crashed`} className="text-12" />
      </td>
    );
  }
  return <td />;
}

function Title({
  label,
  project,
  totals,
  collapsed,
  onCollapse,
}: {
  label: string;
  /** Standalone containers share a header but are no project, so they get no project icon. */
  project: boolean;
  totals: Totals;
  collapsed: boolean;
  onCollapse: () => void;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-expanded={!collapsed}
        aria-label={`${collapsed ? "Expand" : "Collapse"} ${label}`}
        onClick={onCollapse}
        className="-ml-1 text-ink-3"
      >
        <IconChevronDown
          className={clsx(
            "size-3.5 transition-transform duration-220 ease-out",
            collapsed && "-rotate-90",
          )}
        />
      </Button>
      <Tile icon={project ? "compose" : "container"} state={totals.up.length > 0 ? "on" : "off"} />
      <span className="flex min-w-0 items-baseline gap-2">
        <b className="truncate text-13 font-semibold text-ink">{label}</b>
        <span className="shrink-0 text-12 text-ink-3 tabular">
          {runningLabel(totals.up.length, totals.members.length)}
        </span>
      </span>
    </span>
  );
}

function ProjectActions({
  label,
  running,
  entries,
  act,
}: {
  label: string;
  running: boolean;
  entries: MenuEntry[];
  act: (verb: "start" | "stop" | "restart") => void;
}) {
  return (
    <span className="inline-flex gap-0.5 opacity-0 transition-opacity duration-140 group-focus-within/head:opacity-100 group-hover/head:opacity-100 has-data-[state=open]:opacity-100">
      {running ? (
        <IconAction label="Stop project" target={label} onClick={() => act("stop")}>
          <IconPlayerStop />
        </IconAction>
      ) : (
        <IconAction label="Start project" target={label} onClick={() => act("start")}>
          <IconPlayerPlay />
        </IconAction>
      )}
      <IconAction label="Restart project" target={label} onClick={() => act("restart")}>
        <IconRefresh />
      </IconAction>
      <MoreMenu entries={entries} target={label} />
    </span>
  );
}

/**
 * The header of a Compose project: its icon, name and how much of it runs, with its containers
 * nested under it and its totals under the CPU and memory columns.
 */
export function ProjectRow({
  group,
  members,
  usage,
  collapsed,
  onCollapse,
  cells,
  act,
}: ProjectRowProps) {
  const label = group.project ?? "Standalone";
  const totals: Totals = { members, up: members.filter(isRunning), usage };
  const project = useProjectMenu(label);
  const run = (verb: "start" | "stop" | "restart") =>
    act(verb === "stop" ? totals.up : members, verb, label);
  const menu: MenuEntry[] = [
    totals.up.length > 0
      ? { label: "Stop Project", icon: <IconPlayerStop />, onSelect: () => run("stop") }
      : { label: "Start Project", icon: <IconPlayerPlay />, onSelect: () => run("start") },
    { label: "Restart Project", icon: <IconRefresh />, onSelect: () => run("restart") },
    { kind: "separator" },
    ...project.entries,
  ];
  const first = cells.columns.findIndex((column) => TOTALS.includes(column));
  const lead = (first === -1 ? cells.columns.length : first) + (cells.select ? 1 : 0);
  const row = (
    <tr className="group/head h-10 bg-bg data-[state=open]:bg-hover [&>td]:border-b-[0.5px] [&>td]:border-line [&>td]:px-2.5">
      <td colSpan={lead} className="max-w-0">
        <Title
          label={label}
          project={group.project !== null}
          totals={totals}
          collapsed={collapsed}
          onCollapse={onCollapse}
        />
      </td>
      {cells.columns.slice(lead - (cells.select ? 1 : 0)).map((column) => (
        <TotalCell key={column} column={column} totals={totals} />
      ))}
      {cells.actions ? (
        <td className="text-right">
          {group.project ? (
            <ProjectActions
              label={label}
              running={totals.up.length > 0}
              entries={project.entries}
              act={run}
            />
          ) : null}
        </td>
      ) : null}
    </tr>
  );
  if (!group.project) {
    return row;
  }
  return (
    <>
      <ContextMenu entries={menu}>{row}</ContextMenu>
      {project.sheet}
    </>
  );
}
