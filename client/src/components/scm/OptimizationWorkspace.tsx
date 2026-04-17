import { useEffect, useState } from "react";
import Button from "../common/Button";
import Card from "../common/Card";
import Badge from "../common/Badge";
import { api, type OptimizationRecommendation } from "../../services/api";
import { useToast } from "../common/Toast";
import { formatDate } from "../../lib/utils";

const fieldClassName =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

function badgeForStatus(status?: string) {
  if (!status) return "default";
  if (["implemented", "accepted"].includes(status)) return "success";
  if (["open", "warning"].includes(status)) return "warning";
  if (["dismissed", "critical"].includes(status)) return "danger";
  return "info";
}

export default function OptimizationWorkspace() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [form, setForm] = useState({
    recommendationType: "inventory",
    severity: "warning",
    title: "",
    description: "",
    estimatedSavings: ""
  });

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      setRecommendations(await api.listOptimizationRecommendations());
    } catch (err: any) {
      setError(err.message || "Failed to load optimization recommendations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createRecommendation(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createOptimizationRecommendation({
        recommendationType: form.recommendationType,
        severity: form.severity,
        title: form.title,
        description: form.description,
        estimatedSavings: form.estimatedSavings ? Number(form.estimatedSavings) : undefined
      });
      toast("Optimization recommendation created.", "success");
      setForm({ recommendationType: "inventory", severity: "warning", title: "", description: "", estimatedSavings: "" });
      await loadData();
    } catch (err: any) {
      toast(err.message || "Failed to create recommendation", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <Card className="mt-6 text-sm text-slate-600 dark:text-slate-300">{error}</Card>;

  return (
    <section className="mt-6 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Recommendation</h2>
        <form className="mt-4 space-y-3" onSubmit={createRecommendation}>
          <div className="grid gap-3 sm:grid-cols-2">
            <select className={fieldClassName} value={form.recommendationType} onChange={(e) => setForm((c) => ({ ...c, recommendationType: e.target.value }))}>
              <option value="inventory">Inventory</option>
              <option value="procurement">Procurement</option>
              <option value="logistics">Logistics</option>
              <option value="production">Production</option>
            </select>
            <select className={fieldClassName} value={form.severity} onChange={(e) => setForm((c) => ({ ...c, severity: e.target.value }))}>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <input className={fieldClassName} placeholder="Title" required value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} />
          <textarea className={`${fieldClassName} min-h-24 resize-y`} placeholder="Description" required value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} />
          <input className={fieldClassName} type="number" min="0" step="0.01" placeholder="Estimated Savings" value={form.estimatedSavings} onChange={(e) => setForm((c) => ({ ...c, estimatedSavings: e.target.value }))} />
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Saving..." : "Create Recommendation"}</Button>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recommendation Board</h2>
          <Badge variant="info">{recommendations.length}</Badge>
        </div>
        {loading ? <p className="text-sm text-slate-500">Loading...</p> : recommendations.length === 0 ? <p className="text-sm text-slate-500">No recommendations yet.</p> : (
          <div className="space-y-3">
            {recommendations.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.recommendation_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={badgeForStatus(item.severity) as any}>{item.severity}</Badge>
                    <Badge variant={badgeForStatus(item.status) as any}>{item.status}</Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{item.description}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Savings: {item.estimated_savings ?? "-"} | Created: {formatDate(item.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
