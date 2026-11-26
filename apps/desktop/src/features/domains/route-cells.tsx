import { IconLock, IconLockOpen, IconWorld } from "@tabler/icons-react";

import type { DomainRoute } from "@/lib/ipc/bindings";
import { Tip } from "@/ui/tooltip";

export function Https({ route, caTrusted }: { route: DomainRoute; caTrusted: boolean }) {
  if (!route.https) {
    return (
      <span className="inline-flex items-center gap-1 text-ink-3">
        <IconWorld className="size-3.5" aria-hidden />
        HTTP
      </span>
    );
  }
  return caTrusted ? (
    <Tip label="Signed by the Contena local certificate authority">
      <span className="inline-flex items-center gap-1">
        <IconLock className="size-3.5" aria-hidden />
        HTTPS
      </span>
    </Tip>
  ) : (
    <Tip label="Browsers warn until you trust the local certificate">
      <span className="inline-flex items-center gap-1 text-ink-3">
        <IconLockOpen className="size-3.5" aria-hidden />
        Untrusted
      </span>
    </Tip>
  );
}
