import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUi } from "@/shell/ui-store";
import { containerFixture } from "@/test/fixtures";
import { renderWithApp } from "@/test/harness";

import { CrashNotice } from "./crash-notice";

const crash = (name: string) =>
  containerFixture({ id: name, name, state: "exited", status: "Exited (255) 31 hours ago" });

/** A list where a second container crashes when the button is pressed. */
function Page() {
  const [containers, setContainers] = useState([crash("a")]);
  return (
    <>
      <button type="button" onClick={() => setContainers([crash("a"), crash("b")])}>
        Crash b
      </button>
      <CrashNotice containers={containers} onShow={() => undefined} />
    </>
  );
}

describe("CrashNotice", () => {
  beforeEach(() => useUi.setState({ dismissedCrashes: [] }));

  it("says many crashes in one line and narrows the list to them", async () => {
    const onShow = vi.fn();
    renderWithApp(
      <CrashNotice containers={[crash("a"), crash("b"), crash("c")]} onShow={onShow} />,
    );
    expect((await screen.findAllByRole("alert")).length).toBe(1);
    expect(screen.getByRole("alert").textContent).toContain("3 containers exited with an error");
    await userEvent.click(screen.getByRole("button", { name: "Show crashed" }));
    expect(onShow).toHaveBeenCalled();
  });

  it("stays away once dismissed, until another container crashes", async () => {
    renderWithApp(<Page />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "a exited with code 255 31 hours ago",
    );
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alert")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Crash b" }));
    expect((await screen.findByRole("alert")).textContent).toContain("b exited");
  });
});
