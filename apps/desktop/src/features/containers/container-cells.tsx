import { Link } from "@tanstack/react-router";

import { shortImage } from "@/lib/format";
import type { ContainerSummary } from "@/lib/ipc/bindings";
import { logoFor } from "@/lib/logos";
import { rowLink } from "@/ui/classes";
import { Tile } from "@/ui/tile";
import { Truncate } from "@/ui/truncate";

import { isRunning, shortName } from "./model";

export function ContainerName({ container }: { container: ContainerSummary }) {
  const running = isRunning(container);
  return (
    <Link to="/containers/$id" params={{ id: container.id }} className={rowLink} data-row-link>
      {/* The guide that hangs the row under its project's icon, like a folder's contents. */}
      <span
        aria-hidden
        className="relative -my-2 h-9 w-[22px] shrink-0 before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-line after:absolute after:top-1/2 after:left-2 after:h-px after:w-2.5 after:bg-line"
      />
      <Tile logo={logoFor(container.image)} state={running ? "on" : "off"} />
      <Truncate
        text={shortName(container)}
        full={container.name}
        className={running ? "font-medium text-ink" : "font-[450] text-ink-2"}
      />
    </Link>
  );
}

export function ContainerImage({ image }: { image: string }) {
  return <Truncate text={shortImage(image)} full={image} />;
}
