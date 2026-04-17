import { randomUUID } from "crypto";
import { pgPool } from "../config/postgres.js";
import { computeAuthenticityScore } from "./aiService.js";
import { registerProductOnChain } from "../blockchain/traceabilityClient.js";
import { createAuditLog } from "./auditService.js";

interface CreateProductInput {
  domain: "agriculture" | "pharmaceutical" | "food" | "ecommerce" | "warehouse";
  productName: string;
  category?: string;
  description?: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  originLocation: string;
  organizationId: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export async function createProduct(input: CreateProductInput) {
  const productId = `CT-${input.domain.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-6)}`;
  const chain = await registerProductOnChain({
    productId,
    domain: input.domain
  });

  const { rows } = await pgPool.query(
    `
      INSERT INTO products (
        id,
        product_id,
        domain,
        product_name,
        category,
        description,
        batch_number,
        quantity,
        unit,
        origin_location,
        company_id,
        metadata,
        blockchain_tx_hash,
        smart_contract_id,
        recorded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14, $15)
      RETURNING
        id,
        product_id AS "productId",
        domain,
        product_name AS "productName",
        category,
        description,
        batch_number AS "batchNumber",
        quantity,
        unit,
        origin_location AS "originLocation",
        company_id AS "organizationId",
        metadata,
        blockchain_tx_hash AS "blockchainTxHash",
        smart_contract_id AS "onChainId",
        metadata->>'authenticity_score' AS "authenticityScore",
        status,
        created_by AS "createdBy",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      randomUUID(),
      productId,
      input.domain,
      input.productName,
      input.category ?? null,
      input.description ?? null,
      input.batchNumber,
      input.quantity,
      input.unit,
      input.originLocation,
      input.organizationId,
      JSON.stringify({ ...input.metadata, authenticity_score: 85 }),
      chain.txHash,
      (chain as any).onChainId ?? null,
      input.createdBy
    ]
  );

  const product = rows[0];

  await createAuditLog({
    actorId: input.createdBy,
    action: "product:created",
    resourceType: "product",
    resourceId: product.productId,
    metadata: { domain: input.domain, productName: input.productName }
  });

  return product;
}

export async function listProductsByOrganization(organizationId?: string, domain?: string) {
  const values: Array<string | number> = [];
  const whereClauses: string[] = [];

  if (organizationId) {
    values.push(organizationId);
    whereClauses.push(`company_id = $${values.length}`);
  }

  if (domain) {
    values.push(domain);
    whereClauses.push(`domain = $${values.length}`);
  }

  const whereFragment = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const { rows } = await pgPool.query(
    `
      SELECT
        id,
        product_id AS "productId",
        domain,
        product_name AS "productName",
        category,
        description,
        batch_number AS "batchNumber",
        quantity,
        unit,
        origin_location AS "originLocation",
        company_id AS "organizationId",
        metadata,
        blockchain_tx_hash AS "blockchainTxHash",
        metadata->>'authenticity_score' AS "authenticityScore",
        status,
        recorded_by AS "createdBy",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM products
      ${whereFragment}
      ORDER BY created_at DESC
      LIMIT 100
    `,
    values
  );

  return rows;
}

export async function getProductJourney(productId: string) {
  const productResult = await pgPool.query(
    `
      SELECT
        id,
        product_id AS "productId",
        domain,
        product_name AS "productName",
        category,
        description,
        batch_number AS "batchNumber",
        quantity,
        unit,
        origin_location AS "originLocation",
        organization_id AS "organizationId",
        metadata,
        certifications,
        blockchain_tx_hash AS "blockchainTxHash",
        authenticity_score AS "authenticityScore",
        status,
        created_by AS "createdBy",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM products
      WHERE product_id = $1
      LIMIT 1
    `,
    [productId]
  );

  const product = productResult.rows[0];
  if (!product) return null;

  const checkpointResult = await pgPool.query(
    `
      SELECT
        id,
        product_id AS "productId",
        checkpoint_type AS "checkpointType",
        location_name AS "location",
        latitude,
        longitude,
        description AS "notes",
        temperature_c AS "temperature",
        humidity_pct AS "humidity",
        shock_g AS "shock",
        iot_payload AS "iotPayload",
        media_urls AS "imageUrls",
        blockchain_tx_hash AS "blockchainTxHash",
        recorded_by AS "addedBy",
        verified_at AS "verified",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM checkpoints
      WHERE product_id = $1
      ORDER BY created_at ASC
    `,
    [productId]
  );

  const checkpoints = checkpointResult.rows;

  const anomalies = checkpoints.filter((checkpoint) =>
    typeof checkpoint.temperature === "number" ? checkpoint.temperature > 8 || checkpoint.temperature < 2 : false
  ).length;

  const authenticityScore = computeAuthenticityScore({
    checkpoints: checkpoints.length,
    anomalies,
    certificateCount: Array.isArray(product.certifications) ? product.certifications.length : 0
  });

  return {
    product: {
      ...product,
      authenticityScore
    },
    checkpoints
  };
}

export async function listLatestCheckpointsByOrganization(organizationId: string, limit = 20) {
  const { rows } = await pgPool.query(
    `
      SELECT
        c.id,
        c.product_id AS "productId",
        c.checkpoint_type AS "checkpointType",
        c.location_name AS "location",
        c.temperature_c AS "temperature",
        c.humidity_pct AS "humidity",
        c.blockchain_tx_hash AS "blockchainTxHash",
        c.created_at AS "createdAt"
      FROM checkpoints c
      INNER JOIN products p ON p.product_id = c.product_id
      WHERE p.company_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2
    `,
    [organizationId, limit]
  );

  return rows;
}
