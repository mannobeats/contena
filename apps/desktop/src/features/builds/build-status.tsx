import type { BuildStatus } from "@/lib/ipc/bindings";
import { StatusLabel, type StatusTone } from "@/ui/status-label";

const states: Record<BuildStatus, { tone: StatusTone; label: string }> = {
  failed: { tone: "bad", label: "Failed" },
  running: { tone: "busy", label: "Building" },
  canceled: { tone: "stopped", label: "Canceled" },
  completed: { tone: "done", label: "Completed" },
};

/** Only a failure is coloured; a running build has its progress bar beside it. */
export function BuildStatusLabel({ status }: { status: BuildStatus }) {
  return <StatusLabel {...states[status]} />;
}
