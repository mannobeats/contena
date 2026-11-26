import type { ContainerSummary } from "@/lib/ipc/bindings";
import type { StatusTone } from "@/ui/status-label";

export type Filter = "all" | "running" | "stopped" | "crashed";

export type ContainerGroup = { id: string; project: string | null; containers: ContainerSummary[] };

export const isRunning = (container: ContainerSummary) =>
  container.state === "running" || container.state === "restarting";

/** `Exited (137) 2 minutes ago` → 137. `null` for a clean exit or a running container. */
export function exitCode(container: ContainerSummary): number | null {
  const match = /^Exited \((\d+)\)/.exec(container.status);
  const code = match?.[1] === undefined ? 0 : Number(match[1]);
  return code === 0 ? null : code;
}

/**
 * 143 (128 + SIGTERM) is what `docker stop` leaves when the process doesn't trap the signal, so it
 * isn't an error. 137 is, since an out-of-memory kill and `docker kill` look the same.
 */
export const isErrorExit = (code: number) => code !== 0 && code !== 143;

export function isCrashed(container: ContainerSummary): boolean {
  const code = exitCode(container);
  return container.state === "dead" || (code !== null && isErrorExit(code));
}

export function matches(container: ContainerSummary, filter: Filter, query: string): boolean {
  if (filter === "running" && !isRunning(container)) {
    return false;
  }
  if (filter === "stopped" && isRunning(container)) {
    return false;
  }
  if (filter === "crashed" && !isCrashed(container)) {
    return false;
  }
  const needle = query.trim().toLowerCase();
  return (
    needle === "" ||
    [container.name, container.image, container.project ?? ""].some((field) =>
      field.toLowerCase().includes(needle),
    )
  );
}

/** Compose projects alphabetically, then containers that belong to none. */
export function groupByProject(containers: ContainerSummary[]): ContainerGroup[] {
  const groups = new Map<string, ContainerGroup>();
  for (const container of containers) {
    const id = container.project === null ? "standalone" : `project:${container.project}`;
    const group = groups.get(id) ?? { id, project: container.project, containers: [] };
    group.containers.push(container);
    groups.set(id, group);
  }
  return [...groups.values()].sort((a, b) => {
    if (a.project === null || b.project === null) {
      return a.project === null ? 1 : -1;
    }
    return a.project.localeCompare(b.project);
  });
}

export function filterOptions(
  containers: ContainerSummary[],
): { value: Filter; label: string; count: number }[] {
  const running = containers.filter(isRunning).length;
  const crashed = containers.filter(isCrashed).length;
  return [
    { value: "all", label: "All", count: containers.length },
    { value: "running", label: "Running", count: running },
    { value: "stopped", label: "Stopped", count: containers.length - running },
    ...(crashed > 0 ? [{ value: "crashed" as const, label: "Crashed", count: crashed }] : []),
  ];
}

export function emptyTitle(filter: Filter, query: string): string {
  if (query) {
    return `No containers match “${query}”`;
  }
  return {
    all: "No containers",
    running: "Nothing is running",
    stopped: "No stopped containers",
    crashed: "Nothing has crashed",
  }[filter];
}

export type StatusParts = { tone: StatusTone; label: string; detail?: string };

const HEALTH = / \((healthy|unhealthy|health: starting)\)$/;

function runningParts(status: string): StatusParts {
  const up = status.replace(/^Up /, "").replace(HEALTH, "");
  if (status.endsWith("(unhealthy)")) {
    return { tone: "warn", label: "Unhealthy", detail: up };
  }
  return status.endsWith("(health: starting)")
    ? { tone: "busy", label: "Starting", detail: up }
    : { tone: "running", label: "Up", detail: up };
}

/**
 * Docker's status line split into a state word and when: `Exited (255) 31 hours ago` becomes
 * "Crashed 255" and "31 hours ago", so the column lines up and reads at a glance.
 */
export function statusParts(container: ContainerSummary): StatusParts {
  if (container.state === "running") {
    return runningParts(container.status);
  }
  const since = /^\w+(?: \(\d+\))? (.+)$/.exec(container.status)?.[1];
  const detail = since ? { detail: since } : {};
  switch (container.state) {
    case "paused":
      return { tone: "paused", label: "Paused" };
    case "restarting":
      return { tone: "busy", label: "Restarting", ...detail };
    case "created":
      return { tone: "stopped", label: "Created" };
    case "removing":
      return { tone: "busy", label: "Removing" };
    case "dead":
      return { tone: "bad", label: "Dead" };
    default: {
      const code = exitCode(container);
      return code !== null && isErrorExit(code)
        ? { tone: "bad", label: `Crashed ${code}`, ...detail }
        : { tone: "stopped", label: "Exited", ...detail };
    }
  }
}

/** What a dismissed crash notice remembers: the same container crashing another way is news. */
export const crashKey = (container: ContainerSummary) =>
  `${container.id}:${exitCode(container) ?? container.state}`;

/**
 * A Compose container's name without its project in front: under the `shop` header,
 * `shop-api-1` reads as `api-1`. Standalone containers keep their whole name.
 */
export function shortName(container: ContainerSummary): string {
  const { project, name } = container;
  if (!project) {
    return name;
  }
  for (const separator of ["-", "_"]) {
    const prefix = `${project}${separator}`;
    if (name.startsWith(prefix) && name.length > prefix.length) {
      return name.slice(prefix.length);
    }
  }
  return name;
}

/** "2 of 5 running", or "3 containers running" when all are. */
export const runningLabel = (up: number, all: number) =>
  up === all ? `${all} running` : `${up} of ${all} running`;
