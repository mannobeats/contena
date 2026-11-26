import { IconLogs } from "@tabler/icons-react";
import { Link, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";

import { useContainers } from "@/features/containers/api";
import { useMetrics } from "@/features/metrics/api";
import { formatAge, formatMemory } from "@/lib/format";
import type { PodSummary } from "@/lib/ipc/bindings";
import { Chip } from "@/ui/chip";
import { rowActions } from "@/ui/classes";
import { Dash } from "@/ui/dash";
import { DataTable } from "@/ui/data-table";
import { IconAction } from "@/ui/icon-action";
import { type MenuEntry, MoreMenu } from "@/ui/menu";
import { StatusLabel } from "@/ui/status-label";
import type { Column } from "@/ui/table-layout";
import { Tile } from "@/ui/tile";

import type { KubeSheet } from "./kube-sheet";
import { podMemory } from "./model";
import { podMenu, podTileState } from "./pod-actions";

type Open = (sheet: KubeSheet) => void;

function PodName({ pod }: { pod: PodSummary }) {
  return (
    <Link
      to="/kubernetes/pods/$namespace/$name"
      params={{ namespace: pod.namespace, name: pod.name }}
      className="flex min-w-0 items-center gap-2 text-inherit no-underline"
    >
      <Tile icon="pod" state={podTileState(pod)} />
      <span className="truncate font-medium text-ink">{pod.name}</span>
    </Link>
  );
}

function PodStatus({ pod }: { pod: PodSummary }) {
  if (pod.problem) {
    return <StatusLabel tone="bad" label={pod.problem} />;
  }
  const tone = { Running: "running", Pending: "busy", Completed: "done" } as const;
  return (
    <StatusLabel tone={tone[pod.status as keyof typeof tone] ?? "stopped"} label={pod.status} />
  );
}

function PodActions({ pod, menu, logs }: { pod: PodSummary; menu: MenuEntry[]; logs: () => void }) {
  return (
    <span className={rowActions}>
      <IconAction label="Logs" target={pod.name} onClick={logs}>
        <IconLogs />
      </IconAction>
      <MoreMenu entries={menu} target={pod.name} />
    </span>
  );
}

type Show = (pod: PodSummary, tab?: string) => void;

function rowMenu(pod: PodSummary, show: Show, open: Open): MenuEntry[] {
  return [
    { label: "Open", onSelect: () => show(pod) },
    { label: "Logs", onSelect: () => show(pod, "logs") },
    {
      label: "Terminal",
      disabled: pod.status !== "Running",
      onSelect: () => show(pod, "terminal"),
    },
    { label: "Events", onSelect: () => show(pod, "events") },
    { kind: "separator" },
    ...podMenu(pod, open),
  ];
}

function columns(memory: Map<string, number>, show: Show, open: Open): Column<PodSummary>[] {
  const bytes = (pod: PodSummary) => memory.get(`${pod.namespace}/${pod.name}`);
  return [
    {
      id: "name",
      header: "Name",
      minWidth: 200,
      sortValue: (pod) => pod.name,
      cell: (pod) => <PodName pod={pod} />,
    },
    {
      id: "namespace",
      header: "Namespace",
      width: 140,
      optional: true,
      sortValue: (pod) => pod.namespace,
      cell: (pod) => <Chip>{pod.namespace}</Chip>,
    },
    {
      id: "status",
      header: "Status",
      width: 170,
      sortValue: (pod) => pod.problem ?? pod.status,
      cell: (pod) => <PodStatus pod={pod} />,
    },
    {
      id: "ready",
      header: "Ready",
      width: 64,
      align: "right",
      cell: (pod) => `${pod.ready}/${pod.containers.length}`,
    },
    {
      id: "restarts",
      header: "Restarts",
      width: 76,
      align: "right",
      cell: (pod) => (
        <span className={clsx(pod.restarts > 5 && "text-bad-ink")}>{pod.restarts}</span>
      ),
    },
    {
      id: "memory",
      header: "Memory",
      width: 88,
      align: "right",
      cell: (pod) => (bytes(pod) ? formatMemory(bytes(pod) ?? 0) : <Dash />),
    },
    {
      id: "age",
      header: "Age",
      width: 60,
      align: "right",
      cell: (pod) => <span className="text-ink-3">{formatAge(pod.createdAt)}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      hiddenHeader: true,
      width: 84,
      align: "right",
      cell: (pod) => (
        <PodActions pod={pod} menu={rowMenu(pod, show, open)} logs={() => show(pod, "logs")} />
      ),
    },
  ];
}

export function PodsTable({ pods, open }: { pods: PodSummary[]; open: Open }) {
  const { data: containers } = useContainers();
  const { data: metrics } = useMetrics();
  const navigate = useNavigate();
  const show: Show = (pod, tab) =>
    navigate({
      to: "/kubernetes/pods/$namespace/$name",
      params: { namespace: pod.namespace, name: pod.name },
      search: tab ? { tab } : {},
    });
  return (
    <DataTable
      layoutKey="kube-pods"
      label="Pods"
      columns={columns(podMemory(containers, metrics), show, open)}
      menu={(pod) => rowMenu(pod, show, open)}
      rows={pods}
      rowKey={(pod) => `${pod.namespace}/${pod.name}`}
      muted={(pod) => pod.status === "Completed"}
    />
  );
}
