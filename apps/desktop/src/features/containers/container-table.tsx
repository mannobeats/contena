import { useNavigate } from "@tanstack/react-router";

import type { ContainerSummary, ContainerUsage } from "@/lib/ipc/bindings";
import type { Selection } from "@/lib/use-selection";
import { DataTable } from "@/ui/data-table";
import type { Column } from "@/ui/table-layout";

import { useRecreate } from "./api";
import type { ContainerCallbacks } from "./container-callbacks";
import { CONTAINERS_TABLE } from "./container-columns";
import { containerMenu } from "./container-menu";
import { type ContainerGroup, isRunning } from "./model";
import { ProjectRow } from "./project-row";
import { RowActions } from "./row-actions";

type ContainerTableProps = ContainerCallbacks & {
  groups: ContainerGroup[];
  /** Each group's containers before filtering, by group `id`, for its project actions. */
  members: Map<string, ContainerSummary[]>;
  columns: Column<ContainerSummary>[];
  usage: Map<string, ContainerUsage>;
  selection: Selection;
  collapsed: ReadonlySet<string>;
  onCollapse: (group: string) => void;
};

export function ContainerTable({
  groups,
  members,
  columns,
  usage,
  selection,
  collapsed,
  onCollapse,
  act,
  remove,
}: ContainerTableProps) {
  const navigate = useNavigate();
  const recreate = useRecreate();
  const open = (container: ContainerSummary, tab?: string) =>
    navigate({ to: "/containers/$id", params: { id: container.id }, search: tab ? { tab } : {} });
  const menu = (container: ContainerSummary) =>
    containerMenu(container, {
      open: (tab) => open(container, tab),
      act: (action) => act([container], action),
      remove: () => remove([container]),
      recreate: (pull) => recreate.mutate({ id: container.id, name: container.name, pull }),
    });
  return (
    <DataTable
      layoutKey={CONTAINERS_TABLE}
      label="Containers"
      columns={columns}
      rowKey={(container) => container.id}
      rowLabel={(container) => container.name}
      muted={(container) => !isRunning(container)}
      menu={menu}
      actionsWidth={124}
      actions={(container) => (
        <RowActions
          container={container}
          menu={menu(container)}
          act={act}
          onTerminal={() => open(container, "terminal")}
        />
      )}
      select={{ selection, all: "Select all containers" }}
      groups={groups.map((group) => ({
        id: group.id,
        rows: group.containers,
        collapsed: collapsed.has(group.id),
        head: (cells) => (
          <ProjectRow
            group={group}
            members={members.get(group.id) ?? group.containers}
            usage={usage}
            collapsed={collapsed.has(group.id)}
            onCollapse={() => onCollapse(group.id)}
            cells={cells}
            act={act}
          />
        ),
      }))}
    />
  );
}
