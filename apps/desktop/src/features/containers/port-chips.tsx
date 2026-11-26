import { openUrl } from "@tauri-apps/plugin-opener";

import type { Port } from "@/lib/ipc/bindings";
import { Dash } from "@/ui/dash";
import { Tip } from "@/ui/tooltip";

type Published = Port & { host: number };

const SHOWN = 2;

const portLabel = (port: Published) =>
  port.host === port.container ? `${port.host}` : `${port.host} → ${port.container}`;

function PortChip({ port }: { port: Published }) {
  return (
    <Tip label={`Open localhost:${port.host} ↗`}>
      <button
        type="button"
        onClick={() => openUrl(`http://localhost:${port.host}`).catch(() => undefined)}
        className="inline-flex h-5 shrink-0 items-center rounded-[5px] bg-fill px-[7px] font-mono text-mono-12 text-ink-2 transition-colors duration-140 hover:bg-brand-soft hover:text-brand-ink"
      >
        {port.host}
        {port.host === port.container ? null : (
          <span className="text-ink-3">:{port.container}</span>
        )}
      </button>
    </Tip>
  );
}

/** Published ports open in the browser; private ones aren't shown. The rest wait behind "+N". */
export function PortChips({ ports }: { ports: Port[] }) {
  const published = ports.filter((port): port is Published => port.host !== null);
  if (published.length === 0) {
    return <Dash />;
  }
  const rest = published.slice(SHOWN);
  return (
    <span className="flex min-w-0 items-center gap-1 overflow-hidden">
      {published.slice(0, SHOWN).map((port) => (
        <PortChip key={`${port.host}-${port.protocol}`} port={port} />
      ))}
      {rest.length > 0 ? (
        <Tip label={rest.map(portLabel).join(", ")}>
          <span className="shrink-0 rounded-[5px] px-1 text-12 text-ink-3 tabular">
            +{rest.length}
          </span>
        </Tip>
      ) : null}
    </span>
  );
}
