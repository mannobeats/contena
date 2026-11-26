import { Link } from "@tanstack/react-router";

import type { NetworkSummary } from "@/lib/ipc/bindings";
import { Chip } from "@/ui/chip";
import { rowLink } from "@/ui/classes";
import { Tile } from "@/ui/tile";
import { Truncate } from "@/ui/truncate";

export function NetworkName({ network }: { network: NetworkSummary }) {
  return (
    <Link to="/networks/$id" params={{ id: network.id }} className={rowLink} data-row-link>
      <Tile icon="network" state={network.builtIn ? "off" : "on"} />
      <Truncate text={network.name} className="font-medium text-ink" />
      {network.builtIn ? <Chip>Built in</Chip> : null}
    </Link>
  );
}
