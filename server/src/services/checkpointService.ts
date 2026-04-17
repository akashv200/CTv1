import { randomUUID } from "crypto";
import { addCheckpointOnChain } from "../blockchain/traceabilityClient.js";
import { evaluateSensorAnomaly } from "./aiService.js";
import { pgPool, insertSensorReading } from "../config/postgres.js";
import { createAuditLog } from "./auditService.js";

interface CreateCheckpointInput {
  productId: string;
  checkpointType: "received" | "quality-check" | "processed" | "dispatched" | "in-transit" | "delivered";
  location: string;
  temperature?: number;
  humidity?: number;
  notes?: string;
  addedBy: string;
  iotPayload?: Record<string, unknown>;
}

export async function createCheckpoint(input: CreateCheckpointInput) {
  // Fetch smart_contract_id for the product
  const { rows: productRows } = await pgPool.query(
    "SELECT smart_contract_id FROM products WHERE product_id = $1",
    [input.productId]
  );
  const onChainId = productRows[0]?.smart_contract_id;

  const chain = await addCheckpointOnChain({
    onChainId: onChainId || 0,
    checkpointType: input.checkpointType
  });

  const anomaly = evaluateSensorAnomaly(input.productId, input.temperature, input.humidity);

  const { rows } = await pgPool.query(
    `
      INSERT INTO checkpoints (
        id,
        product_id,
        checkpoint_type,
        location,
        temperature,
        humidity,
        notes,
        iot_payload,
        blockchain_tx_hash,
        added_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
      RETURNING
        id,
        product_id AS "productId",
        checkpoint_type AS "checkpointType",
        location,
        notes,
        temperature,
        humidity,
        iot_payload AS "iotPayload",
        blockchain_tx_hash AS "blockchainTxHash",
        added_by AS "addedBy",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      randomUUID(),
      input.productId,
      input.checkpointType,
      input.location,
      input.temperature ?? null,
      input.humidity ?? null,
      input.notes ?? null,
      JSON.stringify({
        ...(input.iotPayload ?? {}),
        anomaly
      }),
      chain.txHash,
      input.addedBy
    ]
  );

  const checkpoint = rows[0];

  if (typeof input.temperature === "number" || typeof input.humidity === "number") {
    await insertSensorReading({
      deviceId: "checkpoint-sensor",
      productId: input.productId,
      sensorType: typeof input.temperature === "number" ? "temperature" : "humidity",
      value: input.temperature ?? input.humidity ?? 0,
      unit: input.temperature !== undefined ? "°C" : "%",
      rawPayload: { temperature: input.temperature, humidity: input.humidity }
    });
  }

  await createAuditLog({
    actorId: checkpoint.addedBy,
    action: "checkpoint:added",
    resourceType: "checkpoint",
    resourceId: checkpoint.id,
    metadata: { productId: checkpoint.productId, type: checkpoint.checkpointType }
  });

  return checkpoint;
}

export async function listLatestCheckpointsByOrganization(organizationId?: string, limit = 20) {
  const values: any[] = [limit];
  let whereFragment = "";

  if (organizationId) {
    values.push(organizationId);
    whereFragment = `WHERE p.company_id = $2`;
  }

  const { rows } = await pgPool.query(
    `
      SELECT
        c.id,
        c.product_id AS "productId",
        c.checkpoint_type AS "checkpointType",
        c.location,
        c.temperature,
        c.humidity,
        c.blockchain_tx_hash AS "blockchainTxHash",
        c.created_at AS "createdAt"
      FROM checkpoints c
      INNER JOIN products p ON p.product_id = c.product_id
      ${whereFragment}
      ORDER BY c.created_at DESC
      LIMIT $1
    `,
    values
  );

  return rows;
}
