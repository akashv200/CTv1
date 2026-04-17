# ChainTrace Enterprise SCM Database Schema

## Overview

**Version**: 2.0 (Consolidated Enterprise Schema)  
**Database**: PostgreSQL 15+  
**Total Tables**: 20 (down from 35+)  
**Purpose**: Full enterprise-grade supply chain management with multi-domain support

---

## Schema Consolidation Summary

### Removed/Merged Tables (15+ → Consolidated)

| Removed Table | Replacement Strategy |
|---|---|
| `agriculture_companies` | Merged into `companies.domain_metadata` JSONB |
| `pharmaceutical_companies` | Merged into `companies.domain_metadata` JSONB |
| `food_safety_companies` | Merged into `companies.domain_metadata` JSONB |
| `ecommerce_companies` | Merged into `companies.domain_metadata` JSONB |
| `warehouse_iot_companies` | Merged into `companies.domain_metadata` JSONB |
| `supply_chain_networks` | Replaced by `supplier_relationships` with ecosystem_partner type |
| `supply_chain_network_partners` | Replaced by `supplier_relationships` entries |
| `partner_catalog_entries` | Replaced by `products.visibility='b2b'` |
| `procurement_contracts` | Merged into `supplier_relationships.contract_terms` JSONB |
| `demand_forecasts` | Merged into `ai_anomaly_insights` (insight_type='demand_forecast') |
| `optimization_recommendations` | Merged into `ai_anomaly_insights` (insight_type='optimization') |
| `wip_events` | Merged into `production_orders.stages` JSONB array |
| `production_order_materials` | Renamed to `production_materials` |
| `warehouse_layouts` | Merged into `companies.warehouse_layouts` JSONB |
| `product_recalls` | Replaced by `products.status='recalled'` + checkpoints |
| `notification_events` | Ephemeral via Redis/Socket.io only |
| `qr_verification_logs` | Merged into `audit_logs` (action='QR_VERIFICATION') |
| `product_lineage_events` | Merged into `checkpoints` (checkpoint_type='transformation') |
| `business_registration_requests` | Replaced by `companies.status='pending_approval'` |
| `purchase_order_items` | Renamed to `po_line_items` |

**New Addition**: `so_line_items` (sales order line items)

---

## 20-Table Schema Architecture

### TIER 1: Core Entities (Tables 1-8)

#### 1. companies
Master organization registry with domain-specific metadata in JSONB.

```sql
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  company_code TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  legal_name TEXT,
  registration_number TEXT,
  tax_id TEXT,
  domain TEXT NOT NULL CHECK (domain IN ('agriculture', 'pharmaceutical', 'food', 'ecommerce', 'warehouse')),
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  address_line1 TEXT,
  postal_code TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_approval')),
  domain_metadata JSONB NOT NULL DEFAULT '{}',      -- Domain-specific fields
  warehouse_layouts JSONB NOT NULL DEFAULT '[]',     -- Warehouse definitions
  network_memberships TEXT[] NOT NULL DEFAULT '{}',  -- Network IDs
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Indexes**:
- `idx_companies_domain_status` ON (domain, status, created_at DESC)
- `idx_companies_code` ON (company_code)

#### 2. users
All authenticated platform users with role-based access control.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'producer' CHECK (role IN ('super_admin', 'org_admin', 'producer', 'distributor', 'retailer', 'inspector', 'consumer', 'auditor')),
  oauth_provider TEXT,
  oauth_id TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  notification_prefs JSONB NOT NULL DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  failed_login_count SMALLINT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Indexes**:
- `idx_users_org_role` ON (organization_id, role, created_at DESC)

#### 3. products
Core product registry with B2B visibility control.

```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  registered_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  domain TEXT NOT NULL CHECK (domain IN ('agriculture', 'pharmaceutical', 'food', 'ecommerce', 'warehouse')),
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
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'warning', 'critical', 'recalled', 'expired', 'verified', 'flagged')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'b2b', 'public')),
  qr_code_url TEXT,
  image_url TEXT,
  ipfs_cid TEXT,
  blockchain_tx_hash TEXT,
  blockchain_block_no BIGINT,
  smart_contract_id TEXT,
  domain_metadata JSONB NOT NULL DEFAULT '{}',
  certifications TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Indexes**:
- `idx_products_company_status` ON (company_id, status, created_at DESC)
- `idx_products_domain_created` ON (domain, created_at DESC)
- `idx_products_batch` ON (batch_number)
- `idx_products_sku` ON (sku)

#### 4. checkpoints
Supply chain event/milestone tracking with IoT payloads.

```sql
CREATE TABLE checkpoints (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  recorded_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  checkpoint_type TEXT NOT NULL CHECK (checkpoint_type IN ('received', 'quality-check', 'processed', 'dispatched', 'in-transit', 'delivered', 'recall', 'transformation', 'harvest', 'packaging', 'custom')),
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
  iot_payload JSONB NOT NULL DEFAULT '{}',
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  ipfs_cid TEXT,
  blockchain_tx_hash TEXT,
  blockchain_block_no BIGINT,
  parent_product_ids TEXT[] DEFAULT '{}',  -- For transformation events
  is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by_inspector TEXT REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Indexes**:
- `idx_checkpoints_product_created` ON (product_id, created_at DESC)
- `idx_checkpoints_type_created` ON (checkpoint_type, created_at DESC)
- `idx_checkpoints_company_created` ON (company_id, created_at DESC)

#### 5. audit_logs
Immutable write-only audit trail for compliance.

```sql
CREATE TABLE audit_logs (
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
```

#### 6. sensor_readings
Time-series IoT sensor data with anomaly detection.

```sql
CREATE TABLE sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  product_id TEXT REFERENCES products(product_id) ON DELETE SET NULL,
  checkpoint_id TEXT REFERENCES checkpoints(id) ON DELETE SET NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  sensor_type TEXT NOT NULL CHECK (sensor_type IN ('temperature', 'humidity', 'pressure', 'gps', 'vibration', 'weight', 'door', 'light', 'gas', 'custom')),
  value DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  raw_payload JSONB,
  mqtt_topic TEXT,
  is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
  anomaly_reason TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Indexes**:
- `idx_sensor_readings_device_recorded` ON (device_id, recorded_at DESC)
- `idx_sensor_readings_product_recorded` ON (product_id, recorded_at DESC)

#### 7. iot_devices
IoT hardware registry with MQTT integration.

```sql
CREATE TABLE iot_devices (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('temperature_sensor', 'humidity_sensor', 'gps_tracker', 'weight_scale', 'door_sensor', 'vibration_sensor', 'gas_detector', 'rfid_reader', 'camera', 'custom')),
  model TEXT,
  firmware_version TEXT,
  mqtt_topic TEXT NOT NULL,
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  battery_pct SMALLINT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Indexes**:
- `idx_iot_devices_company_status` ON (company_id, is_active, last_seen_at DESC)
- `idx_iot_devices_mqtt_client` ON (device_id)

#### 8. ai_anomaly_insights
Unified AI insights, anomalies, forecasts, and optimizations.

```sql
CREATE TABLE ai_anomaly_insights (
  id BIGSERIAL PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  product_id TEXT REFERENCES products(product_id) ON DELETE CASCADE,
  checkpoint_id TEXT REFERENCES checkpoints(id) ON DELETE CASCADE,
  sensor_reading_id BIGINT REFERENCES sensor_readings(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('temperature_breach', 'humidity_spike', 'location_deviation', 'delay', 'tampering', 'demand_forecast', 'optimization', 'inventory_alert', 'quality_risk', 'custom')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'high', 'critical')),
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
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Indexes**:
- `idx_ai_insights_company_resolved` ON (company_id, is_resolved, created_at DESC)
- `idx_ai_insights_type_created` ON (insight_type, created_at DESC)

---

### TIER 2: SCM Operations (Tables 9-15)

#### 9. supplier_relationships
B2B partner network with contract terms and performance tracking.

```sql
CREATE TABLE supplier_relationships (
  id TEXT PRIMARY KEY,
  buyer_company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'supplier' CHECK (relationship_type IN ('supplier', 'manufacturer', 'distributor', 'logistics_partner', 'warehouse_partner', 'retailer', 'service_provider', 'ecosystem_partner')),
  category TEXT,
  contract_status TEXT NOT NULL DEFAULT 'prospect' CHECK (contract_status IN ('prospect', 'active', 'on_hold', 'terminated', 'expired')),
  performance_score DOUBLE PRECISION,
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  lead_time_days INTEGER,
  payment_terms TEXT,
  contract_terms JSONB NOT NULL DEFAULT '{}',  -- Contract details, stage_order, notes
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (buyer_company_id, supplier_company_id)
);
```

**Key Indexes**:
- `idx_supplier_rel_buyer_supplier` ON (buyer_company_id, supplier_company_id, contract_status)

#### 10. purchase_orders
Procurement order management.

```sql
CREATE TABLE purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  buyer_company_id TEXT NOT NULL REFERENCES companies(id),
  supplier_company_id TEXT NOT NULL REFERENCES companies(id),
  total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'shipped', 'delivered', 'cancelled', 'returned')),
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  notes TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Indexes**:
- `idx_po_buyer_status` ON (buyer_company_id, status, created_at DESC)
- `idx_po_supplier_status` ON (supplier_company_id, status, created_at DESC)

#### 11. po_line_items
Purchase order line items with received/rejected tracking.

```sql
CREATE TABLE po_line_items (
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
```

**Key Indexes**:
- `idx_po_line_items_po` ON (po_id)

#### 12. sales_orders
Customer sales order management.

```sql
CREATE TABLE sales_orders (
  id TEXT PRIMARY KEY,
  so_number TEXT NOT NULL UNIQUE,
  seller_company_id TEXT NOT NULL REFERENCES companies(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded')),
  shipping_address TEXT,
  billing_address TEXT,
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Indexes**:
- `idx_so_seller_status` ON (seller_company_id, status, created_at DESC)

#### 13. so_line_items
Sales order line items with shipped quantity tracking.

```sql
CREATE TABLE so_line_items (
  id TEXT PRIMARY KEY,
  so_id TEXT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(product_id),
  quantity DOUBLE PRECISION NOT NULL,
  unit_price DOUBLE PRECISION NOT NULL,
  total_price DOUBLE PRECISION NOT NULL,
  shipped_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
  notes TEXT
);
```

**Key Indexes**:
- `idx_so_line_items_so` ON (so_id)

#### 14. shipments
Multi-leg shipment tracking with cold chain support.

```sql
CREATE TABLE shipments (
  id TEXT PRIMARY KEY,
  shipment_code TEXT NOT NULL UNIQUE,
  order_type TEXT NOT NULL DEFAULT 'purchase_order' CHECK (order_type IN ('purchase_order', 'sales_order', 'transfer', 'return')),
  order_id TEXT,
  source_company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  destination_company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  current_status TEXT NOT NULL DEFAULT 'planned' CHECK (current_status IN ('planned', 'packed', 'in_transit', 'delivered', 'delayed', 'cancelled')),
  carrier_name TEXT,
  tracking_number TEXT,
  freight_cost DOUBLE PRECISION,
  estimated_departure_at TIMESTAMPTZ,
  estimated_arrival_at TIMESTAMPTZ,
  actual_departure_at TIMESTAMPTZ,
  actual_arrival_at TIMESTAMPTZ,
  route_summary TEXT,
  cold_chain_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Indexes**:
- `idx_shipments_source_status` ON (source_company_id, current_status, updated_at DESC)
- `idx_shipments_destination_status` ON (destination_company_id, current_status, updated_at DESC)

#### 15. shipment_legs
Multi-leg route tracking for complex shipments.

```sql
CREATE TABLE shipment_legs (
  id TEXT PRIMARY KEY,
  shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  leg_sequence INTEGER NOT NULL,
  origin_location TEXT NOT NULL,
  destination_location TEXT NOT NULL,
  transport_mode TEXT NOT NULL DEFAULT 'road' CHECK (transport_mode IN ('road', 'rail', 'air', 'sea', 'multimodal')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_transit', 'completed', 'delayed', 'cancelled')),
  planned_departure_at TIMESTAMPTZ,
  planned_arrival_at TIMESTAMPTZ,
  actual_departure_at TIMESTAMPTZ,
  actual_arrival_at TIMESTAMPTZ,
  distance_km DOUBLE PRECISION,
  carrier_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shipment_id, leg_sequence)
);
```

**Key Indexes**:
- `idx_shipment_legs_shipment_sequence` ON (shipment_id, leg_sequence)

---

### TIER 3: Production & Inventory (Tables 16-18)

#### 16. production_orders
Manufacturing orders with stages in JSONB.

```sql
CREATE TABLE production_orders (
  id TEXT PRIMARY KEY,
  production_number TEXT NOT NULL UNIQUE,
  company_id TEXT NOT NULL REFERENCES companies(id),
  target_product_id TEXT NOT NULL REFERENCES products(product_id),
  target_quantity DOUBLE PRECISION NOT NULL,
  completed_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
  wasted_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'quality_check', 'completed', 'halted', 'cancelled')),
  stages JSONB NOT NULL DEFAULT '[]',  -- Array of stage objects
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  supervisor_id TEXT REFERENCES users(id),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Indexes**:
- `idx_production_orders_company_status` ON (company_id, status, created_at DESC)

#### 17. production_materials
Input materials for production orders.

```sql
CREATE TABLE production_materials (
  id TEXT PRIMARY KEY,
  production_order_id TEXT NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  input_product_id TEXT REFERENCES products(product_id) ON DELETE SET NULL,
  input_sku TEXT,
  planned_quantity DOUBLE PRECISION NOT NULL,
  consumed_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
  waste_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'unit',
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Indexes**:
- `idx_production_materials_order` ON (production_order_id)

#### 18. inventory_stock
Real-time inventory per warehouse/rack/bin.

```sql
CREATE TABLE inventory_stock (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(product_id) ON DELETE CASCADE,
  warehouse_name TEXT,
  rack_row_bin TEXT,
  lot_number TEXT,
  serial_number TEXT,
  quantity_on_hand DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  quantity_reserved DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  unit_of_measure TEXT NOT NULL DEFAULT 'unit',
  reorder_point DOUBLE PRECISION,
  max_capacity DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'optimal' CHECK (status IN ('optimal', 'low', 'out', 'overstock', 'quarantine', 'reserved')),
  last_counted_at TIMESTAMPTZ,
  expiry_date DATE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Indexes**:
- `idx_inventory_company_product` ON (company_id, product_id, status)
- `idx_inventory_warehouse` ON (company_id, warehouse_name, status)

---

### TIER 4: Enterprise Features (Tables 19-20)

#### 19. integration_connectors
Third-party system integrations (ERP, CRM, etc.).

```sql
CREATE TABLE integration_connectors (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  connector_type TEXT NOT NULL DEFAULT 'erp' CHECK (connector_type IN ('erp', 'crm', 'ecommerce', 'logistics', 'warehouse', 'webhook', 'iot', 'accounting')),
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'configured' CHECK (status IN ('configured', 'active', 'paused', 'error', 'disconnected')),
  base_url TEXT,
  auth_type TEXT NOT NULL DEFAULT 'api_key' CHECK (auth_type IN ('api_key', 'basic', 'oauth2', 'webhook_secret', 'none')),
  credentials JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  last_test_at TIMESTAMPTZ,
  last_test_status TEXT,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, provider)
);
```

**Key Indexes**:
- `idx_integration_connectors_company_status` ON (company_id, status, updated_at DESC)

#### 20. integration_sync_logs
Integration sync execution history.

```sql
CREATE TABLE integration_sync_logs (
  id TEXT PRIMARY KEY,
  connector_id TEXT NOT NULL REFERENCES integration_connectors(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  sync_type TEXT NOT NULL DEFAULT 'manual' CHECK (sync_type IN ('manual', 'scheduled', 'webhook', 'realtime')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  records_processed INTEGER NOT NULL DEFAULT 0,
  records_created INTEGER NOT NULL DEFAULT 0,
  records_updated INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  triggered_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Indexes**:
- `idx_integration_sync_logs_connector_started` ON (connector_id, started_at DESC)

---

## Key Design Decisions

### 1. JSONB for Domain-Specific Data
Instead of 5 separate domain_company tables, all domain-specific fields are stored in `companies.domain_metadata` JSONB. This provides:
- Schema flexibility per domain
- Reduced table count and complexity
- Better query performance for domain-specific filters
- Easier migrations and updates

### 2. Unified AI Insights Table
Combined anomalies, forecasts, and optimizations into `ai_anomaly_insights` with `insight_type` discriminator:
- Single table for all AI-generated insights
- Consistent resolution workflow
- Easier ML model integration
- Reduced maintenance overhead

### 3. Production Stages in JSONB
WIP events are now stored as a JSONB array in `production_orders.stages`:
- Atomic stage tracking per order
- No separate table joins
- Easier stage sequence management
- Better serialization for APIs

### 4. Supplier Relationships as Networks
Replaced separate network/partner tables with enhanced `supplier_relationships`:
- Natural B2B relationship model
- Contract terms in JSONB
- Performance tracking built-in
- Ecosystem partner type for network roots

### 5. Product Visibility for B2B Catalog
Replaced partner catalog with `products.visibility` field:
- Single source of truth for products
- B2B products visible to partners
- Simplified catalog management
- Reduced data duplication

---

## Migration Guide (35+ Tables → 20 Tables)

### Step 1: Backup
```bash
pg_dump -U postgres chaintrace_db > backup_pre_migration.sql
```

### Step 2: Run New Schema
The new `ensurePostgresSchema()` function in `postgres.ts` uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run on existing databases. It will create missing tables but won't drop old ones.

### Step 3: Data Migration (Manual)
For production databases, write migration scripts to:
1. Merge domain_company data into `companies.domain_metadata`
2. Convert `supply_chain_networks` to `supplier_relationships`
3. Migrate `wip_events` to `production_orders.stages` JSONB
4. Move `demand_forecasts` and `optimization_recommendations` to `ai_anomaly_insights`
5. Rename `production_order_materials` to `production_materials`
6. Update `purchase_order_items` references to `po_line_items`

### Step 4: Drop Old Tables (After Verification)
```sql
-- Only after confirming data migration success
DROP TABLE IF EXISTS agriculture_companies CASCADE;
DROP TABLE IF EXISTS pharmaceutical_companies CASCADE;
DROP TABLE IF EXISTS food_safety_companies CASCADE;
DROP TABLE IF EXISTS ecommerce_companies CASCADE;
DROP TABLE IF EXISTS warehouse_iot_companies CASCADE;
DROP TABLE IF EXISTS supply_chain_networks CASCADE;
DROP TABLE IF EXISTS supply_chain_network_partners CASCADE;
DROP TABLE IF EXISTS partner_catalog_entries CASCADE;
DROP TABLE IF EXISTS procurement_contracts CASCADE;
DROP TABLE IF EXISTS demand_forecasts CASCADE;
DROP TABLE IF EXISTS optimization_recommendations CASCADE;
DROP TABLE IF EXISTS wip_events CASCADE;
DROP TABLE IF EXISTS production_order_materials CASCADE;
DROP TABLE IF EXISTS warehouse_layouts CASCADE;
DROP TABLE IF EXISTS product_recalls CASCADE;
DROP TABLE IF EXISTS notification_events CASCADE;
DROP TABLE IF EXISTS qr_verification_logs CASCADE;
DROP TABLE IF EXISTS product_lineage_events CASCADE;
DROP TABLE IF EXISTS business_registration_requests CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
```

---

## Performance Considerations

### Indexing Strategy
- All tables have composite indexes on (company_id, status, created_at)
- Time-series data (sensor_readings, audit_logs) use BIGSERIAL for performance
- Foreign key columns are indexed for JOIN performance
- JSONB columns use GIN indexes where appropriate (can be added later)

### Partitioning (Future)
For high-volume tables:
- `sensor_readings`: Partition by month on `recorded_at`
- `audit_logs`: Partition by quarter on `created_at`
- `checkpoints`: Partition by domain on `domain`

### Caching
- Redis for session tokens and ephemeral notifications
- PostgreSQL materialized views for complex analytics queries
- Application-level caching for static reference data

---

## Security & Compliance

### Row-Level Security (Future Enhancement)
```sql
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON companies
  USING (id = current_setting('app.current_company_id')::uuid);
```

### Audit Trail
- All tables have `created_at` and `updated_at` timestamps
- `audit_logs` captures all mutations with old/new values
- IP address and user agent tracking for compliance

### Data Retention
- `sensor_readings`: Archive after 90 days
- `audit_logs`: Retain for 7 years (compliance)
- `integration_sync_logs`: Purge after 30 days

---

## Demo Accounts (After Running seed:demo)

| Email | Password | Role | Organization |
|---|---|---|---|
| admin@chaintrace.io | Admin@12345 | super_admin | ChainTrace Platform |
| demo@chaintrace.io | Demo@12345 | org_admin | BlueRiver Foods |
| producer@chaintrace.io | Demo@12345 | producer | BlueRiver Foods |

---

## Next Steps

1. **Run Database Seed**: `cd server && npm run seed:demo`
2. **Start Backend**: `npm run dev --workspace server`
3. **Start Frontend**: `npm run dev --workspace client`
4. **Login**: Use demo@chaintrace.io / Demo@12345
5. **Test SCM Features**: Navigate to /scm/ecosystem to create networks and add partners

---

**Schema Version**: 2.0  
**Last Updated**: April 7, 2026  
**Maintained By**: ChainTrace Engineering Team
