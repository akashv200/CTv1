import { useEffect, useState } from "react";
import Button from "../common/Button";
import Card from "../common/Card";
import Badge from "../common/Badge";
import { api, type ProductionOrder } from "../../services/api";
import { useToast } from "../common/Toast";

const fieldClassName =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

function badgeForStatus(status?: string) {
  if (!status) return "default";
  if (["completed"].includes(status)) return "success";
  if (["planned", "in_progress", "quality_check"].includes(status)) return "warning";
  if (["halted", "failed"].includes(status)) return "danger";
  return "info";
}

function qty(value: number | null | undefined) {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

export default function ProductionWorkspace() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [orderForm, setOrderForm] = useState({ targetProductId: "", targetQuantity: "", status: "planned" });
  const [materialDrafts, setMaterialDrafts] = useState<Record<string, { inputProductId: string; plannedQuantity: string; unit: string }>>({});
  const [wipDrafts, setWipDrafts] = useState<Record<string, { stageName: string; workstation: string; status: string }>>({});

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      setOrders(await api.listProductionOrders());
    } catch (err: any) {
      setError(err.message || "Failed to load production workspace.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createProductionOrder({
        targetProductId: orderForm.targetProductId,
        targetQuantity: Number(orderForm.targetQuantity),
        status: orderForm.status
      });
      toast("Production order created.", "success");
      setOrderForm({ targetProductId: "", targetQuantity: "", status: "planned" });
      await loadData();
    } catch (err: any) {
      toast(err.message || "Failed to create production order", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function addMaterial(orderId: string, e: React.FormEvent) {
    e.preventDefault();
    const draft = materialDrafts[orderId];
    if (!draft?.plannedQuantity) return;
    setSubmitting(true);
    try {
      await api.addProductionOrderMaterial(orderId, {
        inputProductId: draft.inputProductId || undefined,
        plannedQuantity: Number(draft.plannedQuantity),
        unit: draft.unit || "unit"
      });
      toast("Material plan added.", "success");
      setMaterialDrafts((c) => ({ ...c, [orderId]: { inputProductId: "", plannedQuantity: "", unit: "unit" } }));
      await loadData();
    } catch (err: any) {
      toast(err.message || "Failed to add material plan", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function addWip(orderId: string, e: React.FormEvent) {
    e.preventDefault();
    const draft = wipDrafts[orderId];
    if (!draft?.stageName) return;
    setSubmitting(true);
    try {
      await api.addProductionOrderWipEvent(orderId, {
        stageName: draft.stageName,
        workstation: draft.workstation || undefined,
        status: draft.status
      });
      toast("WIP event added.", "success");
      setWipDrafts((c) => ({ ...c, [orderId]: { stageName: "", workstation: "", status: "queued" } }));
      await loadData();
    } catch (err: any) {
      toast(err.message || "Failed to add WIP event", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return <Card className="mt-6 text-sm text-slate-600 dark:text-slate-300">{error}</Card>;
  }

  return (
    <section className="mt-6 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Production Order</h2>
        <form className="mt-4 space-y-3" onSubmit={createOrder}>
          <input className={fieldClassName} placeholder="Target Product ID" required value={orderForm.targetProductId} onChange={(e) => setOrderForm((c) => ({ ...c, targetProductId: e.target.value }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={fieldClassName} type="number" min="0" step="0.01" placeholder="Target Quantity" required value={orderForm.targetQuantity} onChange={(e) => setOrderForm((c) => ({ ...c, targetQuantity: e.target.value }))} />
            <select className={fieldClassName} value={orderForm.status} onChange={(e) => setOrderForm((c) => ({ ...c, status: e.target.value }))}>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="quality_check">Quality Check</option>
              <option value="completed">Completed</option>
              <option value="halted">Halted</option>
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Saving..." : "Create Order"}</Button>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Production Orders</h2>
          <Badge variant="info">{orders.length} active</Badge>
        </div>
        {loading ? <p className="text-sm text-slate-500">Loading...</p> : orders.length === 0 ? <p className="text-sm text-slate-500">No production orders yet.</p> : (
          <div className="space-y-4">
            {orders.map((order) => {
              const material = materialDrafts[order.id] ?? { inputProductId: "", plannedQuantity: "", unit: "unit" };
              const wip = wipDrafts[order.id] ?? { stageName: "", workstation: "", status: "queued" };
              return (
                <div key={order.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{order.production_number}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Target: {order.target_product_name ?? order.target_product_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={badgeForStatus(order.status) as any}>{order.status}</Badge>
                      <Badge variant="default">{qty(order.target_quantity)} planned</Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Materials: {order.material_count ?? 0} | Latest Stage: {order.latest_stage_name ?? "-"} ({order.latest_stage_status ?? "-"})</p>

                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <form className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/40" onSubmit={(e) => void addMaterial(order.id, e)}>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add Material Plan</p>
                      <input className={fieldClassName} placeholder="Input Product ID" value={material.inputProductId} onChange={(e) => setMaterialDrafts((c) => ({ ...c, [order.id]: { ...material, inputProductId: e.target.value } }))} />
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input className={fieldClassName} type="number" min="0" step="0.01" placeholder="Planned Qty" required value={material.plannedQuantity} onChange={(e) => setMaterialDrafts((c) => ({ ...c, [order.id]: { ...material, plannedQuantity: e.target.value } }))} />
                        <input className={fieldClassName} placeholder="Unit" value={material.unit} onChange={(e) => setMaterialDrafts((c) => ({ ...c, [order.id]: { ...material, unit: e.target.value } }))} />
                      </div>
                      <Button type="submit" size="sm" className="mt-3 w-full" disabled={submitting}>Add Material</Button>
                    </form>

                    <form className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/40" onSubmit={(e) => void addWip(order.id, e)}>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add WIP Event</p>
                      <input className={fieldClassName} placeholder="Stage Name" required value={wip.stageName} onChange={(e) => setWipDrafts((c) => ({ ...c, [order.id]: { ...wip, stageName: e.target.value } }))} />
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input className={fieldClassName} placeholder="Workstation" value={wip.workstation} onChange={(e) => setWipDrafts((c) => ({ ...c, [order.id]: { ...wip, workstation: e.target.value } }))} />
                        <select className={fieldClassName} value={wip.status} onChange={(e) => setWipDrafts((c) => ({ ...c, [order.id]: { ...wip, status: e.target.value } }))}>
                          <option value="queued">Queued</option>
                          <option value="started">Started</option>
                          <option value="paused">Paused</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                          <option value="scrapped">Scrapped</option>
                        </select>
                      </div>
                      <Button type="submit" size="sm" className="mt-3 w-full" disabled={submitting}>Add WIP Event</Button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}
