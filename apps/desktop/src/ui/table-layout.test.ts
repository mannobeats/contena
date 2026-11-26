import { beforeEach, describe, expect, it } from "vitest";

import { type Column, fitColumns, nextSort, sortRows, useTableLayouts } from "./table-layout";

describe("nextSort", () => {
  it("goes ascending, descending, then back to the list's own order", () => {
    const first = nextSort(null, "size");
    expect(first).toEqual({ column: "size", desc: false });
    const second = nextSort(first, "size");
    expect(second).toEqual({ column: "size", desc: true });
    expect(nextSort(second, "size")).toBeNull();
  });

  it("starts ascending on a new column", () => {
    expect(nextSort({ column: "size", desc: true }, "name")).toEqual({
      column: "name",
      desc: false,
    });
  });
});

describe("sortRows", () => {
  const rows = [
    { name: "web-10", size: 3 },
    { name: "web-2", size: null },
    { name: "Web-1", size: 9 },
  ];

  it("compares names the way Finder does, numbers by value", () => {
    expect(sortRows(rows, (row) => row.name, false).map((row) => row.name)).toEqual([
      "Web-1",
      "web-2",
      "web-10",
    ]);
  });

  it("keeps empty values last in both directions", () => {
    expect(sortRows(rows, (row) => row.size, false).map((row) => row.size)).toEqual([3, 9, null]);
    expect(sortRows(rows, (row) => row.size, true).map((row) => row.size)).toEqual([9, 3, null]);
  });

  it("leaves the order alone without a sort", () => {
    expect(sortRows(rows, undefined, false)).toBe(rows);
  });
});

describe("useTableLayouts", () => {
  beforeEach(() => useTableLayouts.setState({ layouts: {} }));

  it("remembers widths, shown columns and the sort per table, and resets one table", () => {
    const store = useTableLayouts.getState();
    store.setWidth("volumes", "size", 120.4);
    store.setShown("volumes", "project", false);
    store.setSort("volumes", { column: "size", desc: true });
    store.setWidth("images", "tag", 200);
    expect(useTableLayouts.getState().layouts.volumes).toEqual({
      widths: { size: 120 },
      shown: { project: false },
      sort: { column: "size", desc: true },
    });
    useTableLayouts.getState().reset("volumes");
    expect(useTableLayouts.getState().layouts).toEqual({
      images: { widths: { tag: 200 }, shown: {}, sort: null },
    });
  });
});

describe("fitColumns", () => {
  const column = (id: string, width: number, extra: Partial<Column<null>> = {}): Column<null> => ({
    id,
    header: id,
    width,
    cell: () => null,
    ...extra,
  });
  const columns = [
    { id: "name", header: "Name", minWidth: 200, cell: () => null },
    column("image", 200, { optional: true, priority: 1 }),
    column("cpu", 80, { optional: true, priority: 3 }),
    column("status", 200),
  ];
  const layout = { widths: {}, shown: {}, sort: null };

  it("lets the least useful optional columns step aside in a narrow window", () => {
    expect(fitColumns(columns, layout, 700, 0).map((c) => c.id)).toEqual([
      "name",
      "image",
      "cpu",
      "status",
    ]);
    expect(fitColumns(columns, layout, 600, 0).map((c) => c.id)).toEqual(["name", "cpu", "status"]);
    expect(fitColumns(columns, layout, 300, 0).map((c) => c.id)).toEqual(["name", "status"]);
  });

  it("keeps a column the person turned on, even when it doesn't fit", () => {
    const chosen = { ...layout, shown: { image: true } };
    expect(fitColumns(columns, chosen, 600, 0).map((c) => c.id)).toEqual([
      "name",
      "image",
      "status",
    ]);
  });
});
