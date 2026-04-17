import { useEffect, useMemo, useState } from "react";
import Button from "../common/Button";
import Card from "../common/Card";
import Badge from "../common/Badge";
import { api, type InventoryOptimizationSuggestion, type InventoryStockRecord } from "../../services/api";
import { useToast } from "../common/Toast";
import { formatDate } from "../../lib/utils";

const fieldClassName =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

function statusBadge(status?: string) {
  if (!status) return "default";
  if (["optimal"].includes(status)) return "success";
  if (["low", "overstock"].includes(status)) return "warning";
  if (["out", "quarantine"].includes(status)) return "danger";
  return "info";
}

export default function InventoryWorkspace() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stock, setStock] = useState<InventoryStockRecord[]>([]);
  const [suggestions, setSuggestions] = useState<InventoryOptimizationSuggestion[]>([]);
  const [form, setForm] = useState({
    productId: "",
    sku: "",
    quantity: "",
    reorderPoint: "",
    maxCapacity: "",
    rackRowBin: "",
    status: "optimal"
  });

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [stockRows, suggestionRows] = await Promise.all([
        api.listInventoryStock(),
        api.listInventoryOptimizationSuggestions()
      ]);
      setStock(stockRows);
      setSuggestions(suggestionRows);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createInventoryRecord(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createInventoryStockRecord({
        productId: form.productId || undefined,
        sku: form.sku,
        quantity: Number(form.quantity),
        reorderPoint: form.reorderPoint ? Number(form.reorderPoint) : undefined,
        maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : undefined,
        rackRowBin: form.rackRowBin || undefined,
        status: form.status
      });
      toast("Inventory record created.", "success");
      setForm({ productId: "", sku: "", quantity: "", reorderPoint: "", maxCapacity: "", rackRowBin: "", status: "optimal" });
      await loadData();
    } catch (err: any) {
      toast(err.message || "Failed to create inventory record", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function runOptimization() {
    setOptimizing(true);
    try {
      const result = await api.runInventoryOptimization();
      toast(`Optimization complete. ${result.createdRecommendations} recommendations opened.`, "success");
      await loadData();
    } catch (err: any) {
      toast(err.message || "Failed to run inventory optimization", "error");
    } finally {
      setOptimizing(false);
    }
  }

  const recommendationSummary = useMemo(() => {
    const replenishItems = suggestions.filter((item) => item.suggested_replenishment_qty > 0);
    const overstockItems = suggestions.filter((item) => item.suggested_status === "overstock");
    const lowStockItems = suggestions.filter((item) => ["low", "out"].includes(item.suggested_status));
    const replenishQuantity = replenishItems.reduce((total, item) => total + item.suggested_replenishment_qty, 0);
    return {
      replenishItems: replenishItems.length,
      overstockItems: overstockItems.length,
      lowStockItems: lowStockItems.length,
      replenishQuantity
    };
  }, [suggestions]);

  if (error) return <Card className="mt-6 text-sm text-slate-600 dark:text-slate-300">{error}</Card>;

  return (
    <section className="mt-6 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-5">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add Inventory Record</h2>
          <form className="mt-4 space-y-3" onSubmit={createInventoryRecord}>
            <input className={fieldClassName} placeholder="Product ID" value={form.productId} onChange={(e) => setForm((c) => ({ ...c, productId: e.target.value }))} />
            <input className={fieldClassName} placeholder="SKU" required value={form.sku} onChange={(e) => setForm((c) => ({ ...c, sku: e.target.value }))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={fieldClassName} type="number" min="0" step="0.01" placeholder="Quantity" required value={form.quantity} onChange={(e) => setForm((c) => ({ ...c, quantity: e.target.value }))} />
              <input className={fieldClassName} type="number" min="0" step="0.01" placeholder="Reorder Point" value={form.reorderPoint} onChange={(e) => setForm((c) => ({ ...c, reorderPoint: e.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={fieldClassName} type="number" min="0" step="0.01" placeholder="Max Capacity" value={form.maxCapacity} onChange={(e) => setForm((c) => ({ ...c, maxCapacity: e.target.value }))} />
              <input className={fieldClassName} placeholder="Rack / Row / Bin" value={form.rackRowBin} onChange={(e) => setForm((c) => ({ ...c, rackRowBin: e.target.value }))} />
            </div>
            <select className={fieldClassName} value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}>
              <option value="optimal">Optimal</option>
              <option value="low">Low</option>
              <option value="out">Out</option>
              <option value="overstock">Overstock</option>
              <option value="quarantine">Quarantine</option>
            </select>
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Saving..." : "Create Stock Record"}</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Replenishment Controls</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Run the optimization engine to recompute reorder points using recent demand forecasts, supplier lead times, safety stock, and current warehouse capacity.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Replenishment Items</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{recommendationSummary.replenishItems}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{recommendationSummary.replenishQuantity} units suggested</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Exceptions</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{recommendationSummary.lowStockItems + recommendationSummary.overstockItems}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{recommendationSummary.lowStockItems} low/out, {recommendationSummary.overstockItems} overstock</p>
            </div>
          </div>
          <Button type="button" className="mt-4 w-full" disabled={optimizing} onClick={() => void runOptimization()}>
            {optimizing ? "Running Optimization..." : "Run Optimization And Replenishment Logic"}
          </Button>
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Inventory Snapshot</h2>
            <Badge variant="info">{stock.length} records</Badge>
          </div>
          {loading ? <p className="text-sm text-slate-500">Loading...</p> : stock.length === 0 ? <p className="text-sm text-slate-500">No stock records yet.</p> : (
            <div className="space-y-3">
              {stock.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.product_name ?? item.sku}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">SKU: {item.sku} | Warehouse: {item.warehouse_name ?? "-"}</p>
                    </div>
                    <Badge variant={statusBadge(item.status) as any}>{item.status}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2 lg:grid-cols-5">
                    <span>Quantity: {item.quantity}</span>
                    <span>Reorder: {item.reorder_point}</span>
                    <span>Max: {item.max_capacity ?? "-"}</span>
                    <span>Bin: {item.rack_row_bin ?? "-"}</span>
                    <span>Updated: {formatDate(item.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Optimization Suggestions</h2>
            <Badge variant="warning">{suggestions.length}</Badge>
          </div>
          {loading ? <p className="text-sm text-slate-500">Loading...</p> : suggestions.length === 0 ? <p className="text-sm text-slate-500">No suggestions yet. Run optimization after adding forecasts and supplier relationships.</p> : (
            <div className="space-y-3">
              {suggestions.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.product_name ?? item.sku}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Warehouse: {item.warehouse_name ?? "-"} | SKU: {item.sku}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadge(item.suggested_status) as any}>{item.suggested_status}</Badge>
                      {item.suggested_replenishment_qty > 0 ? <Badge variant="success">Replenish {item.suggested_replenishment_qty}</Badge> : null}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2 lg:grid-cols-3">
                    <span>Current Qty: {item.quantity}</span>
                    <span>Daily Demand: {item.daily_demand}</span>
                    <span>Lead Time: {item.lead_time_days_used} days</span>
                    <span>Safety Stock: {item.safety_stock}</span>
                    <span>Current Reorder: {item.reorder_point}</span>
                    <span>Suggested Reorder: {item.suggested_reorder_point}</span>
                    <span>Target Level: {item.target_stock_level}</span>
                    <span>Cover Days: {item.stock_cover_days ?? "-"}</span>
                    <span>Last Update: {formatDate(item.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
