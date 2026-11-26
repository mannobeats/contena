import clsx from "clsx";

import type { DomainRoute } from "@/lib/ipc/bindings";
import { Chip } from "@/ui/chip";
import { StatusLabel } from "@/ui/status-label";
import type { Column } from "@/ui/table-layout";
import { Truncate } from "@/ui/truncate";

import { routeState } from "./model";
import { Https } from "./route-cells";

export function routeColumns(caTrusted: boolean): Column<DomainRoute>[] {
  return [
    {
      id: "domain",
      header: "Domain",
      minWidth: 220,
      sortValue: (route) => route.host,
      cell: (route) => (
        <span className="flex min-w-0 items-center gap-2">
          <Truncate
            text={route.host}
            className={clsx("font-mono text-mono-13", route.down === null && "text-ink")}
          />
          {route.kind === "custom" ? <Chip>Custom</Chip> : null}
        </span>
      ),
    },
    {
      id: "target",
      header: "Points to",
      width: 240,
      sortValue: (route) => route.container,
      cell: (route) => (
        <span className="flex min-w-0 items-center gap-1">
          <Truncate text={route.container} />
          {route.port === null ? null : (
            <span className="font-mono text-mono-12 text-ink-3">:{route.port}</span>
          )}
        </span>
      ),
    },
    {
      id: "https",
      header: "HTTPS",
      width: 120,
      optional: true,
      cell: (route) => <Https route={route} caTrusted={caTrusted} />,
    },
    {
      id: "status",
      header: "Status",
      width: 170,
      sortValue: routeState,
      cell: (route) => (
        <StatusLabel tone={route.down === null ? "running" : "stopped"} label={routeState(route)} />
      ),
    },
  ];
}
