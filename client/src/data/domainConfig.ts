import type { DomainDefinition } from "../types";

export const domains: DomainDefinition[] = [
  {
    key: "agriculture",
    name: "Agriculture",
    accent: "#22C55E",
    icon: "🌾",
    subtitle: "Farm to fork",
    description: "Track crops, certifications, and field conditions from sowing to retail."
  }
];

export const domainHighlights = {
  agriculture: ["Harvest tracking", "Certification verified", "Location history"]
} as const;
