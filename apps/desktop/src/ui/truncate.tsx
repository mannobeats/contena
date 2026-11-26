import clsx from "clsx";
import type { PointerEvent } from "react";

type TruncateProps = {
  text: string;
  /** The whole value when `text` is a shortened form of it, shown on hover. */
  full?: string;
  className?: string;
};

/**
 * One line that ends in "…" when it doesn't fit. Hovering shows the whole text, only when some of
 * it is hidden, as Finder does for long names in a narrow column.
 */
export function Truncate({ text, full = text, className }: TruncateProps) {
  const check = (event: PointerEvent<HTMLSpanElement>) => {
    const span = event.currentTarget;
    span.title = span.scrollWidth > span.clientWidth || full !== text ? full : "";
  };
  return (
    <span onPointerEnter={check} className={clsx("min-w-0 truncate", className)}>
      {text}
    </span>
  );
}
