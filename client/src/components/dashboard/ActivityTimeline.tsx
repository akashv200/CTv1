import { type ReactNode } from "react";
import { CheckCheck, ShieldCheck, Truck, Warehouse } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import { useChainTraceStore } from "../../store/useChainTraceStore";
import { formatDate } from "../../lib/utils";

const icons: Record<string, ReactNode> = {
  received: <Warehouse className="h-4 w-4" />,
  "quality-check": <CheckCheck className="h-4 w-4" />,
  processed: <ShieldCheck className="h-4 w-4" />,
  dispatched: <Truck className="h-4 w-4" />,
  "in-transit": <Truck className="h-4 w-4" />,
  delivered: <CheckCheck className="h-4 w-4" />
};

export default function ActivityTimeline() {
  const checkpoints = useChainTraceStore((state) => state.checkpoints);
  const visibleCheckpoints = checkpoints.slice(0, 5);

  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Live Activity Timeline</h3>
        <Badge variant="info">WebSocket Feed</Badge>
      </div>

      {visibleCheckpoints.length === 0 ? (
        <div className="grid h-[220px] place-items-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
          No checkpoint activity yet.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleCheckpoints.map((checkpoint) => (
            <div key={checkpoint.id} className="flex gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {icons[checkpoint.checkpointType]}
              </div>
              <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">{checkpoint.checkpointType}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(checkpoint.timestamp)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{checkpoint.location}</p>
                {checkpoint.note ? <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{checkpoint.note}</p> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
