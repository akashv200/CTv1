import { useEffect, useState } from "react";
import Button from "../common/Button";
import Card from "../common/Card";
import Badge from "../common/Badge";
import { api } from "../../services/api";
import { useToast } from "../common/Toast";

const fieldClassName =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

function statusBadge(status?: string) {
  if (!status) return "default";
  if (["delivered", "accepted"].includes(status)) return "success";
  if (["submitted", "pending", "processing", "shipped"].includes(status)) return "warning";
  if (["cancelled", "returned"].includes(status)) return "danger";
  return "info";
}

export default function OrderWorkspace() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [purchaseForm, setPurchaseForm] = useState({ supplierCompanyId: "", productId: "", quantity: "", unitPrice: "" });
  const [salesForm, setSalesForm] = useState({ customerName: "", customerEmail: "", totalAmount: "", shippingAddress: "" });

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listScmOrders();
      setPurchaseOrders(data.purchaseOrders);
      setSalesOrders(data.salesOrders);
    } catch (err: any) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createPurchase(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createPurchaseOrder({
        supplierCompanyId: purchaseForm.supplierCompanyId,
        items: [{ productId: purchaseForm.productId, quantity: Number(purchaseForm.quantity), unitPrice: Number(purchaseForm.unitPrice) }]
      });
      toast("Purchase order created.", "success");
      setPurchaseForm({ supplierCompanyId: "", productId: "", quantity: "", unitPrice: "" });
      await loadData();
    } catch (err: any) {
      toast(err.message || "Failed to create purchase order", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function createSales(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createSalesOrder({
        customerName: salesForm.customerName,
        customerEmail: salesForm.customerEmail || undefined,
        totalAmount: Number(salesForm.totalAmount),
        shippingAddress: salesForm.shippingAddress || undefined
      });
      toast("Sales order created.", "success");
      setSalesForm({ customerName: "", customerEmail: "", totalAmount: "", shippingAddress: "" });
      await loadData();
    } catch (err: any) {
      toast(err.message || "Failed to create sales order", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <Card className="mt-6 text-sm text-slate-600 dark:text-slate-300">{error}</Card>;

  return (
    <section className="mt-6 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-5">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">New Purchase Order</h2>
          <form className="mt-4 space-y-3" onSubmit={createPurchase}>
            <input className={fieldClassName} placeholder="Supplier Company ID" required value={purchaseForm.supplierCompanyId} onChange={(e) => setPurchaseForm((c) => ({ ...c, supplierCompanyId: e.target.value }))} />
            <input className={fieldClassName} placeholder="Product ID" required value={purchaseForm.productId} onChange={(e) => setPurchaseForm((c) => ({ ...c, productId: e.target.value }))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={fieldClassName} type="number" min="0" step="0.01" placeholder="Quantity" required value={purchaseForm.quantity} onChange={(e) => setPurchaseForm((c) => ({ ...c, quantity: e.target.value }))} />
              <input className={fieldClassName} type="number" min="0" step="0.01" placeholder="Unit Price" required value={purchaseForm.unitPrice} onChange={(e) => setPurchaseForm((c) => ({ ...c, unitPrice: e.target.value }))} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Saving..." : "Create Purchase Order"}</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">New Sales Order</h2>
          <form className="mt-4 space-y-3" onSubmit={createSales}>
            <input className={fieldClassName} placeholder="Customer Name" required value={salesForm.customerName} onChange={(e) => setSalesForm((c) => ({ ...c, customerName: e.target.value }))} />
            <input className={fieldClassName} type="email" placeholder="Customer Email" value={salesForm.customerEmail} onChange={(e) => setSalesForm((c) => ({ ...c, customerEmail: e.target.value }))} />
            <input className={fieldClassName} type="number" min="0" step="0.01" placeholder="Total Amount" required value={salesForm.totalAmount} onChange={(e) => setSalesForm((c) => ({ ...c, totalAmount: e.target.value }))} />
            <textarea className={`${fieldClassName} min-h-24 resize-y`} placeholder="Shipping Address" value={salesForm.shippingAddress} onChange={(e) => setSalesForm((c) => ({ ...c, shippingAddress: e.target.value }))} />
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Saving..." : "Create Sales Order"}</Button>
          </form>
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Purchase Orders</h2>
            <Badge variant="info">{purchaseOrders.length}</Badge>
          </div>
          {loading ? <p className="text-sm text-slate-500">Loading...</p> : purchaseOrders.length === 0 ? <p className="text-sm text-slate-500">No purchase orders yet.</p> : (
            <div className="space-y-3">
              {purchaseOrders.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.po_number}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.supplier_name ?? item.supplier_company_id}</p>
                    </div>
                    <Badge variant={statusBadge(item.status) as any}>{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Amount: {item.total_amount} {item.currency}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Sales Orders</h2>
            <Badge variant="success">{salesOrders.length}</Badge>
          </div>
          {loading ? <p className="text-sm text-slate-500">Loading...</p> : salesOrders.length === 0 ? <p className="text-sm text-slate-500">No sales orders yet.</p> : (
            <div className="space-y-3">
              {salesOrders.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.so_number}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.customer_name ?? "-"}</p>
                    </div>
                    <Badge variant={statusBadge(item.status) as any}>{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Amount: {item.total_amount} {item.currency}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
