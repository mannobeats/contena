import { IconRotateClockwise, IconScale } from "@tabler/icons-react";
import clsx from "clsx";

import { copyText } from "@/lib/clipboard";
import { formatAge } from "@/lib/format";
import type { DeploymentSummary } from "@/lib/ipc/bindings";
import { Chip } from "@/ui/chip";
import { rowActions } from "@/ui/classes";
import { DataTable } from "@/ui/data-table";
import { IconAction } from "@/ui/icon-action";
import { type MenuEntry, MoreMenu } from "@/ui/menu";
import { Meter } from "@/ui/progress";
import type { Column } from "@/ui/table-layout";
import { Tile } from "@/ui/tile";

import { editYaml, useRestartDeployment } from "./api";
import type { KubeSheet } from "./kube-sheet";

type Open = (sheet: KubeSheet) => void;

const behind = (deployment: DeploymentSummary) => deployment.ready < deployment.desired;

function Ready({ deployment }: { deployment: DeploymentSummary }) {
  return (
    <span className="flex items-center gap-2">
      <Meter
        value={deployment.desired ? deployment.ready / deployment.desired : 0}
        tone={behind(deployment) ? "bad" : "neutral"}
      />
      <span className={clsx("tabular", behind(deployment) && "text-bad-ink")}>
        {deployment.ready}/{deployment.desired}
      </span>
    </span>
  );
}

type Handlers = { open: Open; restart: (deployment: DeploymentSummary) => void };

function deploymentMenu(deployment: DeploymentSummary, { open, restart }: Handlers): MenuEntry[] {
  return [
    { label: "Scale…", onSelect: () => open({ kind: "scale", deployment }) },
    { label: "Restart Rollout", onSelect: () => restart(deployment) },
    {
      label: "Edit YAML…",
      onSelect: () => editYaml(deployment, (manifest) => open({ kind: "apply", manifest })),
    },
    { kind: "separator" },
    { label: "Copy Name", onSelect: () => copyText("Name", deployment.name) },
    { kind: "separator" },
    {
      label: "Delete Deployment…",
      danger: true,
      onSelect: () => open({ kind: "deleteDeployment", deployment }),
    },
  ];
}

function Actions({ deployment, handlers }: { deployment: DeploymentSummary; handlers: Handlers }) {
  return (
    <span className={rowActions}>
      <IconAction
        label="Scale"
        target={deployment.name}
        onClick={() => handlers.open({ kind: "scale", deployment })}
      >
        <IconScale />
      </IconAction>
      <IconAction
        label="Rollout restart"
        target={deployment.name}
        onClick={() => handlers.restart(deployment)}
      >
        <IconRotateClockwise />
      </IconAction>
      <MoreMenu entries={deploymentMenu(deployment, handlers)} target={deployment.name} />
    </span>
  );
}

export function DeploymentsTable({
  deployments,
  open,
}: {
  deployments: DeploymentSummary[];
  open: Open;
}) {
  const restart = useRestartDeployment();
  const handlers: Handlers = { open, restart: (deployment) => restart.mutate(deployment) };
  const columns: Column<DeploymentSummary>[] = [
    {
      id: "name",
      header: "Name",
      cell: (deployment) => (
        <span className="flex min-w-0 items-center gap-2">
          <Tile icon="image" state={behind(deployment) ? "bad" : "on"} />
          <span className="truncate font-medium text-ink">{deployment.name}</span>
        </span>
      ),
    },
    {
      id: "namespace",
      header: "Namespace",
      width: 140,
      cell: (deployment) => <Chip>{deployment.namespace}</Chip>,
    },
    {
      id: "ready",
      header: "Ready",
      width: 120,
      cell: (deployment) => <Ready deployment={deployment} />,
    },
    {
      id: "up-to-date",
      header: "Up to date",
      width: 88,
      align: "right",
      cell: (deployment) => deployment.upToDate,
    },
    {
      id: "available",
      header: "Available",
      width: 80,
      align: "right",
      cell: (deployment) => deployment.available,
    },
    {
      id: "image",
      header: "Image",
      cell: (deployment) => (
        <code className="font-mono text-mono-12 text-ink-3">{deployment.images.join(", ")}</code>
      ),
    },
    {
      id: "age",
      header: "Age",
      width: 60,
      align: "right",
      cell: (deployment) => <span className="text-ink-3">{formatAge(deployment.createdAt)}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      hiddenHeader: true,
      width: 112,
      align: "right",
      cell: (deployment) => <Actions deployment={deployment} handlers={handlers} />,
    },
  ];
  return (
    <DataTable
      layoutKey="kube-deployments"
      label="Deployments"
      columns={columns}
      rows={deployments}
      rowKey={(deployment) => `${deployment.namespace}/${deployment.name}`}
      menu={(deployment) => deploymentMenu(deployment, handlers)}
    />
  );
}
