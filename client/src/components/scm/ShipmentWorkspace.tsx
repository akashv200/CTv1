import { useEffect, useState } from "react";
import Button from "../common/Button";
import Card from "../common/Card";
import Badge from "../common/Badge";
import { api, type Shipment } from "../../services/api";
import { useToast } from "../common/Toast";
import { formatDate } from "../../lib/utils";

const fieldClassName =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

function money(value: number | null | undefined) {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function badgeForStatus(status?: string) {
  if (!status) return "default";
  if (["delivered"].includes(status)) return "success";
  if (["planned", "packed", "in_transit", "delayed"].includes(status)) return "warning";
  if (["cancelled"].includes(status)) return "danger";
  return "info";
}

export default function ShipmentWorkspace() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [form, setForm] = useState({
    destinationCompanyId: "",
    carrierName: "",
    trackingNumber: "",
    freightCost: "",
    routeSummary: "",
    originLocation: "",
    destinationLocation: "",
    transportMode: "road"
  });

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      setShipments(await api.listShipments());
    } catch (err: any) {
      setError(err.message || "Failed to load shipments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createShipment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createShipment({
        destinationCompanyId: form.destinationCompanyId,
        carrierName: form.carrierName || undefined,
        trackingNumber: form.trackingNumber || undefined,
        freightCost: form.freightCost ? Number(form.freightCost) : undefined,
        routeSummary: form.routeSummary || undefined,
        legs:
          form.originLocation && form.destinationLocation
            ? [
                {
                  originLocation: form.originLocation,
                  destinationLocation: form.destinationLocation,
                  transportMode: form.transportMode
                }
              ]
            : undefined
      });
      toast("Shipment created successfully.", "success");
      setForm({
        destinationCompanyId: "",
        carrierName: "",
        trackingNumber: "",
        freightCost: "",
        routeSummary: "",
        originLocation: "",
        destinationLocation: "",
        transportMode: "road"
      });
      await loadData();
    } catch (err: any) {
      toast(err.message || "Failed to create shipment", "error");
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
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Shipment</h2>
        <form className="mt-4 space-y-3" onSubmit={createShipment}>
          <input className={fieldClassName} placeholder="Destination Company ID" required value={form.destinationCompanyId} onChange={(e) => setForm((c) => ({ ...c, destinationCompanyId: e.target.value }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={fieldClassName} placeholder="Carrier" value={form.carrierName} onChange={(e) => setForm((c) => ({ ...c, carrierName: e.target.value }))} />
            <input className={fieldClassName} placeholder="Tracking Number" value={form.trackingNumber} onChange={(e) => setForm((c) => ({ ...c, trackingNumber: e.target.value }))} />
          </div>
          <textarea className={`${fieldClassName} min-h-24 resize-y`} placeholder="Route Summary" value={form.routeSummary} onChange={(e) => setForm((c) => ({ ...c, routeSummary: e.target.value }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={fieldClassName} placeholder="Origin Location" value={form.originLocation} onChange={(e) => setForm((c) => ({ ...c, originLocation: e.target.value }))} />
            <input className={fieldClassName} placeholder="Destination Location" value={form.destinationLocation} onChange={(e) => setForm((c) => ({ ...c, destinationLocation: e.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select className={fieldClassName} value={form.transportMode} onChange={(e) => setForm((c) => ({ ...c, transportMode: e.target.value }))}>
              <option value="road">Road</option>
              <option value="rail">Rail</option>
              <option value="air">Air</option>
              <option value="sea">Sea</option>
              <option value="multimodal">Multimodal</option>
            </select>
            <input className={fieldClassName} type="number" min="0" step="0.01" placeholder="Freight Cost" value={form.freightCost} onChange={(e) => setForm((c) => ({ ...c, freightCost: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Saving..." : "Create Shipment"}</Button>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Shipment Board</h2>
          <Badge variant="info">{shipments.length} tracked</Badge>
        </div>
        {loading ? <p className="text-sm text-slate-500">Loading...</p> : shipments.length === 0 ? <p className="text-sm text-slate-500">No shipments created yet.</p> : (
          <div className="space-y-3">
            {shipments.map((shipment) => (
              <div key={shipment.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{shipment.shipment_code}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {shipment.source_company_name ?? shipment.source_company_id} to {shipment.destination_company_name ?? shipment.destination_company_id ?? "-"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={badgeForStatus(shipment.current_status) as any}>{shipment.current_status}</Badge>
                    <Badge variant="default">{shipment.leg_count ?? 0} legs</Badge>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
                  <span>Carrier: {shipment.carrier_name ?? "-"}</span>
                  <span>Tracking: {shipment.tracking_number ?? "-"}</span>
                  <span>ETA: {shipment.estimated_arrival_at ? formatDate(shipment.estimated_arrival_at) : "-"}</span>
                  <span>Freight: {money(shipment.freight_cost)}</span>
                </div>
                {shipment.route_summary ? <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{shipment.route_summary}</p> : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
