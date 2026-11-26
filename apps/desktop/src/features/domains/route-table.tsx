import { IconCopy, IconExternalLink } from "@tabler/icons-react";
import { openUrl } from "@tauri-apps/plugin-opener";

import { copyText } from "@/lib/clipboard";
import type { DomainRoute, DomainsStatus } from "@/lib/ipc/bindings";
import { CxIcon } from "@/ui/cx-icon";
import { DataTable } from "@/ui/data-table";
import { EmptyState } from "@/ui/empty-state";
import { IconAction } from "@/ui/icon-action";
import { type MenuEntry, MoreMenu } from "@/ui/menu";

import { groupRoutes, routeUrl } from "./model";
import { routeColumns } from "./route-columns";

const GROUP_ICONS = { custom: "domain", container: "container", service: "kube" } as const;

type RouteTableProps = {
  status: DomainsStatus;
  onEdit: (route: DomainRoute) => void;
  onRemove: (route: DomainRoute) => void;
};

export function RouteTable({ status, onEdit, onRemove }: RouteTableProps) {
  const groups = groupRoutes(status.routes);
  if (groups.length === 0) {
    return (
      <EmptyState title="No routes yet">
        Containers get a name as soon as they run. Add your own with Add route.
      </EmptyState>
    );
  }
  const url = (route: DomainRoute) => routeUrl(route, status.ports);
  const open = (route: DomainRoute) => openUrl(url(route)).catch(() => undefined);
  const copyUrl = (route: DomainRoute) => copyText("URL", url(route));
  const menu = (route: DomainRoute): MenuEntry[] => [
    { label: "Open in Browser", onSelect: () => open(route), disabled: route.down !== null },
    { kind: "separator" },
    { label: "Copy URL", onSelect: () => copyUrl(route) },
    { label: "Copy curl Command", onSelect: () => copyText("Command", `curl -sS ${url(route)}`) },
    ...(route.kind === "custom"
      ? [
          { kind: "separator" as const },
          { label: "Edit Route…", onSelect: () => onEdit(route) },
          { kind: "separator" as const },
          { label: "Remove Route…", danger: true, onSelect: () => onRemove(route) },
        ]
      : []),
  ];
  return (
    <DataTable
      layoutKey="domains"
      label="Domains"
      columns={routeColumns(status.caTrusted)}
      rowKey={(route) => route.host}
      muted={(route) => route.down !== null}
      menu={menu}
      actionsWidth={104}
      actions={(route) => (
        <>
          <IconAction
            label="Open in browser"
            target={route.host}
            disabled={route.down !== null}
            onClick={() => open(route)}
          >
            <IconExternalLink />
          </IconAction>
          <IconAction label="Copy URL" target={route.host} onClick={() => copyUrl(route)}>
            <IconCopy />
          </IconAction>
          <MoreMenu entries={menu(route)} target={route.host} />
        </>
      )}
      groups={groups.map((group) => ({
        id: group.kind,
        rows: group.routes,
        head: ({ span }) => (
          <tr className="h-[34px] [&>td]:border-b-[0.5px] [&>td]:border-line">
            <td colSpan={span} className="pt-2.5 text-12 font-semibold text-ink-2">
              <span className="flex items-center gap-2">
                <CxIcon name={GROUP_ICONS[group.kind]} className="size-3.5 text-ink-3" />
                {group.label}
                <span className="font-[450] text-ink-3 tabular">{group.routes.length}</span>
              </span>
            </td>
          </tr>
        ),
      }))}
    />
  );
}
