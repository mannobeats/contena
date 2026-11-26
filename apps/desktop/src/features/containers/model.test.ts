import { describe, expect, it } from "vitest";

import type { ContainerSummary } from "@/lib/ipc/bindings";

import {
  crashKey,
  emptyTitle,
  exitCode,
  filterOptions,
  groupByProject,
  isCrashed,
  matches,
  runningLabel,
  shortName,
  statusParts,
} from "./model";

function container(overrides: Partial<ContainerSummary>): ContainerSummary {
  return {
    id: "id",
    name: "web",
    image: "nginx:1.29",
    state: "running",
    status: "Up 2 hours",
    project: null,
    service: null,
    pod: null,
    ports: [],
    createdAt: 0,
    ...overrides,
  };
}

describe("exitCode", () => {
  it("reads the code from Docker's status line", () => {
    expect(exitCode(container({ state: "exited", status: "Exited (137) 2 minutes ago" }))).toBe(
      137,
    );
    expect(exitCode(container({ state: "exited", status: "Exited (0) 1 hour ago" }))).toBeNull();
    expect(exitCode(container({}))).toBeNull();
  });

  it("treats a non-zero exit as a crash", () => {
    expect(isCrashed(container({ state: "exited", status: "Exited (1) now" }))).toBe(true);
    expect(isCrashed(container({ state: "exited", status: "Exited (0) now" }))).toBe(false);
  });

  it("doesn't call a container that docker stop ended with SIGTERM crashed", () => {
    expect(isCrashed(container({ state: "exited", status: "Exited (143) now" }))).toBe(false);
    expect(isCrashed(container({ state: "exited", status: "Exited (137) now" }))).toBe(true);
  });
});

describe("matches", () => {
  it("filters by state and searches name, image and project", () => {
    const db = container({ name: "shop-db-1", image: "postgres:18", project: "shop" });
    expect(matches(db, "all", "post")).toBe(true);
    expect(matches(db, "all", "SHOP")).toBe(true);
    expect(matches(db, "stopped", "")).toBe(false);
    expect(matches(db, "running", "redis")).toBe(false);
  });
});

describe("groupByProject", () => {
  it("sorts projects by name and keeps standalone containers last", () => {
    const groups = groupByProject([
      container({ name: "loose" }),
      container({ name: "b1", project: "blog" }),
      container({ name: "s1", project: "shop" }),
      container({ name: "b2", project: "blog" }),
    ]);
    expect(groups.map((group) => [group.id, group.containers.map((c) => c.name)])).toEqual([
      ["project:blog", ["b1", "b2"]],
      ["project:shop", ["s1"]],
      ["standalone", ["loose"]],
    ]);
  });

  it("keeps a project named standalone apart from containers in no project", () => {
    const groups = groupByProject([
      container({ name: "loose" }),
      container({ name: "p1", project: "standalone" }),
    ]);
    expect(new Set(groups.map((group) => group.id)).size).toBe(2);
    expect(groups.map((group) => group.containers.map((c) => c.name))).toEqual([["p1"], ["loose"]]);
  });
});

describe("filterOptions", () => {
  it("counts running and stopped containers", () => {
    const options = filterOptions([
      container({}),
      container({ state: "exited", status: "Exited (0) now" }),
    ]);
    expect(options.map((option) => option.count)).toEqual([2, 1, 1]);
  });
});

describe("emptyTitle", () => {
  it("names the search, or what the filter hides", () => {
    expect(emptyTitle("all", "redis")).toBe("No containers match “redis”");
    expect(emptyTitle("running", "")).toBe("Nothing is running");
    expect(emptyTitle("stopped", "")).toBe("No stopped containers");
  });
});

describe("statusParts", () => {
  it("splits a crash into its code and when", () => {
    expect(
      statusParts(container({ state: "exited", status: "Exited (255) 31 hours ago" })),
    ).toEqual({ tone: "bad", label: "Crashed 255", detail: "31 hours ago" });
  });

  it("keeps a clean exit quiet", () => {
    expect(statusParts(container({ state: "exited", status: "Exited (0) 5 days ago" }))).toEqual({
      tone: "stopped",
      label: "Exited",
      detail: "5 days ago",
    });
  });

  it("reads uptime and health from a running container", () => {
    expect(statusParts(container({ status: "Up 7 seconds" }))).toEqual({
      tone: "running",
      label: "Up",
      detail: "7 seconds",
    });
    expect(statusParts(container({ status: "Up 2 hours (unhealthy)" }))).toEqual({
      tone: "warn",
      label: "Unhealthy",
      detail: "2 hours",
    });
    expect(statusParts(container({ status: "Up 1 second (health: starting)" })).tone).toBe("busy");
  });

  it("names the other states", () => {
    expect(statusParts(container({ state: "paused", status: "Up 1 hour (Paused)" })).label).toBe(
      "Paused",
    );
    expect(statusParts(container({ state: "created", status: "Created" })).label).toBe("Created");
    expect(statusParts(container({ state: "dead", status: "Dead" })).tone).toBe("bad");
  });
});

describe("the crashed filter", () => {
  const crashed = container({ id: "c", state: "exited", status: "Exited (1) now" });

  it("is offered only while something has crashed", () => {
    expect(filterOptions([container({})]).map((option) => option.value)).not.toContain("crashed");
    expect(filterOptions([crashed]).at(-1)).toEqual({
      value: "crashed",
      label: "Crashed",
      count: 1,
    });
  });

  it("keeps only crashed containers", () => {
    expect(matches(crashed, "crashed", "")).toBe(true);
    expect(matches(container({}), "crashed", "")).toBe(false);
    expect(emptyTitle("crashed", "")).toBe("Nothing has crashed");
  });

  it("remembers a dismissed crash by container and code", () => {
    expect(crashKey(crashed)).toBe("c:1");
  });
});

describe("shortName", () => {
  it("drops the project in front of a Compose container's name", () => {
    expect(shortName(container({ name: "shop-api-1", project: "shop" }))).toBe("api-1");
    expect(shortName(container({ name: "umami_db_1", project: "umami" }))).toBe("db_1");
  });

  it("keeps names that don't start with their project, and standalone ones", () => {
    expect(shortName(container({ name: "umbrel", project: "umbrel" }))).toBe("umbrel");
    expect(shortName(container({ name: "web", project: "shop" }))).toBe("web");
    expect(shortName(container({ name: "shop-api-1" }))).toBe("shop-api-1");
  });
});

describe("runningLabel", () => {
  it("says all, or how many of all", () => {
    expect(runningLabel(2, 2)).toBe("2 running");
    expect(runningLabel(1, 4)).toBe("1 of 4 running");
  });
});
