import { useNavigate } from "@tanstack/react-router";

import { copyText } from "@/lib/clipboard";
import type { NetworkSummary } from "@/lib/ipc/bindings";
import type { Selection } from "@/lib/use-selection";
import { DataTable } from "@/ui/data-table";
import { type MenuEntry, MoreMenu } from "@/ui/menu";
import type { Column } from "@/ui/table-layout";

import { undeletable } from "./model";
import { NETWORKS_TABLE } from "./network-columns";

type NetworkTableProps = {
  networks: NetworkSummary[];
  columns: Column<NetworkSummary>[];
  onDelete: (network: NetworkSummary) => void;
  selection: Selection;
};

export function NetworkTable({ networks, columns, onDelete, selection }: NetworkTableProps) {
  const navigate = useNavigate();
  const menu = (network: NetworkSummary): MenuEntry[] => {
    const { subnet } = network;
    const blocked = undeletable(network);
    return [
      {
        label: "Open",
        onSelect: () => navigate({ to: "/networks/$id", params: { id: network.id } }),
      },
      ...(subnet ? [{ label: "Copy Subnet", onSelect: () => copyText("Subnet", subnet) }] : []),
      { kind: "separator" },
      network.builtIn
        ? { label: "Built-in Networks Can't Be Deleted", disabled: true, onSelect: () => undefined }
        : {
            label: blocked ? "Delete (in use)" : "Delete Network…",
            danger: true,
            disabled: blocked !== undefined,
            onSelect: () => onDelete(network),
          },
    ];
  };
  return (
    <DataTable
      layoutKey={NETWORKS_TABLE}
      label="Networks"
      columns={columns}
      rows={networks}
      rowKey={(network) => network.id}
      rowLabel={(network) => network.name}
      menu={menu}
      actionsWidth={52}
      actions={(network) => <MoreMenu entries={menu(network)} target={network.name} />}
      select={{
        selection,
        all: "Select all networks that can be deleted",
        blocked: undeletable,
      }}
    />
  );
}
