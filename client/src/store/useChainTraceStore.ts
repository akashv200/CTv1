import { create } from "zustand";
import { SHOW_DEMO_DATA } from "../config/features";
import { domains } from "../data/domainConfig";
import { sampleCheckpoints, sampleInsights, sampleProducts } from "../data/mock";
import { api } from "../services/api";
import { firebaseService } from "../services/firebaseService";
import type { Checkpoint, DomainKey, Insight, Product } from "../types";

function mapProduct(product: any): Product {
  return {
    id: product.productId ?? product.id,
    domain: product.domain,
    name: product.productName ?? product.name ?? product.productId,
    batchNumber: product.batchNumber ?? product.batch_number ?? "-",
    origin: product.originLocation ?? product.origin ?? "-",
    status: product.status ?? "active",
    authenticityScore: product.authenticityScore ?? product.authenticity_score ?? 0,
    createdAt: product.createdAt ?? product.created_at ?? new Date().toISOString(),
    metadata: (product.metadata ?? {}) as Record<string, string | number>
  };
}

function mapCheckpoint(checkpoint: any): Checkpoint {
  return {
    id: checkpoint.id,
    productId: checkpoint.productId ?? checkpoint.product_id,
    checkpointType: checkpoint.checkpointType ?? checkpoint.checkpoint_type,
    location: checkpoint.location,
    timestamp: checkpoint.occurredAt ?? checkpoint.createdAt ?? checkpoint.created_at ?? checkpoint.timestamp ?? new Date().toISOString(),
    temperature: checkpoint.temperature ?? undefined,
    humidity: checkpoint.humidity ?? undefined,
    note: checkpoint.notes ?? checkpoint.note ?? undefined,
    txHash: checkpoint.blockchainTxHash ?? checkpoint.blockchain_tx_hash ?? checkpoint.txHash ?? undefined
  };
}

function mapInsight(insight: any): Insight {
  return {
    id: String(insight.id),
    severity: insight.severity ?? "info",
    title: insight.title ?? insight.anomalyType ?? "Insight",
    description: insight.description ?? "No description available.",
    domain: insight.domain ?? "agriculture"
  };
}

interface ChainTraceState {
  activeDomain: DomainKey;
  products: Product[];
  checkpoints: Checkpoint[];
  insights: Insight[];
  notifications: any[];
  iotDevices: any[];
  organization: any | null;
  setDomain: (domain: DomainKey) => void;
  registerProduct: (product: Product) => void;
  addCheckpoint: (checkpoint: Checkpoint) => void;
  initialize: () => Promise<void>;
}

export const useChainTraceStore = create<ChainTraceState>((set, get) => ({
  activeDomain: domains[0].key,
  products: SHOW_DEMO_DATA ? sampleProducts : [],
  checkpoints: SHOW_DEMO_DATA ? sampleCheckpoints : [],
  insights: SHOW_DEMO_DATA ? sampleInsights : [],
  notifications: [],
  iotDevices: [],
  organization: null,
  setDomain: (domain) => set(() => ({ activeDomain: domain })),
  registerProduct: async (product) => {
    set((state) => ({ products: [product, ...state.products] }));
    await firebaseService.addProduct(product);
  },
  addCheckpoint: async (checkpoint) => {
    set((state) => ({ checkpoints: [checkpoint, ...state.checkpoints] }));
    await firebaseService.addCheckpoint(checkpoint);
  },
  initialize: async () => {
    // Initial fetch from legacy API (optional, as Firestore will handle live data)
    const results = await Promise.allSettled([
      api.listProducts(),
      api.listCheckpoints(),
      api.listInsights(),
      api.listNotifications(),
      api.getOrganization(),
      api.listIoTDevices()
    ]);

    const products = results[0].status === "fulfilled" ? results[0].value.map(mapProduct) : [];
    const checkpoints = results[1].status === "fulfilled" ? results[1].value.map(mapCheckpoint) : [];
    const insights = results[2].status === "fulfilled" ? results[2].value.map(mapInsight) : [];
    const notifications = results[3].status === "fulfilled" ? results[3].value : [];
    const organization = results[4].status === "fulfilled" ? results[4].value : null;
    const iotDevices = results[5].status === "fulfilled" ? results[5].value : [];

    set({
      products: products.length > 0 ? products : (SHOW_DEMO_DATA ? sampleProducts : []),
      checkpoints: checkpoints.length > 0 ? checkpoints : (SHOW_DEMO_DATA ? sampleCheckpoints : []),
      insights: insights.length > 0 ? insights : (SHOW_DEMO_DATA ? sampleInsights : []),
      notifications,
      iotDevices,
      organization
    });

    // START FIREBASE REAL-TIME LISTENERS
    firebaseService.subscribeProducts((firebaseProducts) => {
      const mapped = firebaseProducts.map(mapProduct);
      set((state) => ({ 
        products: mapped.length > 0 ? mapped : state.products 
      }));
    });

    firebaseService.subscribeCheckpoints((firebaseCheckpoints) => {
      const mapped = firebaseCheckpoints.map(mapCheckpoint);
      set((state) => ({ 
        checkpoints: mapped.length > 0 ? mapped : state.checkpoints 
      }));
    });

    firebaseService.subscribeInsights((firebaseInsights) => {
      const mapped = firebaseInsights.map(mapInsight);
      set((state) => ({ 
        insights: mapped.length > 0 ? mapped : state.insights 
      }));
    });
  }
}));
