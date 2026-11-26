import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { renderWithApp } from "@/test/harness";

import { DataTable } from "./data-table";
import { type Column, useTableLayouts } from "./table-layout";

type Volume = { name: string; size: number; project: string | null };

const volumes: Volume[] = [
  { name: "pgdata", size: 300, project: "shop" },
  { name: "cache", size: 10, project: null },
  { name: "uploads", size: 90, project: "shop" },
];

const columns: Column<Volume>[] = [
  { id: "name", header: "Name", sortValue: (volume) => volume.name, cell: (volume) => volume.name },
  {
    id: "project",
    header: "Project",
    width: 120,
    optional: true,
    cell: (volume) => volume.project ?? "none",
  },
  {
    id: "size",
    header: "Size",
    width: 90,
    align: "right",
    sortValue: (volume) => volume.size,
    cell: (volume) => `${volume.size} MB`,
  },
];

function names() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0]?.textContent);
}

function table() {
  renderWithApp(
    <DataTable
      layoutKey="test-volumes"
      label="Volumes"
      columns={columns}
      rows={volumes}
      rowKey={(volume) => volume.name}
    />,
  );
}

describe("DataTable", () => {
  beforeEach(() => useTableLayouts.setState({ layouts: {} }));

  it("sorts from a header, then flips, then goes back to the list's order", async () => {
    table();
    const size = await screen.findByRole("button", { name: "Size" });
    await userEvent.click(size);
    expect(names()).toEqual(["cache", "uploads", "pgdata"]);
    expect(screen.getByRole("columnheader", { name: "Size" }).getAttribute("aria-sort")).toBe(
      "ascending",
    );
    await userEvent.click(size);
    expect(names()).toEqual(["pgdata", "uploads", "cache"]);
    await userEvent.click(size);
    expect(names()).toEqual(["pgdata", "cache", "uploads"]);
  });

  it("resizes a column from the keyboard and remembers it", async () => {
    table();
    const grip = await screen.findByRole("button", { name: "Resize Project" });
    fireEvent.keyDown(grip, { key: "ArrowRight" });
    expect(useTableLayouts.getState().layouts["test-volumes"]?.widths.project).toBe(136);
    fireEvent.doubleClick(grip);
    expect(useTableLayouts.getState().layouts["test-volumes"]?.widths.project).toBe(120);
  });

  it("gives the filling column room from its neighbour", async () => {
    table();
    const grip = await screen.findByRole("button", { name: "Resize Name" });
    fireEvent.keyDown(grip, { key: "ArrowRight" });
    expect(useTableLayouts.getState().layouts["test-volumes"]?.widths.project).toBe(104);
  });

  it("hides an optional column from the header's menu", async () => {
    table();
    fireEvent.contextMenu(await screen.findByRole("columnheader", { name: "Size" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /Project/ }));
    expect(screen.queryByRole("columnheader", { name: "Project" })).toBeNull();
    fireEvent.contextMenu(screen.getByRole("columnheader", { name: "Size" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Reset Columns" }));
    expect(screen.getByRole("columnheader", { name: "Project" })).toBeDefined();
  });
});
