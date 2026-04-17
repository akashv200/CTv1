import type { Checkpoint, Insight, Product } from "../types";

export const sampleProducts: Product[] = [
  {
    id: "CT-AG-1001",
    domain: "agriculture",
    name: "Organic Basmati Rice",
    batchNumber: "AG-2026-1001",
    origin: "Punjab, India",
    status: "active",
    authenticityScore: 97,
    createdAt: new Date().toISOString(),
    metadata: {
      cropType: "Rice",
      soilPH: 6.8,
      harvestWindow: "March 2026"
    }
  },
  {
    id: "CT-PH-3044",
    domain: "pharmaceutical",
    name: "Amoxicillin 500mg",
    batchNumber: "PH-2026-3044",
    origin: "New Jersey, USA",
    status: "warning",
    authenticityScore: 93,
    createdAt: new Date().toISOString(),
    metadata: {
      storageRange: "2-8 C",
      expiryDate: "2026-08-30",
      fdaApproval: "NDA-11302"
    }
  },
  {
    id: "CT-WH-9910",
    domain: "warehouse",
    name: "Warehouse Sensor Bundle",
    batchNumber: "WH-2026-9910",
    origin: "Dallas, USA",
    status: "critical",
    authenticityScore: 88,
    createdAt: new Date().toISOString(),
    metadata: {
      sku: "SK-99X-01",
      stockLevel: 12,
      reorderPoint: 20
    }
  }
];

export const sampleCheckpoints: Checkpoint[] = [
  {
    id: "CP-1",
    productId: "CT-PH-3044",
    checkpointType: "received",
    location: "Distribution Hub A",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    temperature: 5.3,
    humidity: 48,
    txHash: "0x8f8c...13ab"
  },
  {
    id: "CP-2",
    productId: "CT-PH-3044",
    checkpointType: "in-transit",
    location: "Interstate Route 95",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    temperature: 9.1,
    humidity: 52,
    note: "Threshold exceeded for 14 minutes",
    txHash: "0x1a12...9d0f"
  },
  {
    id: "CP-3",
    productId: "CT-AG-1001",
    checkpointType: "quality-check",
    location: "Milling Facility",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    temperature: 24,
    humidity: 44,
    txHash: "0xa0ce...44aa"
  }
];

export const sampleInsights: Insight[] = [
  {
    id: "I-1",
    severity: "critical",
    domain: "pharmaceutical",
    title: "Temperature Spike Detected",
    description: "Batch PH-2026-3044 exceeded 8 C threshold in transit for 14 minutes."
  },
  {
    id: "I-2",
    severity: "warning",
    domain: "warehouse",
    title: "Reorder Needed",
    description: "SKU SK-99X-01 projected below safety stock in 3 days."
  },
  {
    id: "I-3",
    severity: "info",
    domain: "agriculture",
    title: "Yield Forecast Improved",
    description: "Expected yield up by 6.2% after irrigation schedule optimization."
  }
];
