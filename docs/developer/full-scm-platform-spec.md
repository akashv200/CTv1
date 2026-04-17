# ChainTrace Full SCM Platform Spec

## Objective
ChainTrace is no longer scoped as only a blockchain traceability portal. The platform should evolve into a fuller Supply Chain Management system that combines business onboarding, planning, procurement, manufacturing, inventory, logistics, orders, real-time tracking, and analytics on top of the existing blockchain-backed product history.

## Target Business Flow
1. A new entrepreneur or company submits a business access request from the website.
2. The super admin reviews the request.
3. Only after approval does ChainTrace create the organization and its first authorized user.
4. Approved business users can browse the B2B partner directory.
5. Approved business users can then use SCM workflows such as forecasting, sourcing, purchase orders, production planning, inventory, shipment tracking, and analytics.

## SCM Capability Model
### 1. Planning
- Forecast demand for each product, SKU, or batch family.
- Suggest inventory targets and production schedules.
- Support forecast periods, confidence score, and future actual-vs-forecast comparison.
- Current foundation:
  - `demand_forecasts`

### 2. Sourcing (Procurement)
- Maintain supplier visibility and raw material sourcing options.
- Let approved organizations discover manufacturers, suppliers, and distributors.
- Create and manage purchase orders and supplier relationships.
- Current foundation:
  - B2B directory endpoint
  - `purchase_orders`
  - `purchase_order_items`

### 3. Manufacturing
- Plan and monitor production orders.
- Track work-in-progress stages, quality holds, and completion.
- Link finished goods to source material lots for lineage.
- Current foundation:
  - `production_orders`
- Recommended next additions:
  - `production_order_materials`
  - `wip_events`

### 4. Inventory Management
- Monitor warehouse stock, reorder points, expiry, and quarantine states.
- Track stock movement at rack/bin level.
- Current foundation:
  - `inventory_stock`
  - `warehouse_layouts`

### 5. Logistics and Distribution
- Plan dispatch, shipping, delivery, and warehouse handoffs.
- Support route visibility and checkpoint-based movement history.
- Use blockchain hashes for tamper-evident milestone anchoring.
- Current foundation:
  - `checkpoints`
  - `sensor_readings`
- Recommended next additions:
  - `shipments`
  - `shipment_legs`
  - `delivery_proofs`

### 6. Order Management
- Track inbound and outbound business orders end to end.
- Show order status from creation to shipment to closure.
- Current foundation:
  - `purchase_orders`
  - `sales_orders`

### 7. Real-time Tracking
- Use IoT, MQTT, RFID/barcode/QR, and GPS-style checkpoints for live visibility.
- Stream events to dashboards and preserve operational history.
- Current foundation:
  - MQTT integration
  - Socket.io real-time events
  - `sensor_readings`
  - `checkpoints`

### 8. Analytics and Optimization
- Measure delays, stock issues, supplier performance, and demand trends.
- Recommend reorder, routing, and operational improvements.
- Current foundation:
  - AI insight scaffolding
  - demand forecast generation
- Recommended next additions:
  - `supplier_scorecards`
  - `route_performance_metrics`
  - `optimization_recommendations`

## Role Model
- `super_admin`
  - approves business applications
  - governs platform-wide access
  - oversees partner directory and system health
- `org_admin`
  - manages organization profile and users
  - accesses suppliers, sourcing, orders, forecasts, and reports
- `producer`
  - raw material registration
  - source checkpoint creation
  - inventory and outbound supply updates
- `distributor`
  - shipment movement
  - logistics updates
  - delivery coordination
- `retailer`
  - inbound inventory receipt
  - retail stock status
  - product verification support
- `inspector`
  - quality checks
  - compliance evidence
  - anomaly escalation
- `auditor`
  - read-only traceability, controls, and compliance review
- `consumer`
  - product verification only
  - no B2B directory or SCM collaboration access

## Approval and Access Rules
- Public self-signup is for consumers only.
- Business participation is approval-based.
- The B2B directory must be visible only to approved business organizations.
- SCM modules such as forecasts and orders must also be restricted to approved business organizations.

## Enterprise Foundation Implemented In Code
- Business onboarding and approval gate
  - public application request
  - super admin approval and rejection flow
- Approved-only business access
  - partner directory access control
  - SCM route access control
- Enterprise SCM schema foundations
  - `supplier_relationships`
  - `procurement_contracts`
  - `partner_catalog_entries`
  - `shipments`
  - `shipment_legs`
  - `production_order_materials`
  - `wip_events`
  - `optimization_recommendations`
- Enterprise SCM API foundations
  - supplier relationship endpoints
  - partner catalog endpoints
  - shipment endpoints
  - production order and WIP endpoints
  - optimization recommendation endpoints

## Ideal SCM Feature Mapping
- Real-time visibility
  - supported through checkpoints, sensor streams, MQTT, and WebSocket feeds
- Demand forecasting and planning
  - supported through `demand_forecasts`
- Inventory optimization
  - partially supported through `inventory_stock`, reorder points, and warehouse layouts
- Supplier management
  - supported at foundation level through onboarding, directory access, supplier relationships, and catalog entries
- Order management
  - supported through purchase and sales order tables plus SCM order APIs
- Logistics and transportation
  - supported at foundation level through shipments and shipment legs
- Warehouse management
  - supported at foundation level through warehouse layouts and 3D warehouse views
- Analytics and reporting
  - supported at foundation level through AI insights, anomaly data, and optimization recommendations
- Integration capabilities
  - supported through REST, GraphQL, MQTT, and WebSocket interfaces
- Automation and workflow management
  - partially supported through approval flows, alerts, and route-level access rules
- Risk management
  - supported at foundation level through anomaly insights, recall records, audit logs, and optimization records
- Scalability and cloud support
  - architecture-ready, but production cloud rollout remains a deployment phase
- Compliance and security
  - supported through RBAC, JWT, audit logs, and blockchain proof anchoring

## Recommended Database Expansion
Existing schema already contains several SCM-ready tables. To complete the full SCM vision, prioritize:
- `business_registration_requests`
- `demand_forecasts`
- `purchase_orders`
- `purchase_order_items`
- `sales_orders`
- `production_orders`
- `inventory_stock`
- `warehouse_layouts`
- `shipments`
- `shipment_legs`
- `production_order_materials`
- `wip_events`
- `supplier_relationships`
- `partner_catalog_entries`
- `optimization_recommendations`

## Phased Delivery Plan
### Phase 1: Controlled Business Onboarding
- business request form
- super admin approval flow
- approved-only B2B directory access

### Phase 2: Core SCM Operations
- demand forecasts
- purchase orders
- sales orders
- production orders
- inventory dashboards

### Phase 3: Logistics and Live Operations
- shipment entities
- route views
- IoT and GPS event overlays
- warehouse operations panels

### Phase 4: Analytics and Optimization
- performance scorecards
- anomaly models
- reorder suggestions
- supplier and logistics benchmarking

## Product Positioning
The final ChainTrace platform should serve two layers at once:
1. Traceability layer
   - product history
   - blockchain proof
   - verification
2. SCM layer
   - planning
   - sourcing
   - manufacturing
   - inventory
   - logistics
   - orders
   - optimization

That combination makes ChainTrace more useful than a normal tracker because it becomes a place where businesses can start, get approved, find partners, transact, operate, and prove trust in one system.
