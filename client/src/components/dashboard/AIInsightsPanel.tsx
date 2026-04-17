import { AlertTriangle, Info, Siren, Sparkles } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Button from "../common/Button";
import { useChainTraceStore } from "../../store/useChainTraceStore";

const severityStyles = {
  info: { icon: Info, badge: "info" as const },
  warning: { icon: AlertTriangle, badge: "warning" as const },
  high: { icon: AlertTriangle, badge: "danger" as const },
  critical: { icon: Siren, badge: "danger" as const }
};

export default function AIInsightsPanel() {
  const insights = useChainTraceStore((state) => state.insights);
  const visibleInsights = insights.slice(0, 5);

  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Advisor</h3>
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
          <Sparkles className="h-4 w-4" />
          Gemini 1.5 Flash
        </div>
      </div>

      {visibleInsights.length === 0 ? (
        <div className="grid h-[220px] place-items-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
          No AI insights available yet.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleInsights.map((insight) => {
            const style = severityStyles[insight.severity];
            const Icon = style.icon;
            return (
              <div key={insight.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                      <Icon className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{insight.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{insight.domain}</p>
                    </div>
                  </div>
                  <Badge variant={style.badge}>{insight.severity}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{insight.description}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm">View Details</Button>
                  <Button size="sm" variant="secondary">
                    Dismiss
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
