import { Pool } from "pg";
import { env } from "./env.js";

export const pgPool = new Pool({
  connectionString: env.PG_URL,
  ssl: env.PG_SSL ? { rejectUnauthorized: false } : false
});

pgPool.on("connect", () => {
  console.log("[postgres] Connected");
});

pgPool.on("error", (error) => {
  console.error("[postgres] Unexpected error on idle client", error.message);
});

/**
 * ChainTrace Enterprise SCM Schema - 21 Consolidated Tables
 * 
 * TIER 1: Core Entities (1-9)
 * TIER 2: SCM Operations (10-16)
 * TIER 3: Production & Inventory (17-19)
 * TIER 4: Enterprise Features (20-21)
 */
export async function ensurePostgresSchema(): Promise<void> {
  try {
    const client = await pgPool.connect();
    client.release();
  } catch (err: any) {
    console.warn("[postgres] Notice: Local database not detected. Application will run with limited persistence (demo mode).", err.message);
    return;
  }
  // ============================================================
  // DATABASE EXTENSIONS (Performance & Geospatial)
  // ============================================================
  await pgPool.query(`CREATE EXTENSION IF NOT EXISTS cube;`);
  await pgPool.query(`CREATE EXTENSION IF NOT EXISTS earthdistance;`);
  await pgPool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

  // ============================================================
  // TIER 1: CORE ENTITIES (Tables 1-9)
  // ============================================================

  // 1. companies — Master organization registry with domain-specific metadata in JSONB
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      company_code TEXT NOT NULL UNIQUE,
      company_name TEXT NOT NULL,
      legal_name TEXT,
      registration_number TEXT,
      tax_id TEXT,
      domain TEXT NOT NULL,
      contact_email TEXT,
      contact_phone TEXT,
      website TEXT,
      country TEXT,
      state TEXT,
      city TEXT,
      address_line1 TEXT,
      postal_code TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      domain_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      warehouse_layouts JSONB NOT NULL DEFAULT '[]'::jsonb,
      network_memberships TEXT[] NOT NULL DEFAULT '{}',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT companies_domain_check CHECK (
        domain IN ('agriculture', 'pharmaceutical', 'food', 'ecommerce', 'warehouse')
      ),
      CONSTRAINT companies_status_check CHECK (
        status IN ('active', 'inactive', 'suspended', 'pending_approval')
      )
    );
  `);

  // 2. users — All authenticated platform users
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      organization_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'producer',
      oauth_provider TEXT,
      oauth_id TEXT,
      avatar_url TEXT,
      phone TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      notification_prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
      last_login_at TIMESTAMPTZ,
      failed_login_count SMALLINT NOT NULL DEFAULT 0,
      locked_until TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT users_role_check CHECK (
        role IN ('super_admin', 'org_admin', 'producer', 'distributor', 'retailer', 'inspector', 'consumer', 'auditor')
      )
    );
  `);

  // 3. products — Core product registry
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL UNIQUE,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
      registered_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      domain TEXT NOT NULL,
      product_name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      sku TEXT,
      batch_number TEXT,
      serial_number TEXT,
      quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'unit',
      origin_location TEXT,
      origin_country TEXT,
      manufacture_date DATE,
      expiry_date DATE,
      status TEXT NOT NULL DEFAULT 'active',
      visibility TEXT NOT NULL DEFAULT 'private',
      qr_code_url TEXT,
      image_url TEXT,
      ipfs_cid TEXT,
      blockchain_tx_hash TEXT,
      blockchain_block_no BIGINT,
      smart_contract_id TEXT,
      domain_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      certifications TEXT[] NOT NULL DEFAULT '{}',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT products_domain_check CHECK (
        domain IN ('agriculture', 'pharmaceutical', 'food', 'ecommerce', 'warehouse')
      ),
      CONSTRAINT products_status_check CHECK (
        status IN ('active', 'warning', 'critical', 'recalled', 'expired', 'verified', 'flagged')
      ),
      CONSTRAINT products_visibility_check CHECK (
        visibility IN ('private', 'b2b', 'public')
      )
    );
  `);

  // 4. checkpoints — Supply chain event/milestone tracking
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS checkpoints (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
      recorded_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      checkpoint_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      location_name TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      altitude_m DOUBLE PRECISION,
      temperature_c DOUBLE PRECISION,
      humidity_pct DOUBLE PRECISION,
      shock_g DOUBLE PRECISION,
      iot_device_id TEXT,
      iot_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      media_urls TEXT[] NOT NULL DEFAULT '{}',
      ipfs_cid TEXT,
      blockchain_tx_hash TEXT,
      blockchain_block_no BIGINT,
      parent_product_ids TEXT[] DEFAULT '{}',
      is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
      verified_by_inspector TEXT REFERENCES users(id),
      verified_at TIMESTAMPTZ,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT checkpoints_type_check CHECK (
        checkpoint_type IN ('received', 'quality-check', 'processed', 'dispatched', 'in-transit', 'delivered', 'recall', 'transformation', 'harvest', 'packaging', 'custom')
      )
    );
  `);

  // 5. audit_logs — Immutable write-only audit trail
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      actor_email TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      old_value JSONB,
      new_value JSONB,
      ip_address INET,
      user_agent TEXT,
      request_id TEXT,
      company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 6. sensor_readings — Time-series IoT sensor data
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id BIGSERIAL PRIMARY KEY,
      device_id TEXT NOT NULL,
      product_id TEXT REFERENCES products(product_id) ON DELETE SET NULL,
      checkpoint_id TEXT REFERENCES checkpoints(id) ON DELETE SET NULL,
      company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
      sensor_type TEXT NOT NULL,
      value DOUBLE PRECISION NOT NULL,
      unit TEXT NOT NULL,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      raw_payload JSONB,
      mqtt_topic TEXT,
      is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
      anomaly_reason TEXT,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT sensor_readings_type_check CHECK (
        sensor_type IN ('temperature', 'humidity', 'pressure', 'gps', 'vibration', 'weight', 'door', 'light', 'gas', 'custom')
      )
    );
  `);

  // 7. iot_devices — IoT hardware registry
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS iot_devices (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL UNIQUE,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      device_name TEXT NOT NULL,
      device_type TEXT NOT NULL,
      model TEXT,
      firmware_version TEXT,
      mqtt_topic TEXT NOT NULL,
      location_name TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      last_seen_at TIMESTAMPTZ,
      battery_pct SMALLINT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT iot_devices_type_check CHECK (
        device_type IN ('temperature_sensor', 'humidity_sensor', 'gps_tracker', 'weight_scale', 'door_sensor', 'vibration_sensor', 'gas_detector', 'rfid_reader', 'camera', 'custom')
      ),
      CONSTRAINT iot_devices_status_check CHECK (
        is_active IN (true, false)
      )
    );
  `);

  // 8. ai_anomaly_insights — AI insights, anomalies, forecasts, optimizations
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS ai_anomaly_insights (
      id BIGSERIAL PRIMARY KEY,
      company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
      product_id TEXT REFERENCES products(product_id) ON DELETE CASCADE,
      checkpoint_id TEXT REFERENCES checkpoints(id) ON DELETE CASCADE,
      sensor_reading_id BIGINT REFERENCES sensor_readings(id) ON DELETE CASCADE,
      insight_type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      recommendation TEXT,
      confidence_score DOUBLE PRECISION,
      estimated_impact DOUBLE PRECISION,
      target_entity_type TEXT,
      target_entity_id TEXT,
      is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
      resolved_by TEXT REFERENCES users(id),
      resolved_at TIMESTAMPTZ,
      model_version TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT ai_insight_type_check CHECK (
        insight_type IN ('temperature_breach', 'humidity_spike', 'location_deviation', 'delay', 'tampering', 'demand_forecast', 'optimization', 'inventory_alert', 'quality_risk', 'custom')
      ),
      CONSTRAINT ai_severity_check CHECK (
        severity IN ('info', 'warning', 'high', 'critical')
      ),
      CONSTRAINT ai_status_check CHECK (
        is_resolved IN (true, false)
      )
    );
  `);

  // 9. password_reset_tokens - Password reset and invite completion tokens
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      purpose TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT password_reset_tokens_purpose_check CHECK (
        purpose IN ('invite_setup', 'password_reset')
      )
    );
  `);

  // ============================================================
  // TIER 2: SCM OPERATIONS (Tables 10-16)
  // ============================================================

  // 10. supplier_relationships — B2B partner network + contract terms
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS supplier_relationships (
      id TEXT PRIMARY KEY,
      buyer_company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      supplier_company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      relationship_type TEXT NOT NULL DEFAULT 'supplier',
      category TEXT,
      contract_status TEXT NOT NULL DEFAULT 'prospect',
      blockchain_address TEXT,
      performance_score DOUBLE PRECISION,
      risk_level TEXT NOT NULL DEFAULT 'medium',
      lead_time_days INTEGER,
      payment_terms TEXT,
      contract_terms JSONB NOT NULL DEFAULT '{}'::jsonb,
      governance_approvals JSONB NOT NULL DEFAULT '[]'::jsonb,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_by TEXT REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT supplier_rel_type_check CHECK (
        relationship_type IN ('supplier', 'manufacturer', 'distributor', 'logistics_partner', 'warehouse_partner', 'retailer', 'service_provider', 'ecosystem_partner')
      ),
      CONSTRAINT supplier_rel_contract_check CHECK (
        contract_status IN ('prospect', 'active', 'on_hold', 'terminated', 'expired', 'pending_approval')
      ),
      CONSTRAINT supplier_rel_risk_check CHECK (
        risk_level IN ('low', 'medium', 'high', 'critical')
      )
    );
  `);

  // 11. purchase_orders — Procurement orders
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      po_number TEXT NOT NULL UNIQUE,
      buyer_company_id TEXT NOT NULL REFERENCES companies(id),
      supplier_company_id TEXT NOT NULL REFERENCES companies(id),
      total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'draft',
      expected_delivery_date DATE,
      actual_delivery_date DATE,
      notes TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT po_status_check CHECK (
        status IN ('draft', 'submitted', 'accepted', 'shipped', 'delivered', 'cancelled', 'returned')
      )
    );
  `);

  // 12. po_line_items — Purchase order line items
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS po_line_items (
      id TEXT PRIMARY KEY,
      po_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(product_id),
      quantity DOUBLE PRECISION NOT NULL,
      unit_price DOUBLE PRECISION NOT NULL,
      total_price DOUBLE PRECISION NOT NULL,
      received_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      rejected_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      notes TEXT
    );
  `);

  // 13. sales_orders — Customer sales orders
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS sales_orders (
      id TEXT PRIMARY KEY,
      so_number TEXT NOT NULL UNIQUE,
      seller_company_id TEXT NOT NULL REFERENCES companies(id),
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending',
      shipping_address TEXT,
      billing_address TEXT,
      notes TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT so_status_check CHECK (
        status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded')
      )
    );
  `);

  // 14. so_line_items — Sales order line items
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS so_line_items (
      id TEXT PRIMARY KEY,
      so_id TEXT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(product_id),
      quantity DOUBLE PRECISION NOT NULL,
      unit_price DOUBLE PRECISION NOT NULL,
      total_price DOUBLE PRECISION NOT NULL,
      shipped_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      notes TEXT
    );
  `);

  // 15. shipments — Shipment tracking
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      shipment_code TEXT NOT NULL UNIQUE,
      order_type TEXT NOT NULL DEFAULT 'purchase_order',
      order_id TEXT,
      source_company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      destination_company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
      current_status TEXT NOT NULL DEFAULT 'planned',
      carrier_name TEXT,
      tracking_number TEXT,
      freight_cost DOUBLE PRECISION,
      estimated_departure_at TIMESTAMPTZ,
      estimated_arrival_at TIMESTAMPTZ,
      actual_departure_at TIMESTAMPTZ,
      actual_arrival_at TIMESTAMPTZ,
      route_summary TEXT,
      cold_chain_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_by TEXT REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT shipments_order_type_check CHECK (
        order_type IN ('purchase_order', 'sales_order', 'transfer', 'return')
      ),
      CONSTRAINT shipments_status_check CHECK (
        current_status IN ('planned', 'packed', 'in_transit', 'delivered', 'delayed', 'cancelled')
      )
    );
  `);

  // 16. shipment_legs — Multi-leg shipment route tracking
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS shipment_legs (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      leg_sequence INTEGER NOT NULL,
      origin_location TEXT NOT NULL,
      destination_location TEXT NOT NULL,
      transport_mode TEXT NOT NULL DEFAULT 'road',
      status TEXT NOT NULL DEFAULT 'planned',
      planned_departure_at TIMESTAMPTZ,
      planned_arrival_at TIMESTAMPTZ,
      actual_departure_at TIMESTAMPTZ,
      actual_arrival_at TIMESTAMPTZ,
      distance_km DOUBLE PRECISION,
      carrier_reference TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT shipment_legs_mode_check CHECK (
        transport_mode IN ('road', 'rail', 'air', 'sea', 'multimodal')
      ),
      CONSTRAINT shipment_legs_status_check CHECK (
        status IN ('planned', 'in_transit', 'completed', 'delayed', 'cancelled')
      ),
      CONSTRAINT shipment_leg_sequence_unique UNIQUE (shipment_id, leg_sequence)
    );
  `);

  // ============================================================
  // TIER 3: PRODUCTION & INVENTORY (Tables 17-19)
  // ============================================================

  // 17. production_orders — Manufacturing orders with stages in JSONB
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS production_orders (
      id TEXT PRIMARY KEY,
      production_number TEXT NOT NULL UNIQUE,
      company_id TEXT NOT NULL REFERENCES companies(id),
      target_product_id TEXT NOT NULL REFERENCES products(product_id),
      target_quantity DOUBLE PRECISION NOT NULL,
      completed_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      wasted_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'planned',
      stages JSONB NOT NULL DEFAULT '[]'::jsonb,
      start_date TIMESTAMPTZ,
      end_date TIMESTAMPTZ,
      supervisor_id TEXT REFERENCES users(id),
      notes TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT production_status_check CHECK (
        status IN ('planned', 'in_progress', 'quality_check', 'completed', 'halted', 'cancelled')
      )
    );
  `);

  // 18. production_materials — Input materials for production orders
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS production_materials (
      id TEXT PRIMARY KEY,
      production_order_id TEXT NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
      input_product_id TEXT REFERENCES products(product_id) ON DELETE SET NULL,
      input_sku TEXT,
      planned_quantity DOUBLE PRECISION NOT NULL,
      consumed_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      waste_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'unit',
      notes TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 19. inventory_stock — Real-time inventory per warehouse/rack/bin
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS inventory_stock (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES products(product_id) ON DELETE CASCADE,
      warehouse_name TEXT,
      rack_row_bin TEXT,
      lot_number TEXT,
      serial_number TEXT,
      quantity_on_hand DOUBLE PRECISION NOT NULL DEFAULT 0,
      quantity_reserved DOUBLE PRECISION NOT NULL DEFAULT 0,
      unit_of_measure TEXT NOT NULL DEFAULT 'unit',
      reorder_point DOUBLE PRECISION,
      max_capacity DOUBLE PRECISION,
      status TEXT NOT NULL DEFAULT 'optimal',
      last_counted_at TIMESTAMPTZ,
      expiry_date DATE,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT inventory_status_check CHECK (
        status IN ('optimal', 'low', 'out', 'overstock', 'quarantine', 'reserved')
      ),
      CONSTRAINT inventory_qty_check CHECK (
        quantity_on_hand >= 0 AND quantity_reserved >= 0
      )
    );
  `);

  // ============================================================
  // TIER 4: ENTERPRISE FEATURES (Tables 20-21)
  // ============================================================

  // 20. integration_connectors — Third-party system integrations
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS integration_connectors (
      id TEXT PRIMARY KEY,
      company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      connector_type TEXT NOT NULL DEFAULT 'erp',
      display_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'configured',
      base_url TEXT,
      auth_type TEXT NOT NULL DEFAULT 'api_key',
      credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
      settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      last_sync_at TIMESTAMPTZ,
      last_test_at TIMESTAMPTZ,
      last_test_status TEXT,
      last_error TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_by TEXT REFERENCES users(id),
      updated_by TEXT REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT integration_type_check CHECK (
        connector_type IN ('erp', 'crm', 'ecommerce', 'logistics', 'warehouse', 'webhook', 'iot', 'accounting')
      ),
      CONSTRAINT integration_status_check CHECK (
        status IN ('configured', 'active', 'paused', 'error', 'disconnected')
      ),
      CONSTRAINT integration_auth_check CHECK (
        auth_type IN ('api_key', 'basic', 'oauth2', 'webhook_secret', 'none')
      ),
      CONSTRAINT integration_provider_company_unique UNIQUE (company_id, provider)
    );
  `);

  // 21. integration_sync_logs — Integration sync execution history
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS integration_sync_logs (
      id TEXT PRIMARY KEY,
      connector_id TEXT NOT NULL REFERENCES integration_connectors(id) ON DELETE CASCADE,
      company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
      provider TEXT NOT NULL,
      sync_type TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'running',
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      records_processed INTEGER NOT NULL DEFAULT 0,
      records_created INTEGER NOT NULL DEFAULT 0,
      records_updated INTEGER NOT NULL DEFAULT 0,
      records_failed INTEGER NOT NULL DEFAULT 0,
      message TEXT,
      error TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      triggered_by TEXT REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT sync_type_check CHECK (
        sync_type IN ('manual', 'scheduled', 'webhook', 'realtime')
      ),
      CONSTRAINT sync_status_check CHECK (
        status IN ('running', 'success', 'partial', 'failed')
      )
    );
  `);

  // ============================================================
  // INDEXES
  // ============================================================

  // Performance Enhancements: BRIN Indexes for Append-Only Time-Series Tables
  // BRIN indexes scale incredibly well (using a fraction of RAM compared to B-Trees) for ordered metrics
  await pgPool.query(`ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_sensor_readings_brin_time ON sensor_readings USING BRIN (recorded_at);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_brin_time ON audit_logs USING BRIN (created_at);`);

  // Performance Enhancements: Geospatial Indexing for Location Proximity Searches
  await pgPool.query(`ALTER TABLE checkpoints ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;`);
  await pgPool.query(`ALTER TABLE checkpoints ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;`);
  await pgPool.query(`ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;`);
  await pgPool.query(`ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_checkpoints_geo ON checkpoints USING gist (ll_to_earth(latitude, longitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_sensor_readings_geo ON sensor_readings USING gist (ll_to_earth(latitude, longitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;`);

  // Performance Enhancements: Partial Indexes for high-frequency isolated statuses
  await pgPool.query(`ALTER TABLE checkpoints ADD COLUMN IF NOT EXISTS is_anomaly BOOLEAN NOT NULL DEFAULT FALSE;`);
  await pgPool.query(`ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS is_anomaly BOOLEAN NOT NULL DEFAULT FALSE;`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_sensor_readings_anomalies ON sensor_readings (recorded_at DESC) WHERE is_anomaly = true;`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_checkpoints_anomalies ON checkpoints (created_at DESC) WHERE is_anomaly = true;`);

  // Legacy Compatibility / Code Schema Alignment
  // products table uses organization_id, recorded_by and on_chain_id in some code
  await pgPool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS organization_id TEXT;`);
  await pgPool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS recorded_by TEXT;`);
  await pgPool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS on_chain_id TEXT;`);
  await pgPool.query(`UPDATE products SET organization_id = company_id WHERE organization_id IS NULL;`);
  await pgPool.query(`UPDATE products SET recorded_by = registered_by WHERE recorded_by IS NULL;`);
  await pgPool.query(`UPDATE products SET on_chain_id = smart_contract_id WHERE on_chain_id IS NULL;`);

  // ai_anomaly_insights table uses anomaly_type and detected_at in some code
  await pgPool.query(`ALTER TABLE ai_anomaly_insights ADD COLUMN IF NOT EXISTS anomaly_type TEXT;`);
  await pgPool.query(`ALTER TABLE ai_anomaly_insights ADD COLUMN IF NOT EXISTS detected_at TIMESTAMPTZ;`);
  
  await pgPool.query(`UPDATE ai_anomaly_insights SET anomaly_type = insight_type WHERE anomaly_type IS NULL;`);
  await pgPool.query(`UPDATE ai_anomaly_insights SET detected_at = created_at WHERE detected_at IS NULL;`);
  
  // iot_devices table uses sensor_type, device_code and domain in some code
  await pgPool.query(`ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS sensor_type TEXT;`);
  await pgPool.query(`ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS device_code TEXT;`);
  
  // checkpoints table uses location, temperature, humidity and added_by in some code
  await pgPool.query(`ALTER TABLE checkpoints ADD COLUMN IF NOT EXISTS location TEXT;`);
  await pgPool.query(`ALTER TABLE checkpoints ADD COLUMN IF NOT EXISTS temperature DOUBLE PRECISION;`);
  await pgPool.query(`ALTER TABLE checkpoints ADD COLUMN IF NOT EXISTS humidity DOUBLE PRECISION;`);
  await pgPool.query(`ALTER TABLE checkpoints ADD COLUMN IF NOT EXISTS added_by TEXT;`);
  
  await pgPool.query(`UPDATE checkpoints SET location = location_name WHERE location IS NULL AND location_name IS NOT NULL;`);
  await pgPool.query(`UPDATE checkpoints SET temperature = temperature_c WHERE temperature IS NULL AND temperature_c IS NOT NULL;`);
  await pgPool.query(`UPDATE checkpoints SET humidity = humidity_pct WHERE humidity IS NULL AND humidity_pct IS NOT NULL;`);
  await pgPool.query(`UPDATE checkpoints SET added_by = recorded_by WHERE added_by IS NULL AND recorded_by IS NOT NULL;`);
  await pgPool.query(`ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS domain TEXT;`);
  await pgPool.query(`ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS status TEXT;`);
  await pgPool.query(`UPDATE iot_devices SET sensor_type = device_type WHERE sensor_type IS NULL;`);
  await pgPool.query(`UPDATE iot_devices SET device_code = device_id WHERE device_code IS NULL;`);
  await pgPool.query(`UPDATE iot_devices SET domain = 'warehouse' WHERE domain IS NULL;`);
  await pgPool.query(`UPDATE iot_devices SET status = 'active' WHERE status IS NULL;`);

  // Performance Enhancements: Trigram fuzzy searching for auto-complete boxes
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON companies USING gin (company_name gin_trgm_ops);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (product_name gin_trgm_ops);`);

  // Core indexes
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_companies_domain_status ON companies (domain, status, created_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_companies_code ON companies (company_code);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_users_org_role ON users (organization_id, role, created_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_products_company_status ON products (company_id, status, created_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_products_domain_created ON products (domain, created_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_products_batch ON products (batch_number);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_checkpoints_product_created ON checkpoints (product_id, created_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_checkpoints_type_created ON checkpoints (checkpoint_type, created_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_checkpoints_company_created ON checkpoints (company_id, created_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_recorded ON sensor_readings (device_id, recorded_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_sensor_readings_product_recorded ON sensor_readings (product_id, recorded_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_iot_devices_company_status ON iot_devices (company_id, is_active, last_seen_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_iot_devices_mqtt_client ON iot_devices (device_id);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_ai_insights_company_resolved ON ai_anomaly_insights (company_id, is_resolved, created_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_ai_insights_type_created ON ai_anomaly_insights (insight_type, created_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_password_tokens_user_purpose ON password_reset_tokens (user_id, purpose, created_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_password_tokens_email_active ON password_reset_tokens (email, expires_at DESC);`);

  // SCM indexes
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_supplier_rel_buyer_supplier ON supplier_relationships (buyer_company_id, supplier_company_id, contract_status);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_po_buyer_status ON purchase_orders (buyer_company_id, status, created_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_po_supplier_status ON purchase_orders (supplier_company_id, status, created_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_po_line_items_po ON po_line_items (po_id);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_so_seller_status ON sales_orders (seller_company_id, status, created_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_so_line_items_so ON so_line_items (so_id);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_shipments_source_status ON shipments (source_company_id, current_status, updated_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_shipments_destination_status ON shipments (destination_company_id, current_status, updated_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_shipment_legs_shipment_sequence ON shipment_legs (shipment_id, leg_sequence);`);

  // Production & Inventory indexes
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_production_orders_company_status ON production_orders (company_id, status, created_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_production_materials_order ON production_materials (production_order_id);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_inventory_company_product ON inventory_stock (company_id, product_id, status);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory_stock (company_id, warehouse_name, status);`);

  // Integration indexes
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_integration_connectors_company_status ON integration_connectors (company_id, status, updated_at DESC);`);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_connector_started ON integration_sync_logs (connector_id, started_at DESC);`);
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

interface SensorReadingInput {
  productId: string;
  deviceId: string;
  sensorType: string;
  value: number;
  unit: string;
  companyId?: string;
  checkpointId?: string;
  latitude?: number;
  longitude?: number;
  rawPayload?: Record<string, unknown>;
  mqttTopic?: string;
}

export async function insertSensorReading(input: SensorReadingInput): Promise<void> {
  await pgPool.query(
    `
      INSERT INTO sensor_readings (
        device_id, product_id, company_id, checkpoint_id, sensor_type, value, unit,
        latitude, longitude, raw_payload, mqtt_topic
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
    [
      input.deviceId,
      input.productId,
      input.companyId ?? null,
      input.checkpointId ?? null,
      input.sensorType,
      input.value,
      input.unit,
      input.latitude ?? null,
      input.longitude ?? null,
      input.rawPayload ?? null,
      input.mqttTopic ?? null
    ]
  );
}

