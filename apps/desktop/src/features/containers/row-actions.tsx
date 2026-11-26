import { IconPlayerPlay, IconPlayerStop, IconRefresh, IconTerminal2 } from "@tabler/icons-react";

import type { ContainerSummary } from "@/lib/ipc/bindings";
import { IconAction } from "@/ui/icon-action";
import { type MenuEntry, MoreMenu } from "@/ui/menu";

import type { ContainerCallbacks } from "./container-callbacks";
import { isRunning } from "./model";

type RowActionsProps = Pick<ContainerCallbacks, "act"> & {
  container: ContainerSummary;
  menu: MenuEntry[];
  onTerminal: () => void;
};

/** Start or stop, restart, terminal and the full menu: shown when the row is hovered or focused. */
export function RowActions({ container, menu, act, onTerminal }: RowActionsProps) {
  const running = isRunning(container);
  return (
    <>
      {running ? (
        <IconAction label="Stop" target={container.name} onClick={() => act([container], "stop")}>
          <IconPlayerStop />
        </IconAction>
      ) : (
        <IconAction label="Start" target={container.name} onClick={() => act([container], "start")}>
          <IconPlayerPlay />
        </IconAction>
      )}
      <IconAction
        label="Restart"
        target={container.name}
        onClick={() => act([container], "restart")}
      >
        <IconRefresh />
      </IconAction>
      <IconAction label="Terminal" target={container.name} disabled={!running} onClick={onTerminal}>
        <IconTerminal2 />
      </IconAction>
      <MoreMenu entries={menu} target={container.name} />
    </>
  );
}
