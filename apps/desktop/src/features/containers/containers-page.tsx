import { useState } from "react";

import { newDraft } from "@/features/compose/model";
import { useCompose } from "@/features/compose/store";
import { usageById, useMetrics } from "@/features/metrics/api";
import type { ContainerAction, ContainerSummary } from "@/lib/ipc/bindings";
import { useIdSet } from "@/lib/use-id-set";
import { useSelection, useSelectionKeys } from "@/lib/use-selection";
import { Crumb, Page } from "@/shell/page";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { ListSection } from "@/ui/list-section";
import { Segmented } from "@/ui/segmented";
import { type Column, useRowOrder } from "@/ui/table-layout";
import { Tile } from "@/ui/tile";
import { useContainerAction, useContainers } from "./api";
import { BulkBar } from "./bulk-bar";
import { CONTAINERS_TABLE, containerColumns } from "./container-columns";
import { ContainerTable } from "./container-table";
import { ContainersHero } from "./containers-hero";
import { CrashNotice } from "./crash-notice";
import { DeleteSheet } from "./delete-sheet";
import {
  type ContainerGroup,
  emptyTitle,
  type Filter,
  filterOptions,
  groupByProject,
  isCrashed,
  matches,
} from "./model";
import { useRunSheet } from "./run/api";
import { ToolsBanner } from "./tools-banner";

function NoContainers() {
  const showRunSheet = useRunSheet((state) => state.show);
  const edit = useCompose((state) => state.edit);
  return (
    <EmptyState
      art={<Tile icon="container" size="xl" />}
      title="No containers yet"
      className="h-full"
      actions={
        <>
          <Button onClick={() => edit(newDraft())}>Deploy Compose</Button>
          <Button variant="brand" onClick={() => showRunSheet()}>
            Run container
          </Button>
        </>
      }
    >
      Run one, deploy a Compose project or drop a compose.yaml here. Containers started with{" "}
      <code className="font-mono text-mono-13">docker run</code> show up at once.
    </EmptyState>
  );
}

/** Containers the list shows: Kubernetes pods live under Kubernetes instead. */
function useListedContainers() {
  const { data } = useContainers();
  return data?.filter((container) => container.pod === null);
}

/** The rows in the order they show, so ⇧-click selects what lies between. */
function useContainerSelection(
  groups: ContainerGroup[],
  columns: Column<ContainerSummary>[],
  all: ContainerSummary[],
  onDelete: (containers: ContainerSummary[]) => void,
) {
  const order = useRowOrder(CONTAINERS_TABLE, columns);
  const selection = useSelection(
    groups.flatMap((group) => order(group.containers).map((container) => container.id)),
  );
  const chosen = all.filter((container) => selection.has(container.id));
  useSelectionKeys(selection, () => onDelete(chosen));
  return { selection, chosen };
}

export function ContainersPage() {
  const containers = useListedContainers();
  if (containers?.length === 0) {
    return (
      <Page crumbs={<Crumb>Containers</Crumb>}>
        <div className="flex h-full flex-col pt-3">
          <ToolsBanner />
          <div className="min-h-0 flex-1">
            <NoContainers />
          </div>
        </div>
      </Page>
    );
  }
  return <ContainerList containers={containers} />;
}

/** The state filter and the search, and what they leave in view. */
function useContainerFilter(all: ContainerSummary[]) {
  const [chosen, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  // Once the last crashed container is gone, so is its filter.
  const filter = chosen === "crashed" && !all.some(isCrashed) ? "all" : chosen;
  const visible = all.filter((container) => matches(container, filter, query));
  return { filter, setFilter, query, setQuery, visible };
}

/** The page once there is something to list; `undefined` while the first read is on its way. */
function ContainerList({ containers }: { containers: ContainerSummary[] | undefined }) {
  const { data: metrics } = useMetrics();
  const action = useContainerAction();
  const all = containers ?? [];
  const { filter, setFilter, query, setQuery, visible } = useContainerFilter(all);
  const [hot, setHot] = useState<string | null>(null);
  const [removing, setRemoving] = useState<ContainerSummary[]>([]);
  const collapsed = useIdSet();
  const groups = groupByProject(visible);
  const usage = usageById(metrics);
  const columns = containerColumns(usage);
  const { selection, chosen } = useContainerSelection(groups, columns, all, setRemoving);
  const act = (targets: ContainerSummary[], verb: ContainerAction, label?: string) =>
    action.mutate({ containers: targets, action: verb, ...(label ? { label } : {}) });
  const finish = (targets: ContainerSummary[], verb: ContainerAction) => {
    act(targets, verb);
    selection.clear();
    setRemoving([]);
  };
  return (
    <Page crumbs={<Crumb>Containers</Crumb>}>
      <ContainersHero containers={containers} ledger={metrics?.ledger} hot={hot} onHot={setHot} />
      <ToolsBanner />
      <CrashNotice containers={all} onShow={() => setFilter("crashed")} />
      <ListSection
        query={query}
        onQuery={setQuery}
        placeholder="Filter containers"
        filter={
          <Segmented
            label="Show"
            value={filter}
            onChange={setFilter}
            options={filterOptions(all)}
          />
        }
      >
        {containers && visible.length === 0 ? (
          <EmptyState
            title={emptyTitle(filter, query)}
            actions={query ? <Button onClick={() => setQuery("")}>Clear search</Button> : null}
          />
        ) : (
          <ContainerTable
            groups={groups}
            members={new Map(groupByProject(all).map((group) => [group.id, group.containers]))}
            columns={columns}
            usage={usage}
            selection={selection}
            collapsed={collapsed.ids}
            onCollapse={collapsed.toggle}
            act={act}
            remove={setRemoving}
          />
        )}
      </ListSection>
      <BulkBar
        count={chosen.length}
        onAct={(verb) => finish(chosen, verb)}
        onRemove={() => setRemoving(chosen)}
        onClear={selection.clear}
      />
      <DeleteSheet
        containers={removing}
        onCancel={() => setRemoving([])}
        onConfirm={() => finish(removing, "remove")}
      />
    </Page>
  );
}
