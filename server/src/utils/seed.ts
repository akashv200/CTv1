import { ensurePostgresSchema, pgPool } from "../config/postgres.js";
import { hashPassword } from "../utils/password.js";

const ids = {
  superAdmin: "seed-user-super-admin",
  demoAdmin: "seed-user-demo-admin",
  demoProducer: "seed-user-demo-producer",
  demoCompany: "org-demo",
  agri: "seed-company-agri",
  pharma: "seed-company-pharma",
  warehouse: "seed-company-warehouse",
  logistics: "seed-company-logistics",
  retail: "seed-company-retail",
  ecommerce: "seed-company-ecommerce",
  network: "seed-network-main"
} as const;

function json(value: unknown) {
  return JSON.stringify(value);
}

function isoDaysAgo(daysAgo: number, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

async function upsert(table: string, columns: string[], rows: unknown[][], conflict = "id") {
  if (rows.length === 0) return;
  const placeholders = rows
    .map((row, rowIndex) => `(${row.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(", ")})`)
    .join(", ");
  const updates = columns
    .filter((column) => column !== conflict && column !== "id" && column !== "created_at")
    .map((column) => `${column} = EXCLUDED.${column}`)
    .join(", ");
  await pgPool.query(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${placeholders} ON CONFLICT (${conflict}) DO UPDATE SET ${updates}`,
    rows.flat()
  );
}

async function seed() {
  console.log("[seed] Starting demo seed...");
  await ensurePostgresSchema();

  const superAdminPassword = await hashPassword("Admin@12345");
  const demoPassword = await hashPassword("Demo@12345");

  // ============================================================
  // 1. COMPANIES (with domain_metadata JSONB, no separate domain tables)
  // ============================================================
  await upsert(
    "companies",
    ["id", "company_code", "company_name", "domain", "contact_email", "contact_phone", "website", "country", "state", "city", "address_line1", "postal_code", "status", "domain_metadata", "warehouse_layouts", "network_memberships", "metadata"],
    [
      [ids.demoCompany, "DEMO-001", "BlueRiver Foods", "food", "ops@blueriver.io", "+91 90000 10001", "https://blueriver.demo", "India", "Karnataka", "Bengaluru", "Logistics Park Road 7", "560048", "active", json({ focus: "ecosystem owner", certifications: ["FSSAI", "ISO 22000"] }), json([{ id: "rack-a1", label: "A1" }, { id: "rack-b2", label: "B2" }, { id: "rack-c3", label: "C3" }]), [], json({ seed: "demo" })],
      [ids.agri, "AGRI-201", "GreenField Farms", "agriculture", "farm@greenfield.demo", "+91 90000 10002", "https://greenfield.demo", "India", "Karnataka", "Mysuru", "Farm Cluster 12", "570001", "active", json({ cultivars: ["Lakadong", "Alleppey"], farming_type: "organic" }), json([]), [], json({ seed: "demo" })],
      [ids.pharma, "PHAR-301", "PurePharma Labs", "pharmaceutical", "coldchain@purepharma.demo", "+91 90000 10003", "https://purepharma.demo", "India", "Maharashtra", "Pune", "Bio Valley Sector 4", "411001", "active", json({ gmp_certified: true, clean_room_class: "ISO 7" }), json([]), [], json({ seed: "demo" })],
      [ids.warehouse, "WHSE-401", "SafeStore Warehousing", "warehouse", "dock@safestore.demo", "+91 90000 10004", "https://safestore.demo", "India", "Telangana", "Hyderabad", "Warehouse Ring Road", "500081", "active", json({ cold_storage: true, automation_level: "semi-automated" }), json([{ id: "rack-w1", label: "W1-Cold" }, { id: "rack-w2", label: "W2-Ambient" }]), [], json({ seed: "demo" })],
      [ids.logistics, "LOGI-501", "SwiftRoute Logistics", "warehouse", "fleet@swiftroute.demo", "+91 90000 10005", "https://swiftroute.demo", "India", "Tamil Nadu", "Chennai", "Transport Corridor 5", "600001", "active", json({ fleet_size: 45, cold_chain_vehicles: 18 }), json([]), [], json({ seed: "demo" })],
      [ids.retail, "RETL-601", "MarketSquare Retail", "ecommerce", "stores@marketsquare.demo", "+91 90000 10006", "https://marketsquare.demo", "India", "Delhi", "New Delhi", "Retail Avenue 44", "110001", "active", json({ store_count: 12, online_presence: true }), json([]), [], json({ seed: "demo" })],
      [ids.ecommerce, "SHOP-701", "ShopGrid Commerce", "ecommerce", "growth@shopgrid.demo", "+91 90000 10007", "https://shopgrid.demo", "India", "Maharashtra", "Mumbai", "Marketplace Tower 2", "400001", "active", json({ platform: "shopify", monthly_orders: 5000 }), json([]), [], json({ seed: "demo" })]
    ]
  );

  // ============================================================
  // 2. USERS
  // ============================================================
  await upsert(
    "users",
    ["id", "organization_id", "name", "email", "password_hash", "role"],
    [
      [ids.superAdmin, null, "ChainTrace Super Admin", "admin@chaintrace.io", superAdminPassword, "super_admin"],
      [ids.demoAdmin, ids.demoCompany, "BlueRiver Org Admin", "demo@chaintrace.io", demoPassword, "org_admin"],
      [ids.demoProducer, ids.demoCompany, "BlueRiver Operations", "producer@chaintrace.io", demoPassword, "producer"]
    ],
    "email"
  );

  // ============================================================
  // 3. IOT DEVICES (new schema: device_id UNIQUE, device_type, is_active)
  // ============================================================
  await upsert(
    "iot_devices",
    ["id", "device_id", "company_id", "device_name", "device_type", "firmware_version", "mqtt_topic", "location_name", "is_active", "last_seen_at", "metadata"],
    [
      ["seed-device-1", "IOT-TEMP-01", ids.demoCompany, "Cold Room Sensor", "temperature_sensor", "3.2.1", "chaintrace/sensors/cold-room", "Cold Room A", true, new Date().toISOString(), json({ lastReading: { value: 3.8, unit: "C" } })],
      ["seed-device-2", "IOT-HUM-02", ids.demoCompany, "Humidity Monitor", "humidity_sensor", "2.8.0", "chaintrace/sensors/humidity", "Packing Zone 4", true, new Date().toISOString(), json({ lastReading: { value: 61, unit: "%" } })],
      ["seed-device-3", "IOT-DOOR-03", ids.demoCompany, "Dispatch Door Counter", "door_sensor", "1.4.9", "chaintrace/sensors/door", "Dock Door 7", false, new Date().toISOString(), json({ lastReading: { value: 188, unit: "opens/day" }, maintenance_due: true })]
    ]
  );

  // ============================================================
  // 4. PRODUCTS (new schema: company_id, registered_by, domain_metadata, visibility, certifications[])
  // ============================================================
  const demoProducts = [
    ["seed-product-1", "CT-AG-DEMO-001", "agriculture", "Organic Turmeric Root", "Spice Crop", "AG-2026-001", 1250, "kg", "Mysuru Farm Cluster", 97, json({ cultivar: "Lakadong" })],
    ["seed-product-2", "CT-FO-DEMO-002", "food", "Cold Chain Dairy Pack", "Dairy", "FO-2026-002", 4800, "packs", "BlueRiver Processing Hub", 94, json({ storage: "2-4C" })],
    ["seed-product-3", "CT-PH-DEMO-003", "pharmaceutical", "ThermoSafe Vaccine Batch", "Biologic", "PH-2026-003", 1800, "vials", "PurePharma Labs", 91, json({ tempRange: "2-8C" })],
    ["seed-product-4", "CT-EC-DEMO-004", "ecommerce", "Secure Smart Tag Bundle", "Authenticity Kit", "EC-2026-004", 950, "kits", "ShopGrid Marketplace", 96, json({ qrVersion: "v2" })],
    ["seed-product-5", "CT-WH-DEMO-005", "warehouse", "Warehouse Sensor Gateway", "IoT Hardware", "WH-2026-005", 120, "units", "SafeStore Automation Bay", 89, json({ firmware: "3.2.1" })]
  ];

  await upsert(
    "products",
    ["id", "product_id", "company_id", "registered_by", "domain", "product_name", "category", "batch_number", "quantity", "unit", "origin_location", "domain_metadata", "certifications", "blockchain_tx_hash", "visibility", "status"],
    demoProducts.map((product, index) => [
      product[0],
      product[1],
      ids.demoCompany,
      ids.demoProducer,
      product[2],
      product[3],
      product[4],
      product[5],
      product[6],
      product[7],
      product[8],
      product[10],
      ["ISO 22000", "Blockchain Proof", "ChainTrace Verified"],
      `0xseedtx${index + 1}`,
      index === 3 ? "b2b" : "private",
      "active"
    ]),
    "product_id"
  );

  // ============================================================
  // 5. CHECKPOINTS (new schema: company_id, recorded_by, title, description, location_name, parent_product_ids)
  // ============================================================
  await upsert(
    "checkpoints",
    ["id", "product_id", "company_id", "recorded_by", "checkpoint_type", "title", "description", "location_name", "temperature_c", "humidity_pct", "iot_payload", "blockchain_tx_hash", "parent_product_ids", "created_at"],
    [
      ["seed-cp-1", "CT-AG-DEMO-001", ids.agri, ids.demoProducer, "received", "Harvest Intake", "Fresh turmeric harvested and weighed", "Mysuru Farm Cluster", 22.1, 58, json({ seed: "demo" }), "0xseedag001", [], isoDaysAgo(6)],
      ["seed-cp-2", "CT-AG-DEMO-001", ids.demoCompany, ids.demoProducer, "processed", "Wash & Grading", "Wash and grading completed", "BlueRiver Processing Hub", 20.4, 55, json({ seed: "demo" }), "0xseedag002", [], isoDaysAgo(5)],
      ["seed-cp-3", "CT-FO-DEMO-002", ids.demoCompany, ids.demoProducer, "quality-check", "Cold Chain Compliance", "Quality check passed for dairy pack", "Quality Lab 02", 3.9, 69, json({ seed: "demo" }), "0xseedfo001", [], isoDaysAgo(4)],
      ["seed-cp-4", "CT-FO-DEMO-002", ids.demoCompany, ids.demoProducer, "dispatched", "Retail Dispatch", "Loaded for retail transfer", "BlueRiver Dispatch Dock", 4.2, 66, json({ seed: "demo" }), "0xseedfo002", [], isoDaysAgo(3)],
      ["seed-cp-5", "CT-PH-DEMO-003", ids.pharma, ids.demoProducer, "received", "Sterile Fill Release", "Batch released from sterile fill", "PurePharma Labs", 5.1, 47, json({ seed: "demo" }), "0xseedph001", [], isoDaysAgo(3)],
      ["seed-cp-6", "CT-PH-DEMO-003", ids.demoCompany, ids.demoProducer, "in-transit", "Cold Chain Transit", "Temperature excursion detected", "Cold Chain Route 7", 9.2, 45, json({ seed: "demo" }), "0xseedph002", [], isoDaysAgo(2)],
      ["seed-cp-7", "CT-EC-DEMO-004", ids.ecommerce, ids.demoProducer, "delivered", "Marketplace Stock Received", "Smart tag bundle delivered", "ShopGrid Hub Bengaluru", 26.1, 51, json({ seed: "demo" }), "0xseedec001", [], isoDaysAgo(1)],
      ["seed-cp-8", "CT-WH-DEMO-005", ids.warehouse, ids.demoProducer, "quality-check", "Firmware Validation", "Gateway firmware validated", "SafeStore Automation Bay", 24.4, 40, json({ seed: "demo" }), "0xseedwh001", [], isoDaysAgo(0)],
      // Transformation checkpoint showing product lineage (replaces product_lineage_events)
      ["seed-cp-9", "CT-FO-DEMO-002", ids.demoCompany, ids.demoProducer, "transformation", "Dairy Processing", "Raw materials processed into dairy pack", "BlueRiver Processing Hub", 18.0, 60, json({ seed: "demo" }), "0xseedtransform001", ["CT-AG-DEMO-001"], isoDaysAgo(5)]
    ]
  );

  // ============================================================
  // 6. SENSOR READINGS (new schema: device_id, value, unit columns)
  // ============================================================
  await upsert(
    "sensor_readings",
    ["id", "device_id", "product_id", "company_id", "sensor_type", "value", "unit", "recorded_at"],
    [
      [9001, "IOT-TEMP-01", "CT-FO-DEMO-002", ids.demoCompany, "temperature", 3.8, "C", new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()],
      [9002, "IOT-HUM-02", "CT-FO-DEMO-002", ids.demoCompany, "humidity", 67, "%", new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()],
      [9003, "IOT-TEMP-01", "CT-PH-DEMO-003", ids.demoCompany, "temperature", 8.9, "C", new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()],
      [9004, "IOT-HUM-02", "CT-PH-DEMO-003", ids.demoCompany, "humidity", 44, "%", new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()],
      [9005, "IOT-TEMP-01", "CT-WH-DEMO-005", ids.demoCompany, "temperature", 24.1, "C", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()],
      [9006, "IOT-HUM-02", "CT-WH-DEMO-005", ids.demoCompany, "humidity", 40, "%", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()]
    ]
  );

  // ============================================================
  // 7. AI ANOMALY INSIGHTS (replaces demand_forecasts + optimization_recommendations)
  // ============================================================
  await upsert(
    "ai_anomaly_insights",
    ["id", "company_id", "product_id", "checkpoint_id", "sensor_reading_id", "insight_type", "severity", "title", "description", "recommendation", "confidence_score", "estimated_impact", "target_entity_type", "target_entity_id", "is_resolved", "model_version", "metadata"],
    [
      [9101, ids.demoCompany, "CT-PH-DEMO-003", "seed-cp-6", 9003, "temperature_breach", "critical", "Cold-chain breach on vaccine batch", "Transit temperature exceeded the 2-8C envelope for 18 minutes.", "Escalate QA review and quarantine delivery pallet P-17.", 0.94, null, "shipment", "seed-shipment-1", false, "anomaly-v2.4", json({ seed: "demo" })],
      [9102, ids.demoCompany, "CT-FO-DEMO-002", "seed-cp-4", null, "delay", "warning", "Route delay may impact shelf life", "Delivery ETA slipped beyond the expected freshness window.", "Prioritize nearest cold-storage stop and notify retail partner.", 0.71, null, "shipment", "seed-shipment-1", false, "anomaly-v2.4", json({ seed: "demo" })],
      [9103, ids.demoCompany, "CT-WH-DEMO-005", "seed-cp-8", null, "inventory_alert", "info", "Gateway maintenance due", "The warehouse gateway is approaching the configured maintenance cycle.", "Schedule maintenance during the next low-volume shift.", 0.48, null, "iot_device", "seed-device-3", true, "ops-v1.9", json({ seed: "demo" })],
      // Demand forecast insights (replaces demand_forecasts table)
      [9104, ids.demoCompany, "CT-FO-DEMO-002", null, null, "demand_forecast", "info", "30-day dairy pack demand forecast", "Predicted demand for Cold Chain Dairy Pack over the next 30 days.", "Plan production for 6200 units to meet expected demand.", 0.91, 6200, "product", "CT-FO-DEMO-002", false, "forecast-v3.1", json({ seed: "demo", predictedDemand: 6200, actualDemand: 5400 })],
      [9105, ids.demoCompany, "CT-WH-DEMO-005", null, null, "demand_forecast", "info", "30-day sensor gateway demand forecast", "Predicted demand for Warehouse Sensor Gateway over the next 30 days.", "Maintain production pipeline for 150 units.", 0.84, 150, "product", "CT-WH-DEMO-005", false, "forecast-v3.1", json({ seed: "demo", predictedDemand: 150, actualDemand: 122 })],
      // Optimization recommendations (replaces optimization_recommendations table)
      [9106, ids.demoCompany, null, null, null, "optimization", "warning", "Replenish sensor gateway stock", "Current gateway stock will drop below recommended cover in 9 days.", "Trigger purchase order for 60 additional units.", 0.78, 1200, "inventory_stock", "seed-stock-2", false, "opt-v1.3", json({ seed: "demo", source: "inventory_engine" })],
      [9107, ids.demoCompany, null, null, null, "optimization", "info", "Consolidate Delhi retail route", "Merge two underutilized lanes into one chilled delivery window.", "Combine shipments to reduce freight cost by ~15%.", 0.65, 640, "shipment", "seed-shipment-1", true, "opt-v1.3", json({ seed: "demo", source: "planner" })]
    ]
  );

  // ============================================================
  // 8. SUPPLIER RELATIONSHIPS (with contract_terms JSONB)
  // ============================================================
  await upsert(
    "supplier_relationships",
    ["id", "buyer_company_id", "supplier_company_id", "relationship_type", "category", "contract_status", "performance_score", "risk_level", "lead_time_days", "payment_terms", "contract_terms", "metadata", "created_by"],
    [
      ["seed-rel-1", ids.demoCompany, ids.agri, "supplier", "agri-input", "active", 91, "low", 3, "Net 14", json({ min_order: 250, price_per_kg: 4.8, quality_grade: "A" }), json({ seed: "demo" }), ids.demoAdmin],
      ["seed-rel-2", ids.demoCompany, ids.pharma, "manufacturer", "pharma", "active", 87, "medium", 5, "Net 21", json({ sla_uptime: "99.9%", temp_compliance: true }), json({ seed: "demo" }), ids.demoAdmin],
      ["seed-rel-3", ids.demoCompany, ids.warehouse, "warehouse_partner", "storage", "active", 93, "low", 2, "Monthly", json({ cold_storage_rate: 12.5, pallet_capacity: 500 }), json({ seed: "demo" }), ids.demoAdmin],
      ["seed-rel-4", ids.demoCompany, ids.logistics, "logistics_partner", "transport", "active", 89, "medium", 4, "Net 15", json({ cold_chain_surcharge: 0.15, per_km_rate: 12 }), json({ seed: "demo" }), ids.demoAdmin],
      ["seed-rel-5", ids.demoCompany, ids.retail, "retailer", "retail", "active", 90, "low", 2, "Net 10", json({ margin_pct: 25, shelf_space_commitment: 4 }), json({ seed: "demo" }), ids.demoAdmin]
    ]
  );

  // ============================================================
  // 9. INVENTORY STOCK (new schema: no warehouse_layout_id fk, quantity_on_hand, quantity_reserved)
  // ============================================================
  await upsert(
    "inventory_stock",
    ["id", "company_id", "product_id", "warehouse_name", "rack_row_bin", "lot_number", "serial_number", "quantity_on_hand", "quantity_reserved", "unit_of_measure", "reorder_point", "max_capacity", "status", "expiry_date", "metadata"],
    [
      ["seed-stock-1", ids.demoCompany, "CT-FO-DEMO-002", "BlueRiver Main Warehouse", "A1-03-02", "LOT-FO-11", null, 1480, 200, "packs", 1100, 2500, "optimal", new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), json({ seed: "demo", velocity: "fast" })],
      ["seed-stock-2", ids.demoCompany, "CT-WH-DEMO-005", "SafeStore Automation Bay", "C3-02-01", "LOT-WH-09", "GW-3321", 42, 5, "units", 60, 120, "low", null, json({ seed: "demo", velocity: "medium" })],
      ["seed-stock-3", ids.demoCompany, "CT-AG-DEMO-001", "BlueRiver Main Warehouse", "B2-01-04", "LOT-AG-21", null, 2600, 100, "kg", 900, 3200, "overstock", new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), json({ seed: "demo", velocity: "slow" })]
    ]
  );

  // ============================================================
  // 10. PURCHASE ORDERS + PO LINE ITEMS (renamed from purchase_order_items)
  // ============================================================
  await upsert(
    "purchase_orders",
    ["id", "po_number", "buyer_company_id", "supplier_company_id", "total_amount", "currency", "status", "expected_delivery_date", "notes", "created_by"],
    [
      ["seed-po-1", "PO-260101", ids.demoCompany, ids.agri, 5400, "USD", "submitted", new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), "Monthly turmeric replenishment", ids.demoAdmin]
    ]
  );
  await upsert(
    "po_line_items",
    ["id", "po_id", "product_id", "quantity", "unit_price", "total_price", "received_quantity", "rejected_quantity"],
    [["seed-po-item-1", "seed-po-1", "CT-AG-DEMO-001", 900, 6, 5400, 0, 0]]
  );

  // ============================================================
  // 11. SALES ORDERS + SO LINE ITEMS (new table)
  // ============================================================
  await upsert(
    "sales_orders",
    ["id", "so_number", "seller_company_id", "customer_name", "customer_email", "total_amount", "currency", "status", "shipping_address", "created_by"],
    [
      ["seed-so-1", "SO-260201", ids.demoCompany, "MarketSquare Retail", "stores@marketsquare.demo", 8600, "USD", "processing", "Retail Avenue 44, New Delhi", ids.demoAdmin]
    ]
  );
  await upsert(
    "so_line_items",
    ["id", "so_id", "product_id", "quantity", "unit_price", "total_price", "shipped_quantity"],
    [["seed-so-item-1", "seed-so-1", "CT-FO-DEMO-002", 400, 18, 7200, 200], ["seed-so-item-2", "seed-so-1", "CT-EC-DEMO-004", 50, 28, 1400, 0]]
  );

  // ============================================================
  // 12. SHIPMENTS + SHIPMENT LEGS
  // ============================================================
  await upsert(
    "shipments",
    ["id", "shipment_code", "order_type", "order_id", "source_company_id", "destination_company_id", "current_status", "carrier_name", "tracking_number", "freight_cost", "estimated_departure_at", "estimated_arrival_at", "actual_departure_at", "route_summary", "cold_chain_enabled", "metadata", "created_by"],
    [
      ["seed-shipment-1", "SHIP-260301", "sales_order", "seed-so-1", ids.demoCompany, ids.retail, "in_transit", "SwiftRoute Logistics", "SR-TRK-8841", 420, new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), "Bengaluru -> Chennai cross-dock -> New Delhi retail lane", true, json({ seed: "demo" }), ids.demoAdmin]
    ]
  );
  await upsert(
    "shipment_legs",
    ["id", "shipment_id", "leg_sequence", "origin_location", "destination_location", "transport_mode", "status", "planned_departure_at", "planned_arrival_at", "actual_departure_at", "distance_km", "metadata"],
    [
      ["seed-leg-1", "seed-shipment-1", 1, "Bengaluru", "Chennai", "road", "completed", new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), 350, json({ seed: "demo" })],
      ["seed-leg-2", "seed-shipment-1", 2, "Chennai", "New Delhi", "air", "in_transit", new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), 1760, json({ seed: "demo" })]
    ]
  );

  // ============================================================
  // 13. PRODUCTION ORDERS (stages in JSONB, no wip_events table)
  // ============================================================
  await upsert(
    "production_orders",
    ["id", "production_number", "company_id", "target_product_id", "target_quantity", "completed_quantity", "wasted_quantity", "status", "stages", "start_date", "end_date", "supervisor_id", "metadata"],
    [
      ["seed-prod-order-1", "PROD-260401", ids.demoCompany, "CT-FO-DEMO-002", 5000, 3200, 80, "in_progress", json([
        { stage_name: "mixing", workstation: "WS-MIX-03", status: "completed", started_at: isoDaysAgo(2, 6), ended_at: isoDaysAgo(2, 14), notes: "Blend uniformity achieved." },
        { stage_name: "packing", workstation: "WS-PACK-02", status: "in_progress", started_at: isoDaysAgo(0, 4), ended_at: null, notes: "Running serialized packaging." },
        { stage_name: "quality_check", workstation: "WS-QC-01", status: "pending", started_at: null, ended_at: null, notes: "" }
      ]), new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), ids.demoProducer, json({ seed: "demo" })]
    ]
  );

  // ============================================================
  // 14. PRODUCTION MATERIALS (renamed from production_order_materials)
  // ============================================================
  await upsert(
    "production_materials",
    ["id", "production_order_id", "input_product_id", "input_sku", "planned_quantity", "consumed_quantity", "waste_quantity", "unit", "metadata"],
    [
      ["seed-mat-1", "seed-prod-order-1", "CT-AG-DEMO-001", "AG-TURM-01", 900, 820, 12, "kg", json({ seed: "demo" })],
      ["seed-mat-2", "seed-prod-order-1", "CT-EC-DEMO-004", "EC-TAG-04", 120, 96, 0, "kits", json({ seed: "demo" })]
    ]
  );

  // ============================================================
  // 15. INTEGRATION CONNECTORS
  // ============================================================
  await upsert(
    "integration_connectors",
    ["id", "company_id", "provider", "connector_type", "display_name", "status", "base_url", "auth_type", "credentials", "settings", "last_sync_at", "last_test_at", "last_test_status", "last_error", "metadata", "created_by", "updated_by"],
    [
      ["seed-connector-1", ids.demoCompany, "sap", "erp", "SAP S/4HANA Core", "active", "https://sap.demo.local/api", "api_key", json({ apiKey: "sap-demo-key" }), json({ modules: ["inventory", "procurement", "production"] }), new Date(Date.now() - 45 * 60 * 1000).toISOString(), new Date(Date.now() - 45 * 60 * 1000).toISOString(), "success", null, json({ seed: "demo" }), ids.demoAdmin, ids.demoAdmin],
      ["seed-connector-2", ids.demoCompany, "shopify", "ecommerce", "Shopify Storefront", "configured", "https://shopify.demo.local/admin/api", "oauth2", json({ accessToken: "shopify-demo-token" }), json({ resources: ["orders", "products", "inventory_levels"] }), new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), "success", null, json({ seed: "demo" }), ids.demoAdmin, ids.demoAdmin],
      ["seed-connector-3", ids.demoCompany, "fedex", "logistics", "FedEx Tracking Bridge", "error", "https://fedex.demo.local/track", "api_key", json({ apiKey: "fedex-demo-key" }), json({ events: ["tracking", "delays"] }), null, new Date(Date.now() - 60 * 60 * 1000).toISOString(), "failed", "Credentials expired during signature validation.", json({ seed: "demo" }), ids.demoAdmin, ids.demoAdmin]
    ]
  );

  // ============================================================
  // 16. AUDIT LOGS (replaces qr_verification_logs — seed some QR verification entries)
  // ============================================================
  await pgPool.query(`
    INSERT INTO audit_logs (actor_id, actor_email, actor_role, action, entity_type, entity_id, old_value, new_value, company_id, ip_address, user_agent)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11),
      ($12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22),
      ($23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
    ON CONFLICT DO NOTHING
  `, [
    ids.demoProducer, "producer@chaintrace.io", "producer", "QR_VERIFICATION", "product", "CT-FO-DEMO-002", null, json({ verified: true, scan_location: "Bengaluru Warehouse" }), ids.demoCompany, "192.168.1.10", "ChainTrace/1.0",
    ids.demoAdmin, "demo@chaintrace.io", "org_admin", "PRODUCT_CREATED", "product", "CT-AG-DEMO-001", null, json({ product_name: "Organic Turmeric Root" }), ids.demoCompany, "192.168.1.11", "ChainTrace/1.0",
    ids.demoProducer, "producer@chaintrace.io", "producer", "CHECKPOINT_RECORDED", "checkpoint", "seed-cp-6", null, json({ type: "in-transit", anomaly_detected: true }), ids.demoCompany, "192.168.1.10", "ChainTrace/1.0"
  ]);

  // ============================================================
  // 17. PENDING BUSINESS REGISTRATION (via companies with status='pending_approval')
  // ============================================================
  await upsert(
    "companies",
    ["id", "company_code", "company_name", "domain", "contact_email", "contact_phone", "website", "country", "state", "city", "address_line1", "status", "domain_metadata", "metadata"],
    [
      ["seed-onboarding-pending", "FUTURE-001", "FutureFresh Naturals", "food", "founder@futurefresh.demo", "+91 90000 20001", "https://futurefresh.demo", "India", "Karnataka", "Bengaluru", "Innovation Hub, Electronic City", "pending_approval", json({ contact_name: "Aarav Menon" }), json({ seed: "demo", registration_notes: "Waiting for super-admin review before partner browsing is enabled." })]
    ]
  );

  console.log("[seed] Demo data ready.");
  console.log("[seed] Super Admin -> admin@chaintrace.io / Admin@12345");
  console.log("[seed] Demo Business Admin -> demo@chaintrace.io / Demo@12345");
  console.log("[seed] Demo Producer -> producer@chaintrace.io / Demo@12345");
  console.log("[seed] Verify with product IDs: CT-AG-DEMO-001, CT-FO-DEMO-002, CT-PH-DEMO-003, CT-EC-DEMO-004, CT-WH-DEMO-005");
  await pgPool.end();
}

seed().catch(async (err) => {
  console.error("[seed] Failed", err);
  await pgPool.end().catch(() => undefined);
  process.exit(1);
});
