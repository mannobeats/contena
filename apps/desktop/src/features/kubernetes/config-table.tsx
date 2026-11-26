import { copyText } from "@/lib/clipboard";
import { formatAge } from "@/lib/format";
import type { ConfigSummary } from "@/lib/ipc/bindings";
import { Chip } from "@/ui/chip";
import { DataTable } from "@/ui/data-table";
import type { MenuEntry } from "@/ui/menu";
import type { Column } from "@/ui/table-layout";
import { Tile } from "@/ui/tile";

import type { KubeSheet } from "./kube-sheet";

export function ConfigTable({
  config,
  open,
}: {
  config: ConfigSummary[];
  open: (sheet: KubeSheet) => void;
}) {
  const menu = (item: ConfigSummary): MenuEntry[] => [
    { label: "Open", onSelect: () => open({ kind: "config", config: item }) },
    { kind: "separator" },
    { label: "Copy Name", onSelect: () => copyText("Name", item.name) },
  ];
  const columns: Column<ConfigSummary>[] = [
    {
      id: "name",
      header: "Name",
      cell: (item) => (
        <button
          type="button"
          onClick={() => open({ kind: "config", config: item })}
          className="flex min-w-0 items-center gap-2 text-left"
          data-row-link
        >
          <Tile icon={item.kind === "secret" ? "settings" : "data"} />
          <span className="truncate font-medium text-ink">{item.name}</span>
        </button>
      ),
    },
    {
      id: "namespace",
      header: "Namespace",
      width: 140,
      cell: (item) => <Chip>{item.namespace}</Chip>,
    },
    {
      id: "kind",
      header: "Kind",
      width: 170,
      cell: (item) =>
        item.kind === "secret" ? (
          <span>
            Secret <span className="font-mono text-mono-12 text-ink-3">{item.secretType}</span>
          </span>
        ) : (
          "Config map"
        ),
    },
    {
      id: "keys",
      header: "Keys",
      cell: (item) => (
        <span className="flex gap-1 overflow-hidden">
          {item.keys.map((key) => (
            <Chip key={key} mono>
              {key}
            </Chip>
          ))}
        </span>
      ),
    },
    {
      id: "age",
      header: "Age",
      width: 60,
      align: "right",
      cell: (item) => <span className="text-ink-3">{formatAge(item.createdAt)}</span>,
    },
  ];
  return (
    <DataTable
      layoutKey="kube-config"
      label="Config and secrets"
      columns={columns}
      rows={config}
      rowKey={(item) => `${item.kind}/${item.namespace}/${item.name}`}
      menu={menu}
    />
  );
}
