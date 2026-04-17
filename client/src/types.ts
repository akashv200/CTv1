export type DomainKey = "agriculture" | "pharmaceutical" | "food" | "ecommerce" | "warehouse";

export interface DomainDefinition {
  key: DomainKey;
  name: string;
  accent: string;
  icon: string;
  subtitle: string;
  description: string;
}

export interface Product {
  id: string;
  domain: DomainKey;
  name: string;
  batchNumber: string;
  origin: string;
  status: "active" | "warning" | "critical";
  authenticityScore: number;
  createdAt: string;
  metadata: Record<string, string | number>;
}

export interface Checkpoint {
  id: string;
  productId: string;
  checkpointType: "received" | "quality-check" | "processed" | "dispatched" | "in-transit" | "delivered";
  location: string;
  timestamp: string;
  temperature?: number;
  humidity?: number;
  note?: string;
  txHash?: string;
}

export interface Insight {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  domain: DomainKey;
}
