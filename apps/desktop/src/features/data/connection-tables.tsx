import { IconKey, IconLock } from "@tabler/icons-react";
import { Link, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import type { ReactNode } from "react";

import { copyText } from "@/lib/clipboard";
import { shortImage } from "@/lib/format";
import type { Connection, Detected, Environment } from "@/lib/ipc/bindings";
import { buttonClass } from "@/ui/button-class";
import { Chip } from "@/ui/chip";
import { DataTable } from "@/ui/data-table";
import { type MenuEntry, MoreMenu } from "@/ui/menu";
import type { Column } from "@/ui/table-layout";
import { Tile } from "@/ui/tile";
import { Truncate } from "@/ui/truncate";

import { address } from "./connection-menu";
import { engineLabel, engineLogo } from "./engines";
import { useConnectionMenu } from "./use-connection-menu";

function NameCell({
  logo,
  name,
  line,
  off = false,
}: {
  logo: ReactNode;
  name: string;
  line: ReactNode;
  off?: boolean;
}) {
  return (
    <span className={clsx("flex min-w-0 items-center gap-2.5 py-2", off && "opacity-60")}>
      {logo}
      <span className="flex min-w-0 flex-col">
        <b className="truncate font-medium text-ink">{name}</b>
        <span className="truncate text-12 text-ink-3">{line}</span>
      </span>
    </span>
  );
}

function OpenLink({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Link
      to="/data/$connection"
      params={{ connection: id }}
      className={buttonClass({ size: "sm", variant: "soft" })}
    >
      {children}
    </Link>
  );
}

function detectedMenu(found: Detected, connect: () => void): MenuEntry[] {
  return [
    { label: "Connect", onSelect: connect, disabled: !(found.running && found.port) },
    { kind: "separator" },
    ...(found.port
      ? [{ label: "Copy Address", onSelect: () => copyText("Address", `localhost:${found.port}`) }]
      : []),
    { label: "Copy Container Name", onSelect: () => copyText("Name", found.containerName) },
  ];
}

const detectedColumns: Column<Detected>[] = [
  {
    id: "name",
    header: "Name",
    minWidth: 220,
    sortValue: (found) => found.containerName,
    cell: (found) => (
      <NameCell
        logo={<Tile logo={engineLogo(found.engine)} state={found.running ? "on" : "off"} />}
        name={found.containerName}
        line={found.running ? shortImage(found.image) : "Container stopped"}
        off={!found.running}
      />
    ),
  },
  {
    id: "engine",
    header: "Engine",
    width: 110,
    sortValue: (found) => engineLabel(found.engine),
    cell: (found) => engineLabel(found.engine),
  },
  {
    id: "address",
    header: "Address",
    width: 150,
    className: "font-mono text-mono-12 text-ink-3",
    cell: (found) => (found.port ? `localhost:${found.port}` : "Not published"),
  },
  {
    id: "credentials",
    priority: 1,
    header: "Credentials",
    width: 220,
    optional: true,
    className: "text-12 text-ink-3",
    cell: (found) =>
      found.passwordSource ? (
        <span className="inline-flex items-center gap-1">
          <IconKey className="size-3.5" aria-hidden /> from{" "}
          <code className="font-mono">{found.passwordSource}</code>
        </span>
      ) : (
        "No password"
      ),
  },
  {
    id: "open",
    header: "Open",
    hiddenHeader: true,
    width: 96,
    align: "right",
    cell: (found) =>
      found.running && found.port ? <OpenLink id={found.id}>Connect</OpenLink> : null,
  },
];

/** Databases running in containers; their credentials come from each container's environment. */
export function DetectedTable({ detected }: { detected: Detected[] }) {
  const navigate = useNavigate();
  const open = (id: string) =>
    navigate({ to: "/data/$connection", params: { connection: id } }).catch(() => undefined);
  return (
    <DataTable
      layoutKey="data-detected"
      label="Databases in containers"
      columns={detectedColumns}
      rows={detected}
      rowKey={(found) => found.id}
      menu={(found) => detectedMenu(found, () => open(found.id))}
    />
  );
}

const ENVIRONMENT: Record<Environment, ReactNode> = {
  production: (
    <Chip tone="bad">
      <IconLock aria-hidden />
      Production
    </Chip>
  ),
  staging: <Chip tone="warn">Staging</Chip>,
  local: <Chip>Local</Chip>,
};

type SavedTableProps = {
  connections: Connection[];
  onEdit: (connection: Connection) => void;
  onRemove: (connection: Connection) => void;
};

function savedColumns(menu: (connection: Connection) => MenuEntry[]): Column<Connection>[] {
  return [
    {
      id: "name",
      header: "Name",
      minWidth: 220,
      sortValue: (connection) => connection.name,
      cell: (connection) => (
        <NameCell
          logo={<Tile logo={engineLogo(connection.engine, connection.provider)} />}
          name={connection.name}
          line={
            connection.engine === "sqlite"
              ? "Local file"
              : (connection.provider ?? connection.database ?? engineLabel(connection.engine))
          }
        />
      ),
    },
    {
      id: "engine",
      header: "Engine",
      width: 110,
      sortValue: (connection) => engineLabel(connection.engine),
      cell: (connection) => engineLabel(connection.engine),
    },
    {
      id: "address",
      header: "Address",
      width: 200,
      className: "font-mono text-mono-12 text-ink-3",
      cell: (connection) => <Truncate text={address(connection)} />,
    },
    {
      id: "environment",
      header: "Environment",
      width: 130,
      sortValue: (connection) => connection.environment,
      cell: (connection) => ENVIRONMENT[connection.environment],
    },
    {
      id: "actions",
      header: "Actions",
      hiddenHeader: true,
      width: 108,
      align: "right",
      cell: (connection) => (
        <span className="inline-flex items-center gap-1">
          <MoreMenu entries={menu(connection)} target={connection.name} />
          <OpenLink id={connection.id}>Open</OpenLink>
        </span>
      ),
    },
  ];
}

export function SavedTable({ connections, onEdit, onRemove }: SavedTableProps) {
  const menu = useConnectionMenu({ edit: onEdit, remove: onRemove });
  return (
    <DataTable
      layoutKey="data-saved"
      label="Saved connections"
      columns={savedColumns(menu)}
      rows={connections}
      rowKey={(connection) => connection.id}
      menu={menu}
    />
  );
}
