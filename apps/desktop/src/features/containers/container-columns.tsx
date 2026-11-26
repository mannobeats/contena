import { formatMemory, formatPercent } from "@/lib/format";
import type { ContainerSummary, ContainerUsage } from "@/lib/ipc/bindings";
import { Dash } from "@/ui/dash";
import type { Column } from "@/ui/table-layout";
import { ContainerImage, ContainerName } from "./container-cells";
import { ContainerStatus } from "./container-status";
import { isRunning, shortName, statusParts } from "./model";
import { PortChips } from "./port-chips";

export const CONTAINERS_TABLE = "containers";

/** The columns, also read by the page to order its selection the way the table sorts. */
export function containerColumns(usage: Map<string, ContainerUsage>): Column<ContainerSummary>[] {
  const live = (container: ContainerSummary) =>
    isRunning(container) ? usage.get(container.id) : undefined;
  return [
    {
      id: "name",
      header: "Name",
      minWidth: 180,
      sortValue: shortName,
      cell: (container) => <ContainerName container={container} />,
    },
    {
      id: "image",
      header: "Image",
      width: 200,
      optional: true,
      priority: 1,
      sortValue: (container) => container.image,
      className: "font-mono text-mono-12 text-ink-3",
      cell: (container) => <ContainerImage image={container.image} />,
    },
    {
      id: "ports",
      header: "Ports",
      width: 140,
      optional: true,
      priority: 2,
      sortValue: (container) => container.ports.find((port) => port.host !== null)?.host ?? null,
      cell: (container) => <PortChips ports={container.ports} />,
    },
    {
      id: "cpu",
      header: "CPU",
      width: 72,
      align: "right",
      optional: true,
      priority: 3,
      sortValue: (container) => live(container)?.cpuPercent ?? null,
      cell: (container) =>
        isRunning(container) ? formatPercent(live(container)?.cpuPercent ?? null) : <Dash />,
    },
    {
      id: "memory",
      header: "Memory",
      width: 96,
      align: "right",
      optional: true,
      priority: 4,
      sortValue: (container) => live(container)?.memoryBytes ?? null,
      cell: (container) => {
        const bytes = live(container)?.memoryBytes;
        return bytes === undefined ? <Dash /> : formatMemory(bytes);
      },
    },
    {
      id: "status",
      header: "Status",
      width: 230,
      sortValue: (container) => statusRank(container),
      cell: (container) => <ContainerStatus container={container} />,
    },
  ];
}

/** Sorting by status puts what needs attention first, then what runs, then the rest. */
function statusRank(container: ContainerSummary): number {
  return { bad: 0, warn: 1, busy: 2, running: 3, paused: 4, stopped: 5, done: 5 }[
    statusParts(container).tone
  ];
}
