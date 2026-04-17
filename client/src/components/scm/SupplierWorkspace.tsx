import { useEffect, useState } from "react";
import Button from "../common/Button";
import Card from "../common/Card";
import Badge from "../common/Badge";
import { api, type PartnerCatalogEntry, type SupplierRelationship } from "../../services/api";
import { useToast } from "../common/Toast";

const fieldClassName =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

function badgeForStatus(status?: string) {
  if (!status) return "default";
  if (["active", "available"].includes(status)) return "success";
  if (["prospect", "medium", "limited"].includes(status)) return "warning";
  if (["high", "critical", "terminated"].includes(status)) return "danger";
  return "info";
}

function money(value: number | null | undefined, currency = "USD") {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export default function SupplierWorkspace() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relationships, setRelationships] = useState<SupplierRelationship[]>([]);
  const [catalogEntries, setCatalogEntries] = useState<PartnerCatalogEntry[]>([]);
  const [relationshipForm, setRelationshipForm] = useState({
    supplierCompanyId: "",
    relationshipType: "supplier",
    category: "",
    riskLevel: "medium"
  });
  const [catalogForm, setCatalogForm] = useState({
    itemName: "",
    itemType: "raw_material",
    sku: "",
    unitPrice: "",
    unit: "kg"
  });

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [supplierRows, catalogRows] = await Promise.all([api.listSupplierRelationships(), api.listPartnerCatalogEntries()]);
      setRelationships(supplierRows);
      setCatalogEntries(catalogRows);
    } catch (err: any) {
      setError(err.message || "Failed to load supplier workspace.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createRelationship(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createSupplierRelationship({
        supplierCompanyId: relationshipForm.supplierCompanyId,
        relationshipType: relationshipForm.relationshipType,
        category: relationshipForm.category || undefined,
        riskLevel: relationshipForm.riskLevel
      });
      toast("Supplier relationship created.", "success");
      setRelationshipForm({ supplierCompanyId: "", relationshipType: "supplier", category: "", riskLevel: "medium" });
      await loadData();
    } catch (err: any) {
      toast(err.message || "Failed to create supplier relationship", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function createCatalogEntry(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createPartnerCatalogEntry({
        itemName: catalogForm.itemName,
        itemType: catalogForm.itemType,
        sku: catalogForm.sku || undefined,
        unit: catalogForm.unit,
        unitPrice: catalogForm.unitPrice ? Number(catalogForm.unitPrice) : undefined
      });
      toast("Catalog entry published.", "success");
      setCatalogForm({ itemName: "", itemType: "raw_material", sku: "", unitPrice: "", unit: "kg" });
      await loadData();
    } catch (err: any) {
      toast(err.message || "Failed to publish catalog entry", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return <Card className="mt-6 text-sm text-slate-600 dark:text-slate-300">{error}</Card>;
  }

  return (
    <section className="mt-6 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-5">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Link Supplier</h2>
          <form className="mt-4 space-y-3" onSubmit={createRelationship}>
            <input className={fieldClassName} placeholder="Supplier Company ID" required value={relationshipForm.supplierCompanyId} onChange={(e) => setRelationshipForm((c) => ({ ...c, supplierCompanyId: e.target.value }))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className={fieldClassName} value={relationshipForm.relationshipType} onChange={(e) => setRelationshipForm((c) => ({ ...c, relationshipType: e.target.value }))}>
                <option value="supplier">Supplier</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="distributor">Distributor</option>
                <option value="logistics_partner">Logistics Partner</option>
              </select>
              <select className={fieldClassName} value={relationshipForm.riskLevel} onChange={(e) => setRelationshipForm((c) => ({ ...c, riskLevel: e.target.value }))}>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>
            </div>
            <input className={fieldClassName} placeholder="Category" value={relationshipForm.category} onChange={(e) => setRelationshipForm((c) => ({ ...c, category: e.target.value }))} />
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Saving..." : "Create Relationship"}</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Publish Catalog Entry</h2>
          <form className="mt-4 space-y-3" onSubmit={createCatalogEntry}>
            <input className={fieldClassName} placeholder="Item Name" required value={catalogForm.itemName} onChange={(e) => setCatalogForm((c) => ({ ...c, itemName: e.target.value }))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className={fieldClassName} value={catalogForm.itemType} onChange={(e) => setCatalogForm((c) => ({ ...c, itemType: e.target.value }))}>
                <option value="raw_material">Raw Material</option>
                <option value="component">Component</option>
                <option value="finished_good">Finished Good</option>
                <option value="service">Service</option>
              </select>
              <input className={fieldClassName} placeholder="SKU" value={catalogForm.sku} onChange={(e) => setCatalogForm((c) => ({ ...c, sku: e.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={fieldClassName} placeholder="Unit" value={catalogForm.unit} onChange={(e) => setCatalogForm((c) => ({ ...c, unit: e.target.value }))} />
              <input className={fieldClassName} type="number" min="0" step="0.01" placeholder="Unit Price" value={catalogForm.unitPrice} onChange={(e) => setCatalogForm((c) => ({ ...c, unitPrice: e.target.value }))} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Saving..." : "Publish Entry"}</Button>
          </form>
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Supplier Relationships</h2>
            <Badge variant="info">{relationships.length} linked</Badge>
          </div>
          {loading ? <p className="text-sm text-slate-500">Loading...</p> : relationships.length === 0 ? <p className="text-sm text-slate-500">No supplier relationships yet.</p> : (
            <div className="space-y-3">
              {relationships.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.supplier_name ?? item.supplier_company_id}</p>
                    <Badge variant={badgeForStatus(item.contract_status) as any}>{item.contract_status}</Badge>
                    <Badge variant={badgeForStatus(item.risk_level) as any}>{item.risk_level}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Type: {item.relationship_type} | Domain: {item.supplier_domain ?? "-"}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Partner Catalog</h2>
            <Badge variant="success">{catalogEntries.length} items</Badge>
          </div>
          {loading ? <p className="text-sm text-slate-500">Loading...</p> : catalogEntries.length === 0 ? <p className="text-sm text-slate-500">No catalog entries yet.</p> : (
            <div className="grid gap-3 lg:grid-cols-2">
              {catalogEntries.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{entry.item_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{entry.company_name ?? "Your org"}</p>
                    </div>
                    <Badge variant={badgeForStatus(entry.availability_status) as any}>{entry.availability_status}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Type: {entry.item_type} | SKU: {entry.sku ?? "-"}</p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{money(entry.unit_price, entry.currency)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
