import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { pgPool } from "../config/postgres.js";

// Generate an AI Demand Forecast insight
export const generateDemandForecast = async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;

    // @ts-ignore
    const companyId = req.user?.orgId;

    if (!productId) {
      return res.status(400).json({ error: "Missing productId" });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month forecast

    const predictedDemand = Math.floor(Math.random() * 5000) + 500; // Mock demand
    const score = 0.75 + (Math.random() * 0.2); // 0.75 to 0.95

    await pgPool.query(
      `INSERT INTO ai_anomaly_insights (
        company_id, product_id, insight_type, severity, title, description,
        confidence_score, estimated_impact, metadata
      ) VALUES ($1, $2, 'demand_forecast', 'info', $3, $4, $5, $6, $7)`,
      [
        companyId,
        productId,
        `Demand forecast for next 30 days`,
        `Predicted demand: ${predictedDemand} units with ${(score * 100).toFixed(1)}% confidence`,
        score,
        predictedDemand,
        JSON.stringify({
          period_start: startDate.toISOString(),
          period_end: endDate.toISOString(),
          model_version: "v1.2"
        })
      ]
    );

    res.status(201).json({
      productId,
      predictedDemandQuantity: predictedDemand,
      confidenceScore: score,
      period: { start: startDate, end: endDate }
    });
  } catch (error) {
    console.error("Error generating forecast:", error);
    res.status(500).json({ error: "Failed to generate demand forecast" });
  }
};

export const getForecasts = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const companyId = req.user?.orgId;

    const result = await pgPool.query(
      `SELECT a.*, p.product_name
       FROM ai_anomaly_insights a
       LEFT JOIN products p ON a.product_id = p.product_id
       WHERE a.company_id = $1 AND a.insight_type = 'demand_forecast'
       ORDER BY a.created_at DESC LIMIT 10`,
      [companyId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching forecasts:", error);
    res.status(500).json({ error: "Failed to fetch forecasts" });
  }
};

// Get Sales & Purchase Orders for a company
export const getOrders = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const companyId = req.user?.orgId;

    // Get Purchase Orders (where I am buyer)
    const poResult = await pgPool.query(
      `SELECT po.*, c.company_name as supplier_name 
       FROM purchase_orders po
       JOIN companies c ON po.supplier_company_id = c.id
       WHERE po.buyer_company_id = $1 
       ORDER BY po.created_at DESC`,
      [companyId]
    );

    // Get Sales Orders (where I am seller)
    const soResult = await pgPool.query(
      `SELECT * FROM sales_orders WHERE seller_company_id = $1 ORDER BY created_at DESC`,
      [companyId]
    );

    res.status(200).json({
      purchaseOrders: poResult.rows,
      salesOrders: soResult.rows
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// Create a new mock Purchase Order
export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { supplierCompanyId, items } = req.body;
    // items should be [{ productId, quantity, unitPrice }]

    // @ts-ignore
    const buyerCompanyId = req.user?.orgId;
    // @ts-ignore
    const userId = req.user?.id;

    if (!supplierCompanyId || !items || !items.length) {
      return res.status(400).json({ error: "Missing required PO fields" });
    }

    const poId = uuidv4();
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    
    let totalAmount = 0;
    const poItems = items.map((item: any) => {
      const itemTotal = item.quantity * item.unitPrice;
      totalAmount += itemTotal;
      return {
        id: uuidv4(),
        po_id: poId,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: itemTotal
      };
    });

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO purchase_orders (id, po_number, buyer_company_id, supplier_company_id, total_amount, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [poId, poNumber, buyerCompanyId, supplierCompanyId, totalAmount, 'submitted', userId]
      );

      for (const item of poItems) {
        await client.query(
          `INSERT INTO po_line_items (id, po_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [item.id, item.po_id, item.product_id, item.quantity, item.unit_price, item.total_price]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ message: "PO created", poId, poNumber, totalAmount });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating PO:", error);
    res.status(500).json({ error: "Failed to create PO" });
  }
};

export const createSalesOrder = async (req: Request, res: Response) => {
  try {
    const { customerName, customerEmail, totalAmount, shippingAddress, currency, status } = req.body;

    // @ts-ignore
    const sellerCompanyId = req.user?.orgId;
    // @ts-ignore
    const userId = req.user?.id;

    if (!customerName || totalAmount == null) {
      return res.status(400).json({ error: "Missing customerName or totalAmount" });
    }

    const salesOrderId = uuidv4();
    const salesOrderNumber = `SO-${Date.now().toString().slice(-6)}`;

    await pgPool.query(
      `
        INSERT INTO sales_orders (
          id, so_number, seller_company_id, customer_name, customer_email, total_amount,
          currency, status, shipping_address, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        salesOrderId,
        salesOrderNumber,
        sellerCompanyId,
        customerName,
        customerEmail ?? null,
        totalAmount,
        currency ?? "USD",
        status ?? "pending",
        shippingAddress ?? null,
        userId ?? null
      ]
    );

    res.status(201).json({ message: "Sales order created", salesOrderId, salesOrderNumber });
  } catch (error) {
    console.error("Error creating sales order:", error);
    res.status(500).json({ error: "Failed to create sales order" });
  }
};
