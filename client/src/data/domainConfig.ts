import type { DomainDefinition } from "../types";

export const domains: DomainDefinition[] = [
  {
    key: "agriculture",
    name: "Agriculture",
    accent: "#22C55E",
    icon: "??",
    subtitle: "Farm to fork",
    description: "Track crops, certifications, and field conditions from sowing to retail."
  },
  {
    key: "pharmaceutical",
    name: "Pharmaceutical",
    accent: "#8B5CF6",
    icon: "??",
    subtitle: "Cold chain integrity",
    description: "Secure drug batches with compliance checks and anomaly detection."
  },
  {
    key: "food",
    name: "Food Safety",
    accent: "#F97316",
    icon: "???",
    subtitle: "Ingredient traceability",
    description: "Monitor ingredients, contamination events, and recall readiness."
  },
  {
    key: "ecommerce",
    name: "E-commerce",
    accent: "#EC4899",
    icon: "???",
    subtitle: "Authenticity first",
    description: "Validate products, warranty chains, and anti-counterfeit evidence."
  },
  {
    key: "warehouse",
    name: "Warehouse IoT",
    accent: "#06B6D4",
    icon: "??",
    subtitle: "Live operations",
    description: "Visualize racks, sensors, stock, and equipment in real-time."
  }
];

export const domainHighlights = {
  agriculture: ["Soil health score", "Harvest predictor", "Organic certificates"],
  pharmaceutical: ["Expiry alerts", "Temperature violations", "Counterfeit risk"],
  food: ["Allergen alerts", "Recall tracker", "Shelf-life prediction"],
  ecommerce: ["Authenticity score", "Seller risk", "Warranty lifecycle"],
  warehouse: ["3D rack heatmap", "Sensor streams", "Predictive maintenance"]
} as const;
