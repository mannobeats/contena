import { type LogoKey, logoFor } from "@/lib/logos";

import { Dash } from "./dash";
import { Tile } from "./tile";
import { Tip } from "./tooltip";

export type Face = { id: string; name: string; running: boolean; logo?: LogoKey | undefined };

/** Overlapping tiles, like a hand of cards: what a group is made of, at a glance. */
function TileStack({ faces, max = 3 }: { faces: Face[]; max?: number }) {
  const extra = faces.length - max;
  return (
    <span className="inline-flex shrink-0 items-center">
      {faces.slice(0, max).map((face) => (
        <Tip key={face.id} label={face.name}>
          <span className="inline-flex rounded-[7px] shadow-[0_0_0_2px_var(--bg)] [&+&]:-ml-1.5 group-hover/row:shadow-[0_0_0_2px_var(--hover)]">
            <Tile logo={face.logo ?? logoFor(face.name)} state={face.running ? "on" : "off"} />
          </span>
        </Tip>
      ))}
      {extra > 0 ? (
        <span className="-ml-1.5 grid h-6 min-w-6 place-items-center rounded-sm bg-fill px-1 text-11 font-medium text-ink-3 shadow-[0_0_0_2px_var(--bg)] tabular">
          +{extra}
        </span>
      ) : null}
    </span>
  );
}

/** The faces of the containers using something, with the name when there's one. */
export function FaceStack({ faces, max = 3 }: { faces: Face[]; max?: number }) {
  if (faces.length === 0) {
    return <Dash />;
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      <TileStack faces={faces} max={max} />
      <span className="truncate text-ink-2">
        {faces.length === 1 ? faces[0]?.name : `${faces.length} containers`}
      </span>
      {faces.length > 1 ? (
        <span className="sr-only">{faces.map((face) => face.name).join(", ")}</span>
      ) : null}
    </span>
  );
}
