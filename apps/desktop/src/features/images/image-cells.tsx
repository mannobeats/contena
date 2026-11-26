import { Link } from "@tanstack/react-router";

import { plural } from "@/lib/format";
import type { ContainerSummary, ImageSummary } from "@/lib/ipc/bindings";
import { logoFor } from "@/lib/logos";
import { rowLink } from "@/ui/classes";
import { FaceStack } from "@/ui/face-stack";
import { Tile } from "@/ui/tile";
import { Truncate } from "@/ui/truncate";

import { imageName } from "./model";

export function UsedBy({ image, users }: { image: ImageSummary; users: ContainerSummary[] }) {
  if (users.length === 0 && image.containers > 0) {
    return <span className="text-ink-2">{plural(image.containers, "container")}</span>;
  }
  const faces = users.map((user) => ({
    id: user.id,
    name: user.name,
    running: user.state === "running",
    logo: logoFor(user.image),
  }));
  return <FaceStack faces={faces} />;
}

export function ImageName({ image }: { image: ImageSummary }) {
  return (
    <Link to="/images/$id" params={{ id: image.id }} className={rowLink} data-row-link>
      <Tile
        logo={image.dangling ? undefined : logoFor(image.repository)}
        icon={image.dangling ? "layer" : "image"}
      />
      <Truncate
        text={imageName(image)}
        className={image.dangling ? "text-ink-3" : "font-medium text-ink"}
      />
    </Link>
  );
}
