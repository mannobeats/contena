import { IconAlertCircleFilled, IconX } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

import type { ContainerSummary } from "@/lib/ipc/bindings";
import { useUi } from "@/shell/ui-store";
import { Banner } from "@/ui/banner";
import { Button } from "@/ui/button";
import { buttonClass } from "@/ui/button-class";
import { Tip } from "@/ui/tooltip";

import { crashKey, exitCode, isCrashed, statusParts } from "./model";

type CrashNoticeProps = {
  containers: ContainerSummary[];
  /** Narrows the list to crashed containers. */
  onShow: () => void;
};

/**
 * One line for every crash at once, never a banner per container: the list below stays in view
 * and carries the detail on each row. Dismissing it hides these crashes until a new one happens.
 */
export function CrashNotice({ containers, onShow }: CrashNoticeProps) {
  const dismissed = new Set(useUi((state) => state.dismissedCrashes));
  const dismiss = useUi((state) => state.dismissCrashes);
  const crashed = containers.filter(isCrashed);
  const fresh = crashed.filter((container) => !dismissed.has(crashKey(container)));
  const [first] = fresh;
  if (!first) {
    return null;
  }
  const when = statusParts(first).detail;
  const close = (
    <Tip label="Dismiss until something else crashes">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label="Dismiss"
        onClick={() => dismiss(crashed.map(crashKey))}
      >
        <IconX />
      </Button>
    </Tip>
  );
  return (
    <Banner
      tone="bad"
      icon={<IconAlertCircleFilled aria-hidden className="size-4!" />}
      className="mx-5 mb-3 py-1.5!"
      action={
        <span className="flex items-center gap-1">
          {fresh.length === 1 ? (
            <Link
              to="/containers/$id"
              params={{ id: first.id }}
              search={{ tab: "logs" }}
              className={buttonClass({ size: "sm" })}
            >
              View logs
            </Link>
          ) : (
            <Button size="sm" onClick={onShow}>
              Show crashed
            </Button>
          )}
          {close}
        </span>
      }
    >
      {fresh.length === 1 ? (
        <>
          <b>{first.name}</b> exited with code {exitCode(first) ?? "unknown"}
          {when ? ` ${when}` : ""}.
        </>
      ) : (
        <>
          <b>{fresh.length} containers</b> exited with an error. Each one's row says when, and its
          logs say why.
        </>
      )}
    </Banner>
  );
}
