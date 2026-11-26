import type { ContainerSummary } from "@/lib/ipc/bindings";
import { StatusLabel } from "@/ui/status-label";

import { statusParts } from "./model";

/** Docker's status line as a state word and when, coloured only when something is wrong. */
export function ContainerStatus({ container }: { container: ContainerSummary }) {
  const { tone, label, detail } = statusParts(container);
  return <StatusLabel tone={tone} label={label} detail={detail} />;
}
