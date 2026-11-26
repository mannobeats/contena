import { IconExternalLink, IconLock } from "@tabler/icons-react";
import { openUrl } from "@tauri-apps/plugin-opener";

import { copyText } from "@/lib/clipboard";
import type { IngressSummary, ServiceSummary } from "@/lib/ipc/bindings";
import { Chip } from "@/ui/chip";
import { Dash } from "@/ui/dash";
import { DataTable } from "@/ui/data-table";
import type { MenuEntry } from "@/ui/menu";
import type { Column } from "@/ui/table-layout";
import { Tile } from "@/ui/tile";

const open = (url: string) => () => {
  openUrl(url).catch(() => undefined);
};

const linkClass = "inline-flex items-center gap-1 text-brand-ink hover:underline";

function Name({ name }: { name: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Tile icon="network" />
      <span className="truncate font-medium text-ink">{name}</span>
    </span>
  );
}

const clusterName = (service: ServiceSummary) => `${service.name}.${service.namespace}.svc`;

function serviceMenu(service: ServiceSummary): MenuEntry[] {
  const { fromMac, clusterIp } = service;
  return [
    ...(fromMac
      ? [
          { label: "Open in Browser", onSelect: open(`http://${fromMac}`) },
          { kind: "separator" as const },
        ]
      : []),
    { label: "Copy Name", onSelect: () => copyText("Name", service.name) },
    { label: "Copy Address", onSelect: () => copyText("Address", fromMac ?? clusterName(service)) },
    ...(clusterIp ? [{ label: "Copy Cluster IP", onSelect: () => copyText("IP", clusterIp) }] : []),
  ];
}

function FromMac({ service }: { service: ServiceSummary }) {
  if (service.fromMac) {
    return (
      <button type="button" className={linkClass} onClick={open(`http://${service.fromMac}`)}>
        {service.fromMac}
        <IconExternalLink className="size-3.5" aria-hidden />
      </button>
    );
  }
  return <code className="font-mono text-mono-12 text-ink-3">{clusterName(service)}</code>;
}

export function ServicesTable({ services }: { services: ServiceSummary[] }) {
  const columns: Column<ServiceSummary>[] = [
    { id: "name", header: "Name", cell: (service) => <Name name={service.name} /> },
    {
      id: "namespace",
      header: "Namespace",
      width: 140,
      cell: (service) => <Chip>{service.namespace}</Chip>,
    },
    { id: "type", header: "Type", width: 110, cell: (service) => service.kind },
    {
      id: "cluster-ip",
      header: "Cluster IP",
      width: 120,
      cell: (service) =>
        service.clusterIp ? (
          <code className="font-mono text-mono-12">{service.clusterIp}</code>
        ) : (
          <Dash />
        ),
    },
    {
      id: "ports",
      header: "Ports",
      width: 150,
      cell: (service) => (
        <code className="font-mono text-mono-12 text-ink-3">
          {service.ports
            .map(
              (port) =>
                `${port.port}${port.target === String(port.port) ? "" : `→${port.target}`}/${port.protocol}`,
            )
            .join(", ")}
        </code>
      ),
    },
    {
      id: "from-your-mac",
      header: "From your Mac",
      cell: (service) => <FromMac service={service} />,
    },
  ];
  return (
    <DataTable
      layoutKey="kube-services"
      label="Services"
      columns={columns}
      rows={services}
      rowKey={(service) => `${service.namespace}/${service.name}`}
      menu={serviceMenu}
    />
  );
}

type Route = IngressSummary["routes"][number] & { ingress: IngressSummary };

const routeUrl = (route: Route) =>
  `${route.ingress.tls ? "https" : "http"}://${route.host}${route.path}`;

function routeMenu(route: Route): MenuEntry[] {
  return [
    { label: "Open in Browser", onSelect: open(routeUrl(route)) },
    { kind: "separator" },
    { label: "Copy URL", onSelect: () => copyText("URL", routeUrl(route)) },
    { label: "Copy Name", onSelect: () => copyText("Name", route.ingress.name) },
  ];
}

export function IngressTable({ ingresses }: { ingresses: IngressSummary[] }) {
  const routes: Route[] = ingresses.flatMap((ingress) =>
    ingress.routes.map((route) => ({ ...route, ingress })),
  );
  const columns: Column<Route>[] = [
    { id: "name", header: "Name", cell: (route) => <Name name={route.ingress.name} /> },
    {
      id: "namespace",
      header: "Namespace",
      width: 140,
      cell: (route) => <Chip>{route.ingress.namespace}</Chip>,
    },
    {
      id: "host",
      header: "Host",
      cell: (route) => (
        <button type="button" className={linkClass} onClick={open(routeUrl(route))}>
          {route.host}
        </button>
      ),
    },
    {
      id: "path",
      header: "Path",
      width: 110,
      cell: (route) => <code className="font-mono text-mono-12">{route.path}</code>,
    },
    {
      id: "backend",
      header: "Backend",
      cell: (route) => <code className="font-mono text-mono-12 text-ink-3">{route.backend}</code>,
    },
    {
      id: "tls",
      header: "TLS",
      width: 80,
      cell: (route) =>
        route.ingress.tls ? (
          <span className="inline-flex items-center gap-1">
            <IconLock className="size-3.5 text-ok-ink" aria-hidden />
            On
          </span>
        ) : (
          <span className="text-ink-3">Off</span>
        ),
    },
  ];
  return (
    <DataTable
      layoutKey="kube-ingress"
      label="Ingress"
      columns={columns}
      rows={routes}
      rowKey={(route) =>
        `${route.ingress.namespace}/${route.ingress.name}/${route.host}${route.path}`
      }
      menu={routeMenu}
    />
  );
}
