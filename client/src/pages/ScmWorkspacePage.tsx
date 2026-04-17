import { Link } from "react-router-dom";
import { Boxes, Factory, FileBarChart2, Network, PlugZap, ShoppingCart, ShipWheel, Users2, Search } from "lucide-react";
import { cn } from "../lib/utils";
import OrderWorkspace from "../components/scm/OrderWorkspace";
import InventoryWorkspace from "../components/scm/InventoryWorkspace";
import OptimizationWorkspace from "../components/scm/OptimizationWorkspace";
import SupplierWorkspace from "../components/scm/SupplierWorkspace";
import ShipmentWorkspace from "../components/scm/ShipmentWorkspace";
import ProductionWorkspace from "../components/scm/ProductionWorkspace";
import ConnectorWorkspace from "../components/scm/ConnectorWorkspace";
import EcosystemArchitect from "../components/scm/EcosystemArchitect";
import DirectoryWorkspace from "../components/scm/DirectoryWorkspace";

type ScmSectionKey = "directory" | "ecosystem" | "suppliers" | "orders" | "inventory" | "shipments" | "production" | "optimization" | "connectors";

interface ScmWorkspacePageProps {
  sectionKey: ScmSectionKey;
}

const tabs: Array<{ key: ScmSectionKey; label: string; to: string }> = [
  { key: "directory", label: "Directory", to: "/scm/directory" },
  { key: "ecosystem", label: "Ecosystem", to: "/scm/ecosystem" },
  { key: "suppliers", label: "My Partners", to: "/scm/suppliers" },
  { key: "orders", label: "Orders", to: "/scm/orders" },
  { key: "inventory", label: "Inventory", to: "/scm/inventory" },
  { key: "shipments", label: "Shipments", to: "/scm/shipments" },
  { key: "production", label: "Production", to: "/scm/production" },
  { key: "optimization", label: "Optimization", to: "/scm/optimization" },
  { key: "connectors", label: "Connectors", to: "/scm/connectors" }
];

const meta = {
  directory: {
    title: "B2B Partner Directory",
    subtitle: "Discover verified manufacturers, suppliers, and distributors. Search by domain, location, or name and connect instantly.",
    icon: Search
  },
  ecosystem: {
    title: "Business Launch Ecosystem",
    subtitle: "Approved businesses browse trusted companies, shape partner chains, and move from idea to operating supply chain.",
    icon: Network
  },
  suppliers: {
    title: "Partner Directory and Contracts",
    subtitle: "Manage sourcing relationships, curated suppliers, and commercial offers that support new business formation.",
    icon: Users2
  },
  orders: {
    title: "Contract-Driven Orders",
    subtitle: "Handle inbound purchase orders and outbound sales orders inside the same supply chain operating model.",
    icon: ShoppingCart
  },
  inventory: {
    title: "Inventory and Store Readiness",
    subtitle: "Track stock, reorder points, location health, and the inventory posture needed to keep launched businesses running.",
    icon: Boxes
  },
  shipments: {
    title: "Shipment Control",
    subtitle: "Transport planning, route visibility, and fulfillment-stage monitoring across the partner chain.",
    icon: ShipWheel
  },
  production: {
    title: "Production Operations",
    subtitle: "Manufacturing orders, material planning, and work-in-progress tracking for contract-backed fulfillment.",
    icon: Factory
  },
  optimization: {
    title: "Optimization Board",
    subtitle: "Track savings opportunities, replenishment actions, and improvements across the ecosystem.",
    icon: FileBarChart2
  },
  connectors: {
    title: "Enterprise Connectors",
    subtitle: "Configure ERP, CRM, logistics, and custom integrations as businesses scale beyond the initial launch path.",
    icon: PlugZap
  }
} satisfies Record<ScmSectionKey, { title: string; subtitle: string; icon: typeof Users2 }>;

export default function ScmWorkspacePage({ sectionKey }: ScmWorkspacePageProps) {
  const section = meta[sectionKey];

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-3 py-1 text-xs font-semibold text-brand-blue">
          <section.icon className="h-4 w-4" />
          ContractChain Hub Workspace
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100">{section.title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{section.subtitle}</p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Access model</span>
            Admin approval unlocks curated partner browsing.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Operating model</span>
            Contracts, inventory, orders, and shipments stay connected.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Scale path</span>
            Add connectors, optimization rules, and partner workflows as you grow.
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              to={tab.to}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                tab.key === sectionKey
                  ? "bg-brand-gradient text-white"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-blue hover:text-brand-blue dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </section>

      {sectionKey === "directory" ? <DirectoryWorkspace /> : null}
      {sectionKey === "ecosystem" ? <EcosystemArchitect /> : null}
      {sectionKey === "suppliers" ? <SupplierWorkspace /> : null}
      {sectionKey === "orders" ? <OrderWorkspace /> : null}
      {sectionKey === "inventory" ? <InventoryWorkspace /> : null}
      {sectionKey === "shipments" ? <ShipmentWorkspace /> : null}
      {sectionKey === "production" ? <ProductionWorkspace /> : null}
      {sectionKey === "optimization" ? <OptimizationWorkspace /> : null}
      {sectionKey === "connectors" ? <ConnectorWorkspace /> : null}
    </main>
  );
}
