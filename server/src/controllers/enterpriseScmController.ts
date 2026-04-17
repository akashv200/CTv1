import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { pgPool } from "../config/postgres.js";

function getBusinessContext(req: Request) {
  const companyId = (req.user as any)?.orgId;
  const isSuperAdmin = (req.user as any)?.role === "admin";

  return {
    companyId: companyId ?? (isSuperAdmin ? "seed-company-chaintrace" : null),
    userId: req.user?.id ?? req.user?.sub
  };
}

function ensureCompanyAccess(res: Response, companyId?: string) {
  if (!companyId) {
    res.status(403).json({ error: "Approved organization access is required." });
    return false;
  }

  return true;
}

export async function listSupplierRelationships(req: Request, res: Response) {
  try {
    const { companyId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;

    const result = await pgPool.query(
      `
        SELECT
          sr.*,
          supplier.company_name AS supplier_name,
          supplier.domain AS supplier_domain,
          supplier.country AS supplier_country,
          buyer.company_name AS buyer_name
        FROM supplier_relationships sr
        JOIN companies supplier ON supplier.id = sr.supplier_company_id
        JOIN companies buyer ON buyer.id = sr.buyer_company_id
        WHERE sr.buyer_company_id = $1 OR sr.supplier_company_id = $1
        ORDER BY sr.updated_at DESC
      `,
      [companyId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching supplier relationships:", error);
    res.status(500).json({ error: "Failed to fetch supplier relationships" });
  }
}

export async function createSupplierRelationship(req: Request, res: Response) {
  try {
    const { companyId, userId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;

    const {
      supplierCompanyId,
      relationshipType,
      category,
      contractStatus,
      performanceScore,
      riskLevel,
      leadTimeDays,
      paymentTerms,
      metadata
    } = req.body;

    if (!supplierCompanyId) {
      return res.status(400).json({ error: "Missing supplierCompanyId" });
    }

    const id = uuidv4();
    await pgPool.query(
      `
        INSERT INTO supplier_relationships (
          id, buyer_company_id, supplier_company_id, relationship_type, category, contract_status,
          performance_score, risk_level, lead_time_days, payment_terms, metadata, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
      [
        id,
        companyId,
        supplierCompanyId,
        relationshipType ?? "supplier",
        category ?? null,
        contractStatus ?? "prospect",
        performanceScore ?? null,
        riskLevel ?? "medium",
        leadTimeDays ?? null,
        paymentTerms ?? null,
        metadata ?? {},
        userId ?? null
      ]
    );

    res.status(201).json({ message: "Supplier relationship created", id });
  } catch (error) {
    console.error("Error creating supplier relationship:", error);
    res.status(500).json({ error: "Failed to create supplier relationship" });
  }
}

export async function listPartnerCatalogEntries(req: Request, res: Response) {
  try {
    const { companyId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;

    const { domain, search } = req.query;
    const params: unknown[] = [];
    let paramIndex = 1;
    // partner_catalog_entries removed; B2B products now replace this functionality
    let query = `
      SELECT
        p.*,
        c.company_name,
        c.domain
      FROM products p
      JOIN companies c ON c.id = p.company_id
      WHERE c.status = 'active'
        AND p.visibility = 'b2b'
    `;

    if (domain) {
      query += ` AND c.domain = $${paramIndex}`;
      params.push(domain);
      paramIndex++;
    }

    if (search) {
      query += ` AND (p.product_name ILIKE $${paramIndex} OR c.company_name ILIKE $${paramIndex} OR COALESCE(p.sku, '') ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += " ORDER BY p.updated_at DESC LIMIT 100";

    console.log("listPartnerCatalogEntries query:", query, params);
    const result = await pgPool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching partner catalog:", error);
    res.status(500).json({ error: "Failed to fetch partner catalog" });
  }
}

export async function createPartnerCatalogEntry(req: Request, res: Response) {
  try {
    const { companyId, userId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;

    const {
      productName,
      category,
      description,
      sku,
      quantity,
      unit,
      originLocation,
      originCountry,
      metadata
    } = req.body;

    if (!productName) {
      return res.status(400).json({ error: "Missing productName" });
    }

    // partner_catalog_entries removed; create a B2B product instead
    const id = uuidv4();
    const productId = `PRD-${Date.now().toString().slice(-8)}`;
    await pgPool.query(
      `
        INSERT INTO products (
          id, product_id, company_id, registered_by, domain, product_name, category,
          description, sku, quantity, unit, origin_location, origin_country, visibility,
          status, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `,
      [
        id,
        productId,
        companyId,
        userId ?? null,
        req.body.domain ?? "ecommerce",
        productName,
        category ?? null,
        description ?? null,
        sku ?? null,
        quantity ?? 0,
        unit ?? "unit",
        originLocation ?? null,
        originCountry ?? null,
        "b2b",
        "active",
        metadata ?? {}
      ]
    );

    console.log("createPartnerCatalogEntry: created B2B product", id);
    res.status(201).json({ message: "Partner catalog entry created", id, productId });
  } catch (error) {
    console.error("Error creating partner catalog entry:", error);
    res.status(500).json({ error: "Failed to create partner catalog entry" });
  }
}

export async function listShipments(req: Request, res: Response) {
  try {
    const { companyId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;

    const result = await pgPool.query(
      `
        SELECT
          s.*,
          source.company_name AS source_company_name,
          destination.company_name AS destination_company_name,
          COALESCE(legs.leg_count, 0) AS leg_count
        FROM shipments s
        JOIN companies source ON source.id = s.source_company_id
        LEFT JOIN companies destination ON destination.id = s.destination_company_id
        LEFT JOIN (
          SELECT shipment_id, COUNT(*)::INT AS leg_count
          FROM shipment_legs
          GROUP BY shipment_id
        ) legs ON legs.shipment_id = s.id
        WHERE s.source_company_id = $1 OR s.destination_company_id = $1
        ORDER BY s.updated_at DESC
      `,
      [companyId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching shipments:", error);
    res.status(500).json({ error: "Failed to fetch shipments" });
  }
}

export async function createShipment(req: Request, res: Response) {
  const client = await pgPool.connect();

  try {
    const { companyId, userId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;

    const {
      orderType,
      orderId,
      destinationCompanyId,
      currentStatus,
      carrierName,
      trackingNumber,
      freightCost,
      estimatedDepartureAt,
      estimatedArrivalAt,
      routeSummary,
      metadata,
      legs
    } = req.body;

    if (!destinationCompanyId) {
      return res.status(400).json({ error: "Missing destinationCompanyId" });
    }

    const shipmentId = uuidv4();
    const shipmentCode = `SHP-${Date.now().toString().slice(-8)}`;

    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO shipments (
          id, shipment_code, order_type, order_id, source_company_id, destination_company_id,
          current_status, carrier_name, tracking_number, freight_cost, estimated_departure_at,
          estimated_arrival_at, route_summary, metadata, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `,
      [
        shipmentId,
        shipmentCode,
        orderType ?? "purchase_order",
        orderId ?? null,
        companyId,
        destinationCompanyId,
        currentStatus ?? "planned",
        carrierName ?? null,
        trackingNumber ?? null,
        freightCost ?? null,
        estimatedDepartureAt ?? null,
        estimatedArrivalAt ?? null,
        routeSummary ?? null,
        metadata ?? {},
        userId ?? null
      ]
    );

    if (Array.isArray(legs)) {
      for (let index = 0; index < legs.length; index += 1) {
        const leg = legs[index];
        await client.query(
          `
            INSERT INTO shipment_legs (
              id, shipment_id, leg_sequence, origin_location, destination_location, transport_mode,
              status, planned_departure_at, planned_arrival_at, actual_departure_at, actual_arrival_at,
              distance_km, metadata
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `,
          [
            uuidv4(),
            shipmentId,
            Number(leg.legSequence ?? index + 1),
            leg.originLocation,
            leg.destinationLocation,
            leg.transportMode ?? "road",
            leg.status ?? "planned",
            leg.plannedDepartureAt ?? null,
            leg.plannedArrivalAt ?? null,
            leg.actualDepartureAt ?? null,
            leg.actualArrivalAt ?? null,
            leg.distanceKm ?? null,
            leg.metadata ?? {}
          ]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Shipment created", shipmentId, shipmentCode });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating shipment:", error);
    res.status(500).json({ error: "Failed to create shipment" });
  } finally {
    client.release();
  }
}

export async function listProductionOrders(req: Request, res: Response) {
  try {
    const { companyId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;

    const result = await pgPool.query(
      `
        SELECT
          po.*,
          products.product_name AS target_product_name,
          COALESCE(materials.material_count, 0) AS material_count,
          CASE
            WHEN jsonb_array_length(po.stages) > 0
            THEN po.stages->>-1
            ELSE NULL
          END AS latest_stage_name,
          CASE
            WHEN jsonb_array_length(po.stages) > 0
            THEN po.stages->>'status'
            ELSE NULL
          END AS latest_stage_status
        FROM production_orders po
        LEFT JOIN products ON products.product_id = po.target_product_id
        LEFT JOIN (
          SELECT production_order_id, COUNT(*)::INT AS material_count
          FROM production_materials
          GROUP BY production_order_id
        ) materials ON materials.production_order_id = po.id
        WHERE po.company_id = $1
        ORDER BY po.created_at DESC
      `,
      [companyId]
    );

    console.log("listProductionOrders: found", result.rows.length, "orders");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching production orders:", error);
    res.status(500).json({ error: "Failed to fetch production orders" });
  }
}

export async function createProductionOrder(req: Request, res: Response) {
  try {
    const { companyId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;

    const { targetProductId, targetQuantity, status, startDate, endDate, supervisorId } = req.body;
    if (!targetProductId || !targetQuantity) {
      return res.status(400).json({ error: "Missing targetProductId or targetQuantity" });
    }

    const id = uuidv4();
    const productionNumber = `MO-${Date.now().toString().slice(-8)}`;

    await pgPool.query(
      `
        INSERT INTO production_orders (
          id, production_number, company_id, target_product_id, target_quantity, status, start_date, end_date, supervisor_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        id,
        productionNumber,
        companyId,
        targetProductId,
        targetQuantity,
        status ?? "planned",
        startDate ?? null,
        endDate ?? null,
        supervisorId ?? null
      ]
    );

    res.status(201).json({ message: "Production order created", id, productionNumber });
  } catch (error) {
    console.error("Error creating production order:", error);
    res.status(500).json({ error: "Failed to create production order" });
  }
}

export async function addProductionMaterialToOrder(req: Request, res: Response) {
  try {
    const { companyId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;

    const { id: productionOrderId } = req.params;
    const { inputProductId, inputSku, plannedQuantity, consumedQuantity, wasteQuantity, unit, metadata } = req.body;

    if (!plannedQuantity) {
      return res.status(400).json({ error: "Missing plannedQuantity" });
    }

    const orderResult = await pgPool.query(
      `SELECT 1 FROM production_orders WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [productionOrderId, companyId]
    );

    if (orderResult.rowCount === 0) {
      return res.status(404).json({ error: "Production order not found" });
    }

    const materialId = uuidv4();
    await pgPool.query(
      `
        INSERT INTO production_materials (
          id, production_order_id, input_product_id, input_sku, planned_quantity,
          consumed_quantity, waste_quantity, unit, notes, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        materialId,
        productionOrderId,
        inputProductId ?? null,
        inputSku ?? null,
        plannedQuantity,
        consumedQuantity ?? 0,
        wasteQuantity ?? 0,
        unit ?? "unit",
        req.body.notes ?? null,
        metadata ?? {}
      ]
    );

    console.log("addProductionMaterialToOrder: created material", materialId);
    res.status(201).json({ message: "Production material added", materialId });
  } catch (error) {
    console.error("Error adding production material:", error);
    res.status(500).json({ error: "Failed to add production material" });
  }
}

export async function addWipEventToOrder(req: Request, res: Response) {
  try {
    const { companyId, userId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;

    const { id: productionOrderId } = req.params;
    const { stageName, workstation, status, startedAt, endedAt, notes, metadata } = req.body;

    if (!stageName) {
      return res.status(400).json({ error: "Missing stageName" });
    }

    const orderResult = await pgPool.query(
      `SELECT stages FROM production_orders WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [productionOrderId, companyId]
    );

    if (orderResult.rowCount === 0) {
      return res.status(404).json({ error: "Production order not found" });
    }

    // wip_events table removed; stages are now stored in production_orders.stages JSONB
    const existingStages = orderResult.rows[0].stages ?? [];
    const newStage = {
      stage_name: stageName,
      workstation: workstation ?? null,
      status: status ?? "queued",
      started_at: startedAt ?? null,
      ended_at: endedAt ?? null,
      operator_id: userId ?? null,
      notes: notes ?? null,
      metadata: metadata ?? {}
    };
    const updatedStages = [...existingStages, newStage];

    await pgPool.query(
      `
        UPDATE production_orders
        SET stages = $1, updated_at = NOW()
        WHERE id = $2
      `,
      [JSON.stringify(updatedStages), productionOrderId]
    );

    const wipEventId = uuidv4();
    console.log("addWipEventToOrder: added stage to stages JSONB", wipEventId);
    res.status(201).json({ message: "WIP event added", wipEventId });
  } catch (error) {
    console.error("Error adding WIP event:", error);
    res.status(500).json({ error: "Failed to add WIP event" });
  }
}

export async function listOptimizationRecommendations(req: Request, res: Response) {
  try {
    const { companyId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;

    // optimization_recommendations removed; use ai_anomaly_insights with insight_type='optimization'
    const result = await pgPool.query(
      `
        SELECT
          id, company_id, insight_type AS recommendation_type, severity, title, description,
          estimated_impact AS estimated_savings, target_entity_type, target_entity_id,
          CASE WHEN is_resolved THEN 'resolved' ELSE 'open' END AS status,
          metadata, created_at
        FROM ai_anomaly_insights
        WHERE company_id = $1
          AND insight_type = 'optimization'
        ORDER BY created_at DESC
        LIMIT 100
      `,
      [companyId]
    );

    console.log("listOptimizationRecommendations: found", result.rows.length, "insights");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching optimization recommendations:", error);
    res.status(500).json({ error: "Failed to fetch optimization recommendations" });
  }
}

export async function createOptimizationRecommendation(req: Request, res: Response) {
  try {
    const { companyId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;

    const {
      recommendationType,
      severity,
      title,
      description,
      estimatedSavings,
      targetEntityType,
      targetEntityId,
      status,
      metadata
    } = req.body;

    if (!recommendationType || !title || !description) {
      return res.status(400).json({ error: "Missing recommendationType, title, or description" });
    }

    // optimization_recommendations removed; use ai_anomaly_insights with insight_type='optimization'
    const result = await pgPool.query(
      `
        INSERT INTO ai_anomaly_insights (
          company_id, insight_type, severity, title, description,
          estimated_impact, target_entity_type, target_entity_id, is_resolved, metadata
        )
        VALUES ($1, 'optimization', $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `,
      [
        companyId,
        severity ?? "warning",
        title,
        description,
        estimatedSavings ?? null,
        targetEntityType ?? null,
        targetEntityId ?? null,
        status === "resolved" ? true : false,
        { ...(metadata ?? {}), recommendation_type: recommendationType }
      ]
    );

    console.log("createOptimizationRecommendation: created insight", result.rows[0].id);
    res.status(201).json({ message: "Optimization recommendation created", id: result.rows[0].id });
  } catch (error) {
    console.error("Error creating optimization recommendation:", error);
    res.status(500).json({ error: "Failed to create optimization recommendation" });
  }
}

export async function listInventoryStock(req: Request, res: Response) {
  try {
    const { companyId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;

    // warehouse_layouts table removed; warehouse info now in companies.warehouse_layouts JSONB
    // and inventory_stock.warehouse_name
    const result = await pgPool.query(
      `
        SELECT
          inv.*,
          p.product_name
        FROM inventory_stock inv
        LEFT JOIN products p ON p.product_id = inv.product_id
        WHERE inv.company_id = $1
        ORDER BY inv.updated_at DESC
      `,
      [companyId]
    );

    console.log("listInventoryStock: found", result.rows.length, "records");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching inventory stock:", error);
    res.status(500).json({ error: "Failed to fetch inventory stock" });
  }
}

export async function createInventoryStockRecord(req: Request, res: Response) {
  try {
    const { companyId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;

    const {
      warehouseName,
      productId,
      sku,
      rackRowBin,
      lotNumber,
      serialNumber,
      quantity,
      reorderPoint,
      maxCapacity,
      status,
      expiryDate,
      metadata
    } = req.body;

    // warehouse_layout_id removed; use warehouse_name column instead
    if (!sku || quantity == null) {
      return res.status(400).json({ error: "Missing sku or quantity" });
    }

    const inventoryId = uuidv4();
    await pgPool.query(
      `
        INSERT INTO inventory_stock (
          id, company_id, product_id, warehouse_name, sku, rack_row_bin, lot_number, serial_number,
          quantity_on_hand, reorder_point, max_capacity, status, expiry_date, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `,
      [
        inventoryId,
        companyId,
        productId ?? null,
        warehouseName ?? null,
        sku,
        rackRowBin ?? null,
        lotNumber ?? null,
        serialNumber ?? null,
        quantity,
        reorderPoint ?? 0,
        maxCapacity ?? null,
        status ?? "optimal",
        expiryDate ?? null,
        metadata ?? {}
      ]
    );

    console.log("createInventoryStockRecord: created record", inventoryId);
    res.status(201).json({ message: "Inventory record created", inventoryId });
  } catch (error) {
    console.error("Error creating inventory stock record:", error);
    res.status(500).json({ error: "Failed to create inventory stock record" });
  }
}

async function buildInventoryOptimizationRows(companyId: string) {
  // warehouse_layouts removed; use inventory_stock.warehouse_name
  // demand_forecasts removed; use ai_anomaly_insights with insight_type='demand_forecast'
  const result = await pgPool.query(
    `
      SELECT
        s.*,
        p.product_name,
        latest_forecast.metadata->>'predicted_demand_quantity' AS predicted_demand_quantity,
        latest_forecast.metadata->>'forecast_period_start' AS forecast_period_start,
        latest_forecast.metadata->>'forecast_period_end' AS forecast_period_end,
        supplier_stats.avg_lead_time_days
      FROM inventory_stock s
      LEFT JOIN products p ON p.product_id = s.product_id
      LEFT JOIN LATERAL (
        SELECT metadata
        FROM ai_anomaly_insights
        WHERE company_id = s.company_id
          AND insight_type = 'demand_forecast'
          AND (target_entity_type IS NULL OR target_entity_id = s.product_id)
        ORDER BY created_at DESC
        LIMIT 1
      ) latest_forecast ON TRUE
      LEFT JOIN LATERAL (
        SELECT ROUND(AVG(lead_time_days))::INT AS avg_lead_time_days
        FROM supplier_relationships
        WHERE buyer_company_id = s.company_id
          AND contract_status = 'active'
          AND lead_time_days IS NOT NULL
      ) supplier_stats ON TRUE
      WHERE s.company_id = $1
      ORDER BY s.updated_at DESC
    `,
    [companyId]
  );

  return result.rows.map((row) => {
    const start = row.forecast_period_start ? new Date(row.forecast_period_start) : null;
    const end = row.forecast_period_end ? new Date(row.forecast_period_end) : null;
    const forecastDays = start && end
      ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
      : 30;
    const predictedDemandQuantity = Number(row.predicted_demand_quantity ?? 0);
    const dailyDemand = predictedDemandQuantity > 0 ? predictedDemandQuantity / forecastDays : Math.max(Number(row.reorder_point ?? 0) / 7, 1);
    const leadTimeDays = Number(row.avg_lead_time_days ?? 7);
    const safetyStock = Math.max(5, Math.round(dailyDemand * Math.sqrt(leadTimeDays) * 1.65));
    const suggestedReorderPoint = Math.max(1, Math.round(dailyDemand * leadTimeDays + safetyStock));
    const targetStockLevel = row.max_capacity
      ? Math.min(Number(row.max_capacity), suggestedReorderPoint + safetyStock)
      : suggestedReorderPoint + safetyStock;
    const suggestedReplenishmentQty = Math.max(0, Math.round(targetStockLevel - Number(row.quantity_on_hand ?? 0)));
    const stockCoverDays = dailyDemand > 0 ? Number(row.quantity_on_hand ?? 0) / dailyDemand : null;

    const suggestedStatus =
      Number(row.quantity_on_hand ?? 0) <= 0
        ? "out"
        : Number(row.quantity_on_hand ?? 0) < suggestedReorderPoint
          ? "low"
          : row.max_capacity && Number(row.quantity_on_hand ?? 0) > Number(row.max_capacity)
            ? "overstock"
            : row.status === "quarantine"
              ? "quarantine"
              : "optimal";

    return {
      ...row,
      daily_demand: Number(dailyDemand.toFixed(2)),
      lead_time_days_used: leadTimeDays,
      safety_stock: safetyStock,
      suggested_reorder_point: suggestedReorderPoint,
      target_stock_level: targetStockLevel,
      suggested_replenishment_qty: suggestedReplenishmentQty,
      stock_cover_days: stockCoverDays ? Number(stockCoverDays.toFixed(1)) : null,
      suggested_status: suggestedStatus
    };
  });
}

export async function listInventoryOptimizationSuggestions(req: Request, res: Response) {
  try {
    const { companyId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;
    if (!companyId) return;

    const rows = await buildInventoryOptimizationRows(companyId);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error computing inventory optimization suggestions:", error);
    res.status(500).json({ error: "Failed to compute inventory optimization suggestions" });
  }
}

export async function runInventoryOptimization(req: Request, res: Response) {
  const client = await pgPool.connect();

  try {
    const { companyId } = getBusinessContext(req);
    if (!ensureCompanyAccess(res, companyId)) return;
    if (!companyId) return;

    const rows = await buildInventoryOptimizationRows(companyId);
    await client.query("BEGIN");

    await client.query(
      `
        UPDATE ai_anomaly_insights
        SET is_resolved = true, resolved_at = NOW()
        WHERE company_id = $1
          AND insight_type = 'optimization'
          AND is_resolved = false
          AND metadata->>'source' = 'inventory_engine'
      `,
      [companyId]
    );

    let createdRecommendations = 0;

    for (const row of rows) {
      await client.query(
        `
          UPDATE inventory_stock
          SET reorder_point = $2,
              status = $3,
              updated_at = NOW()
          WHERE id = $1
        `,
        [row.id, row.suggested_reorder_point, row.suggested_status]
      );

      if (row.suggested_replenishment_qty > 0 || row.suggested_status === "overstock") {
        const title =
          row.suggested_status === "overstock"
            ? `Overstock alert for ${row.product_name ?? row.sku}`
            : `Replenishment needed for ${row.product_name ?? row.sku}`;
        const description =
          row.suggested_status === "overstock"
            ? `Current stock is above target capacity. Review transfers or promotions.`
            : `Recommended reorder point is ${row.suggested_reorder_point}. Suggested replenishment quantity is ${row.suggested_replenishment_qty}.`;

        await client.query(
          `
            INSERT INTO ai_anomaly_insights (
              company_id, insight_type, severity, title, description,
              estimated_impact, target_entity_type, target_entity_id, is_resolved, metadata
            )
            VALUES ($1, 'optimization', $2, $3, $4, $5, 'inventory_stock', $6, false, $7)
          `,
          [
            companyId,
            row.suggested_status === "overstock" ? "warning" : row.suggested_status === "out" ? "critical" : "warning",
            title,
            description,
            null,
            row.id,
            {
              source: "inventory_engine",
              recommendation_type: "inventory",
              suggestedReorderPoint: row.suggested_reorder_point,
              suggestedReplenishmentQty: row.suggested_replenishment_qty,
              stockCoverDays: row.stock_cover_days
            }
          ]
        );
        createdRecommendations += 1;
      }
    }

    await client.query("COMMIT");
    res.status(200).json({
      message: "Inventory optimization run completed",
      optimizedItems: rows.length,
      createdRecommendations
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error running inventory optimization:", error);
    res.status(500).json({ error: "Failed to run inventory optimization" });
  } finally {
    client.release();
  }
}
