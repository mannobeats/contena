import type { KeyboardEvent, PointerEvent } from "react";

const STEP = 16;

type ColumnResizerProps = {
  /** The column's name, for screen readers: "Resize Name". */
  column: string;
  width: number;
  min: number;
  /** -1 when dragging right should narrow the column, as for the one right of a filling column. */
  direction: 1 | -1;
  onChange: (width: number) => void;
  onReset: () => void;
};

/** The grip on a header's right edge: drag to resize, arrows for the keyboard, double-click resets. */
export function ColumnResizer({
  column,
  width,
  min,
  direction,
  onChange,
  onReset,
}: ColumnResizerProps) {
  const set = (next: number) => onChange(Math.max(min, next));
  const start = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    const handle = event.currentTarget;
    const from = event.clientX;
    handle.setPointerCapture(event.pointerId);
    const move = (moved: globalThis.PointerEvent) =>
      set(width + direction * (moved.clientX - from));
    const end = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  };
  const key = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      set(width + direction * (event.key === "ArrowRight" ? STEP : -STEP));
    }
  };
  return (
    <button
      type="button"
      aria-label={`Resize ${column}`}
      onPointerDown={start}
      onKeyDown={key}
      onDoubleClick={onReset}
      className="absolute top-0 -right-1 z-[1] h-full w-2 cursor-col-resize after:absolute after:inset-y-2 after:left-[3.5px] after:w-px after:rounded-full after:bg-line-strong after:opacity-0 after:transition-opacity after:duration-140 group-hover/head:after:opacity-100 hover:after:bg-brand focus-visible:after:bg-brand focus-visible:after:opacity-100 active:after:bg-brand"
    />
  );
}
