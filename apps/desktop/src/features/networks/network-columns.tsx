import type { ContainerSummary, NetworkSummary } from "@/lib/ipc/bindings";
import { logoFor } from "@/lib/logos";
import { Chip } from "@/ui/chip";
import { Dash } from "@/ui/dash";
import { FaceStack } from "@/ui/face-stack";
import type { Column } from "@/ui/table-layout";
import { NetworkName } from "./network-cells";

export const NETWORKS_TABLE = "networks";

export function networkColumns(containers: ContainerSummary[]): Column<NetworkSummary>[] {
  const faces = (network: NetworkSummary) =>
    network.containers.map((name) => {
      const container = containers.find((candidate) => candidate.name === name);
      return {
        id: container?.id ?? name,
        name,
        running: container?.state === "running",
        logo: logoFor(container?.image),
      };
    });
  return [
    {
      id: "name",
      header: "Name",
      minWidth: 200,
      sortValue: (network) => network.name,
      cell: (network) => <NetworkName network={network} />,
    },
    {
      id: "project",
      priority: 2,
      header: "Project",
      width: 140,
      optional: true,
      sortValue: (network) => network.project,
      cell: (network) => (network.project ? <Chip>{network.project}</Chip> : <Dash />),
    },
    {
      id: "driver",
      header: "Driver",
      width: 96,
      sortValue: (network) => network.driver,
      cell: (network) => network.driver,
    },
    {
      id: "subnet",
      header: "Subnet",
      width: 150,
      sortValue: (network) => network.subnet,
      className: "font-mono text-mono-12",
      cell: (network) => network.subnet ?? <Dash />,
    },
    {
      id: "gateway",
      priority: 1,
      header: "Gateway",
      width: 130,
      optional: true,
      className: "font-mono text-mono-12 text-ink-3",
      cell: (network) => network.gateway ?? <Dash />,
    },
    {
      id: "containers",
      header: "Containers",
      width: 230,
      sortValue: (network) => network.containers.length,
      cell: (network) => <FaceStack faces={faces(network)} />,
    },
  ];
}
