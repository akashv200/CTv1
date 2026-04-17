import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Leaf,
  MapPinned,
  Pill,
  ShoppingCart,
  Thermometer,
  UtensilsCrossed,
  Warehouse
} from "lucide-react";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { domains } from "../data/domainConfig";
import { useChainTraceStore } from "../store/useChainTraceStore";
import type { DomainKey } from "../types";

type DomainDetail = {
  headline: string;
  summary: string;
  coreFeatures: string[];
  trackedFields: string[];
  widgets: string[];
  visualization: string;
  aiFeatures: string[];
};

const domainDetails: Record<DomainKey, DomainDetail> = {
  agriculture: {
    headline: "Farm-to-Fork Traceability",
    summary:
      "Track crop lifecycle, field conditions, certifications, and harvest movement from farm origin to final consumer checkpoints.",
    coreFeatures: ["Crop registration", "Weather and soil logging", "Organic certification tracking", "Harvest scheduling"],
    trackedFields: ["Crop type and variety", "Sowing and harvest dates", "Soil pH and NPK values", "Pesticide usage logs"],
    widgets: ["Seasonal harvest calendar", "Soil health score", "Active farms map", "Pending certifications"],
    visualization: "Virtual farm layout with growth stage overlays and field zoning.",
    aiFeatures: ["Yield prediction", "Soil anomaly detection", "Harvest window recommendation"]
  },
  pharmaceutical: {
    headline: "Cold Chain + Compliance Control",
    summary:
      "Secure every drug batch with temperature-aware checkpoints, anti-counterfeit verification, and compliance-ready audit trails.",
    coreFeatures: ["Drug batch tracking", "Expiry alerts", "Counterfeit detection", "Regulatory compliance records"],
    trackedFields: ["Batch number and MFG date", "Expiry date", "Storage temperature range", "Regulatory approvals"],
    widgets: ["Temperature violation chart", "Batch recall tracker", "Compliance checklist", "Expiry risk board"],
    visualization: "Cold-chain route with checkpoint temperature nodes and violation highlights.",
    aiFeatures: ["Temperature anomaly detection", "Expiry stock prediction", "Counterfeit pattern recognition"]
  },
  food: {
    headline: "Food Safety Intelligence",
    summary:
      "Map ingredient origin, allergen risk, processing checkpoints, and recall readiness with auditable proof of product handling.",
    coreFeatures: ["Ingredient tracking", "Allergen management", "Contamination alerts", "Recall workflow"],
    trackedFields: ["Ingredients and allergens", "Processing date", "Use-by date", "Contamination test results"],
    widgets: ["Allergen alert board", "Recall status panel", "Freshness meter", "Consumer feedback trend"],
    visualization: "Food processing flow with contamination source tracing and checkpoint analysis.",
    aiFeatures: ["Contamination pattern detection", "Shelf-life prediction", "Quality score forecasting"]
  },
  ecommerce: {
    headline: "Product Authenticity Assurance",
    summary:
      "Protect customers from counterfeit goods by linking product identity, seller trust, warranty history, and verification outcomes.",
    coreFeatures: ["Serial-based authentication", "Warranty tracking", "Seller verification", "Gray market detection"],
    trackedFields: ["SKU/ASIN", "Serial number", "Purchase date", "Warranty period"],
    widgets: ["Counterfeit detection rate", "Seller trust score", "Warranty expiry calendar", "Return rate analytics"],
    visualization: "Distribution network graph with authenticity score heat clusters.",
    aiFeatures: ["Image-based authenticity checks", "Fake review detection", "Price anomaly detection"]
  },
  warehouse: {
    headline: "Live Warehouse IoT Operations",
    summary:
      "Monitor stock, equipment, and environment in real time with a 3D warehouse scene driven by IoT telemetry and alerts.",
    coreFeatures: ["Live stock tracking", "Sensor monitoring", "Automated reorder alerts", "Predictive maintenance"],
    trackedFields: ["Rack-row-bin location", "Current stock and reorder point", "Sensor IDs", "Equipment health status"],
    widgets: ["Live 3D warehouse", "Stock level gauges", "Sensor stream dashboard", "Activity heatmap"],
    visualization: "Interactive warehouse with stock color coding, sensor nodes, and equipment paths.",
    aiFeatures: ["Demand forecasting", "Route optimization", "Theft and damage anomaly detection"]
  }
};

const domainIcons: Record<DomainKey, typeof Leaf> = {
  agriculture: Leaf,
  pharmaceutical: Pill,
  food: UtensilsCrossed,
  ecommerce: ShoppingCart,
  warehouse: Warehouse
};

function isDomainKey(value: string | undefined): value is DomainKey {
  return value === "agriculture" || value === "pharmaceutical" || value === "food" || value === "ecommerce" || value === "warehouse";
}

export default function DomainLearnMorePage() {
  const { domainKey } = useParams<{ domainKey: string }>();
  const setDomain = useChainTraceStore((state) => state.setDomain);

  if (!isDomainKey(domainKey)) {
    return <Navigate to="/" replace />;
  }

  const domain = domains.find((item) => item.key === domainKey) ?? domains[0];
  const detail = domainDetails[domainKey];
  const Icon = domainIcons[domainKey];

  const sectionCards = [
    { title: "Core Features", items: detail.coreFeatures },
    { title: "Tracked Fields", items: detail.trackedFields },
    { title: "Dashboard Widgets", items: detail.widgets },
    { title: "AI Focus", items: detail.aiFeatures }
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
          <ArrowLeft className="h-4 w-4" />
          Back to domains
        </Link>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-300">
          Domain Profile
        </span>
      </div>

      <section
        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card dark:border-slate-800 dark:bg-slate-900"
        style={{ boxShadow: `0 20px 48px -30px ${domain.accent}55` }}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold" style={{ color: domain.accent, backgroundColor: `${domain.accent}20` }}>
              <Icon className="h-4 w-4" />
              {domain.name}
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100">{detail.headline}</h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">{detail.summary}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link to="/register">
              <Button size="sm">Register Product</Button>
            </Link>
            <Link to="/dashboard" onClick={() => setDomain(domainKey)}>
              <Button size="sm" variant="secondary">
                Open Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {sectionCards.map((section) => (
          <Card key={section.title} className="h-full p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{section.title}</h2>
            <ul className="mt-4 space-y-2">
              {section.items.map((item) => (
                <li key={item} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Card className="p-7">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">3D + Tracking Experience</h2>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: domain.accent }}>
              <MapPinned className="h-4 w-4" />
              Visualization Layer
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{detail.visualization}</p>
          </div>
        </Card>
        <Card className="p-7">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Live Sensor + AI Signals</h2>
          <div className="mt-4 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Thermometer className="h-4 w-4 text-brand-blue" />
              Real-time condition monitoring
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Bot className="h-4 w-4 text-brand-blue" />
              Domain-specific anomaly intelligence
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
