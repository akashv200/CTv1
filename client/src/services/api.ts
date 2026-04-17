let envApiBase = import.meta.env.VITE_API_BASE_URL ?? "/api";
if (envApiBase.includes("localhost:4000")) {
  envApiBase = "/api";
}
const API_BASE = envApiBase;

interface ApiError {
  error: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers ?? {})
      },
      ...options
    });
  } catch (error) {
    const apiOrigin = API_BASE.startsWith("/") ? window.location.origin : API_BASE.replace(/\/api\/?$/, "");
    throw new Error(`Unable to reach the backend. Make sure the server is running and the API URL is correct (Attempted: ${apiOrigin}).`);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ error: "Request failed" }))) as ApiError;
    throw new Error(payload.error ?? "Request failed");
  }

  return (await response.json()) as T;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SupplierRelationship {
  id: string;
  buyer_company_id: string;
  supplier_company_id: string;
  relationship_type: string;
  category: string | null;
  contract_status: string;
  performance_score: number | null;
  risk_level: string;
  lead_time_days: number | null;
  payment_terms: string | null;
  metadata: Record<string, unknown>;
  supplier_name?: string;
  supplier_domain?: string;
  supplier_country?: string | null;
  buyer_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerCatalogEntry {
  id: string;
  company_id: string;
  product_id: string | null;
  item_name: string;
  item_type: string;
  sku: string | null;
  description: string | null;
  min_order_quantity: number;
  unit: string;
  unit_price: number | null;
  currency: string;
  lead_time_days: number | null;
  availability_status: string;
  metadata: Record<string, unknown>;
  company_name?: string;
  domain?: string;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  shipment_code: string;
  order_type: string;
  order_id: string | null;
  source_company_id: string;
  destination_company_id: string | null;
  current_status: string;
  carrier_name: string | null;
  tracking_number: string | null;
  freight_cost: number | null;
  estimated_departure_at: string | null;
  estimated_arrival_at: string | null;
  actual_departure_at: string | null;
  actual_arrival_at: string | null;
  route_summary: string | null;
  source_company_name?: string;
  destination_company_name?: string | null;
  leg_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductionOrder {
  id: string;
  production_number: string;
  company_id: string;
  target_product_id: string;
  target_quantity: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  supervisor_id: string | null;
  target_product_name?: string | null;
  material_count?: number;
  latest_stage_name?: string | null;
  latest_stage_status?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryStockRecord {
  id: string;
  company_id: string;
  warehouse_layout_id: string | null;
  product_id: string | null;
  sku: string;
  rack_row_bin: string | null;
  lot_number: string | null;
  serial_number: string | null;
  quantity: number;
  reorder_point: number;
  max_capacity: number | null;
  status: string;
  warehouse_name?: string | null;
  product_name?: string | null;
  expiry_date: string | null;
  updated_at: string;
}

export interface ScmOrdersResponse {
  purchaseOrders: Array<Record<string, unknown>>;
  salesOrders: Array<Record<string, unknown>>;
}

export interface OptimizationRecommendation {
  id: number;
  company_id: string | null;
  recommendation_type: string;
  severity: string;
  title: string;
  description: string;
  estimated_savings: number | null;
  target_entity_type: string | null;
  target_entity_id: string | null;
  status: string;
  created_at: string;
}

export interface InventoryOptimizationSuggestion {
  id: string;
  company_id: string;
  warehouse_layout_id: string | null;
  product_id: string | null;
  sku: string;
  quantity: number;
  reorder_point: number;
  max_capacity: number | null;
  status: string;
  warehouse_name?: string | null;
  product_name?: string | null;
  predicted_demand_quantity?: number | null;
  daily_demand: number;
  lead_time_days_used: number;
  safety_stock: number;
  suggested_reorder_point: number;
  target_stock_level: number;
  suggested_replenishment_qty: number;
  stock_cover_days: number | null;
  suggested_status: string;
  updated_at: string;
}

export interface OnboardingRequest {
  id: string;
  company_name: string;
  domain: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  country: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface OnboardingSummary {
  pending: number;
  approved: number;
  rejected: number;
}

export interface IntegrationConnector {
  id: string;
  company_id: string | null;
  provider: string;
  connector_type: string;
  display_name: string;
  status: string;
  base_url: string | null;
  auth_type: string;
  credentials: Record<string, unknown>;
  settings: Record<string, unknown>;
  last_sync_at: string | null;
  last_test_at: string | null;
  last_test_status: string | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
  company_name?: string | null;
  updated_at: string;
}

export interface DirectoryCompany {
  id: string;
  company_code: string;
  domain: string;
  company_name: string;
  website: string | null;
  country: string | null;
  city: string | null;
  status: string;
  created_at: string;
  already_linked: boolean;
}

export interface SupplyChainNetworkPartner {
  id: string;
  company_id: string;
  company_name: string;
  company_domain: string;
  partner_role: string;
  stage_order: number;
  relationship_id: string | null;
  notes: string | null;
}

export interface SupplyChainNetwork {
  id: string;
  owner_company_id: string;
  name: string;
  description: string | null;
  domain: string;
  status: string;
  blockchain_address?: string;
  governance_approvals?: Array<{ userId: string; role: string; action: string; timestamp: string }>;
  created_at: string;
  updated_at: string;
  partners: SupplyChainNetworkPartner[];
}

export interface VerificationResponse {
  product: any;
  checkpoints: any[];
}

export const api = {
  health: () => request<{ ok: boolean; service: string }>("/health"),
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  registerConsumer: (payload: { name: string; email: string; password: string }) =>
    request<{ id: string; email: string; role: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...payload, role: "consumer" })
    }),
  submitBusinessAccessRequest: (payload: {
    company_name: string;
    domain: string;
    contact_name: string;
    contact_email: string;
    contact_phone?: string;
    website?: string;
    country?: string;
  }) =>
    request<{ message: string; id: string }>("/onboarding/request", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getOnboardingSummary: () => request<OnboardingSummary>("/onboarding/summary"),
  listOnboardingRequests: (status = "pending") => request<OnboardingRequest[]>(`/onboarding/requests?status=${encodeURIComponent(status)}`),
  approveOnboardingRequest: (id: string) =>
    request<{ message: string; companyId: string }>(`/onboarding/requests/${id}/approve`, {
      method: "POST"
    }),
  rejectOnboardingRequest: (id: string, notes?: string) =>
    request<{ message: string }>(`/onboarding/requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ notes: notes ?? "" })
    }),
  registerProduct: (payload: Record<string, unknown>) =>
    request("/products", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listProducts: (domain?: string) => request<any[]>(domain ? `/products?domain=${domain}` : "/products"),
  listCheckpoints: (limit = 20) => request<any[]>(`/checkpoints?limit=${limit}`),
  verifyProduct: (productId: string) => request<VerificationResponse>(`/verify/${encodeURIComponent(productId)}`),
  listInsights: (limit = 10) => request<any[]>(`/ai/insights?limit=${limit}`),
  listNotifications: (limit = 20) => request<any[]>(`/notifications?limit=${limit}`),
  getOrganization: () => request<any>("/organization/me"),
  updateOrganization: (payload: any) =>
    request("/organization/me", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  listB2bDirectory: (params?: { domain?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.domain) query.set("domain", params.domain);
    if (params?.search) query.set("search", params.search);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<DirectoryCompany[]>(`/b2b/directory${suffix}`);
  },
  listSupplyChainNetworks: () => request<SupplyChainNetwork[]>("/b2b/networks"),
  createSupplyChainNetwork: (payload: {
    name: string;
    domain: string;
    description?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  }) =>
    request<{ message: string; id: string }>("/b2b/networks", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  addSupplyChainPartner: (
    networkId: string,
    payload: {
      partnerCompanyId: string;
      partnerRole: string;
      stageOrder?: number;
      notes?: string;
      metadata?: Record<string, unknown>;
    }
  ) =>
    request<{ message: string; id: string; relationshipId: string }>(`/b2b/networks/${networkId}/partners`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  deployNetwork: (networkId: string, payload: { nodes: any[]; edges: any[] }) =>
    request<{ message: string; deployments: any[] }>(`/b2b/networks/${networkId}/deploy`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  approveNetwork: (networkId: string) =>
    request<{ message: string; approvals: number; status: string; blockchainAddress: string | null }>(`/b2b/networks/${networkId}/approve`, {
      method: "POST"
    }),
  listSupplierRelationships: () => request<SupplierRelationship[]>("/scm/supplier-relationships"),
  createSupplierRelationship: (payload: {
    supplierCompanyId: string;
    relationshipType?: string;
    category?: string;
    contractStatus?: string;
    performanceScore?: number;
    riskLevel?: string;
    leadTimeDays?: number;
    paymentTerms?: string;
    metadata?: Record<string, unknown>;
  }) =>
    request<{ message: string; id: string }>("/scm/supplier-relationships", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listPartnerCatalogEntries: (params?: { domain?: string; search?: string; itemType?: string }) => {
    const query = new URLSearchParams();
    if (params?.domain) query.set("domain", params.domain);
    if (params?.search) query.set("search", params.search);
    if (params?.itemType) query.set("itemType", params.itemType);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<PartnerCatalogEntry[]>(`/scm/partner-catalog${suffix}`);
  },
  createPartnerCatalogEntry: (payload: {
    productId?: string;
    itemName: string;
    itemType?: string;
    sku?: string;
    description?: string;
    minOrderQuantity?: number;
    unit?: string;
    unitPrice?: number;
    currency?: string;
    leadTimeDays?: number;
    availabilityStatus?: string;
    metadata?: Record<string, unknown>;
  }) =>
    request<{ message: string; id: string }>("/scm/partner-catalog", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listShipments: () => request<Shipment[]>("/scm/shipments"),
  createShipment: (payload: {
    orderType?: string;
    orderId?: string;
    destinationCompanyId: string;
    currentStatus?: string;
    carrierName?: string;
    trackingNumber?: string;
    freightCost?: number;
    estimatedDepartureAt?: string;
    estimatedArrivalAt?: string;
    routeSummary?: string;
    metadata?: Record<string, unknown>;
    legs?: Array<{
      legSequence?: number;
      originLocation: string;
      destinationLocation: string;
      transportMode?: string;
      status?: string;
      plannedDepartureAt?: string;
      plannedArrivalAt?: string;
      actualDepartureAt?: string;
      actualArrivalAt?: string;
      distanceKm?: number;
      metadata?: Record<string, unknown>;
    }>;
  }) =>
    request<{ message: string; shipmentId: string; shipmentCode: string }>("/scm/shipments", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listProductionOrders: () => request<ProductionOrder[]>("/scm/production-orders"),
  createProductionOrder: (payload: {
    targetProductId: string;
    targetQuantity: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    supervisorId?: string;
  }) =>
    request<{ message: string; id: string; productionNumber: string }>("/scm/production-orders", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  addProductionOrderMaterial: (
    productionOrderId: string,
    payload: {
      inputProductId?: string;
      inputSku?: string;
      plannedQuantity: number;
      consumedQuantity?: number;
      wasteQuantity?: number;
      unit?: string;
      metadata?: Record<string, unknown>;
    }
  ) =>
    request<{ message: string; materialId: string }>(`/scm/production-orders/${productionOrderId}/materials`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  addProductionOrderWipEvent: (
    productionOrderId: string,
    payload: {
      stageName: string;
      workstation?: string;
      status?: string;
      startedAt?: string;
      endedAt?: string;
      notes?: string;
      metadata?: Record<string, unknown>;
    }
  ) =>
    request<{ message: string; wipEventId: string }>(`/scm/production-orders/${productionOrderId}/wip-events`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listScmOrders: () => request<ScmOrdersResponse>("/scm/orders"),
  createPurchaseOrder: (payload: {
    supplierCompanyId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  }) =>
    request<{ message: string; poId: string; poNumber: string; totalAmount: number }>("/scm/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  createSalesOrder: (payload: {
    customerName: string;
    customerEmail?: string;
    totalAmount: number;
    shippingAddress?: string;
    currency?: string;
    status?: string;
  }) =>
    request<{ message: string; salesOrderId: string; salesOrderNumber: string }>("/scm/orders/sales", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listInventoryStock: () => request<InventoryStockRecord[]>("/scm/inventory"),
  createInventoryStockRecord: (payload: {
    warehouseLayoutId?: string;
    productId?: string;
    sku: string;
    rackRowBin?: string;
    lotNumber?: string;
    serialNumber?: string;
    quantity: number;
    reorderPoint?: number;
    maxCapacity?: number;
    status?: string;
    expiryDate?: string;
    metadata?: Record<string, unknown>;
  }) =>
    request<{ message: string; inventoryId: string }>("/scm/inventory", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listInventoryOptimizationSuggestions: () => request<InventoryOptimizationSuggestion[]>("/scm/inventory/optimization"),
  runInventoryOptimization: () =>
    request<{ message: string; optimizedItems: number; createdRecommendations: number }>("/scm/inventory/optimization/run", {
      method: "POST"
    }),
  listOptimizationRecommendations: () => request<OptimizationRecommendation[]>("/scm/optimization/recommendations"),
  createOptimizationRecommendation: (payload: {
    recommendationType: string;
    severity?: string;
    title: string;
    description: string;
    estimatedSavings?: number;
    targetEntityType?: string;
    targetEntityId?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  }) =>
    request<{ message: string; id: number }>("/scm/optimization/recommendations", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listIntegrationConnectors: (params?: { scope?: "all" }) => {
    const query = new URLSearchParams();
    if (params?.scope) query.set("scope", params.scope);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<IntegrationConnector[]>(`/integrations/connectors${suffix}`);
  },
  saveIntegrationConnector: (payload: {
    id?: string;
    companyId?: string;
    provider: string;
    connectorType?: string;
    displayName: string;
    status?: string;
    baseUrl?: string;
    authType?: string;
    credentials?: Record<string, unknown>;
    settings?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) =>
    request<{ message: string; id: string }>("/integrations/connectors", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  testIntegrationConnector: (id: string) =>
    request<{ ok: boolean; connectorId: string; provider: string; message: string }>(`/integrations/connectors/${id}/test`, {
      method: "POST"
    }),
  listIoTDevices: () => request<any[]>("/iot"),
  toggleSimulationMode: (enabled: boolean) =>
    request("/iot/simulation-mode", {
      method: "POST",
      body: JSON.stringify({ enabled })
    }),
  getMe: () => request<any>("/users/me"),
  updateMe: (payload: { name?: string; avatarUrl?: string }) =>
    request("/users/me", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  inspectPasswordToken: (token: string) => 
    request<{ userId: string; email: string; name: string; purpose: string; companyName?: string }>(`/auth/password/token/${encodeURIComponent(token)}`),
  completePasswordFlow: (token: string, password: string) => 
    request<{ message: string }>("/auth/password/complete", {
      method: "POST",
      body: JSON.stringify({ token, password })
    })
};
