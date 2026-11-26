import { Link } from "@tanstack/react-router";

import type { VolumeSummary } from "@/lib/ipc/bindings";
import { rowLink } from "@/ui/classes";
import { Tile } from "@/ui/tile";
import { Tip } from "@/ui/tooltip";
import { Truncate } from "@/ui/truncate";

/** An anonymous volume is a 64-character hash: its first 12 show, as `docker` shows IDs. */
export function VolumeName({ volume }: { volume: VolumeSummary }) {
  return (
    <Link to="/volumes/$name" params={{ name: volume.name }} className={rowLink} data-row-link>
      <Tile icon="volume" />
      {volume.anonymous ? (
        <Tip label={volume.name}>
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 font-mono text-mono-12 text-ink-2">
              {volume.name.slice(0, 12)}
            </span>
            <span className="truncate text-12 text-ink-3">anonymous</span>
          </span>
        </Tip>
      ) : (
        <Truncate text={volume.name} className="font-medium text-ink" />
      )}
    </Link>
  );
}
