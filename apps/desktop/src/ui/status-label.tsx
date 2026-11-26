import {
  IconAlertCircleFilled,
  IconAlertTriangleFilled,
  IconCheck,
  IconCircleFilled,
  IconLoader2,
  IconPlayerPauseFilled,
  IconPlayerStopFilled,
} from "@tabler/icons-react";
import clsx from "clsx";

/** What a thing is doing, which picks its glyph and the only colour a list row carries. */
export type StatusTone = "running" | "busy" | "paused" | "stopped" | "done" | "warn" | "bad";

const glyphs = {
  running: <IconCircleFilled aria-hidden className="size-2! text-ok" />,
  busy: <IconLoader2 aria-hidden className="size-3.5! animate-spin text-brand" />,
  paused: <IconPlayerPauseFilled aria-hidden className="size-3! text-ink-3" />,
  stopped: <IconPlayerStopFilled aria-hidden className="size-3! text-ink-4" />,
  done: <IconCheck aria-hidden className="size-3.5! stroke-2! text-ink-3" />,
  warn: <IconAlertTriangleFilled aria-hidden className="size-3.5! text-warn" />,
  bad: <IconAlertCircleFilled aria-hidden className="size-3.5! text-bad" />,
} as const;

const words = {
  running: "text-ink-2",
  busy: "text-ink-2",
  paused: "text-ink-2",
  stopped: "text-ink-3",
  done: "text-ink-3",
  warn: "text-warn-ink",
  bad: "text-bad-ink",
} as const;

type StatusLabelProps = {
  tone: StatusTone;
  label: string;
  /** The quieter part after it, like "31 hours ago". */
  detail?: string | undefined;
  className?: string;
};

/**
 * A state in a list: glyph, word, then when. The same in every table, so a crashed container, a
 * failed build and a crash-looping pod read alike.
 */
export function StatusLabel({ tone, label, detail, className }: StatusLabelProps) {
  return (
    <span className={clsx("inline-flex min-w-0 max-w-full items-center gap-1.5", className)}>
      <span className="grid w-3.5 shrink-0 place-items-center">{glyphs[tone]}</span>
      <span className={clsx("shrink-0 font-medium", words[tone])}>{label}</span>
      {detail ? <span className="truncate text-ink-3">{detail}</span> : null}
    </span>
  );
}
