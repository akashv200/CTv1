import { randomUUID } from "crypto";
import { pgPool } from "../config/postgres.js";

export interface NotificationRecord {
  id: string;
  channel: string;
  eventType: string;
  domain?: string;
  companyId?: string;
  productId?: string;
  checkpointId?: string;
  severity: string;
  recipientId?: string;
  recipientAddress?: string;
  title: string;
  message: string;
  payload: any;
  deliveryStatus: string;
  createdAt: Date;
}

export async function listNotificationsByOrganization(organizationId: string, limit = 20) {
  const { rows } = await pgPool.query(
    `
      SELECT
        id::text,
        COALESCE(new_value->>'channel', 'in_app') AS channel,
        COALESCE(action, 'system_notification') AS "eventType",
        COALESCE(new_value->>'domain', 'general') AS domain,
        company_id AS "companyId",
        CASE WHEN entity_type = 'product' THEN entity_id END AS "productId",
        CASE WHEN entity_type = 'checkpoint' THEN entity_id END AS "checkpointId",
        COALESCE(new_value->>'severity', 'info') AS severity,
        COALESCE(new_value->>'recipientId', actor_id) AS "recipientId",
        COALESCE(new_value->>'recipientAddress', actor_email) AS "recipientAddress",
        COALESCE(new_value->>'title', INITCAP(REPLACE(action, ':', ' '))) AS title,
        COALESCE(new_value->>'message', 'Activity recorded in the ecosystem.') AS message,
        COALESCE(new_value->'payload', new_value, '{}'::jsonb) AS payload,
        COALESCE(new_value->>'deliveryStatus', 'delivered') AS "deliveryStatus",
        created_at AS "createdAt"
      FROM audit_logs
      WHERE entity_type = 'notification'
        AND (company_id = $1 OR company_id IS NULL)
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [organizationId, limit]
  );
  return rows;
}

export async function createNotification(input: Partial<NotificationRecord>) {
  const { rows } = await pgPool.query(
    `
      INSERT INTO audit_logs (
        actor_id, actor_email, actor_role, action, entity_type, entity_id, new_value, company_id
      )
      VALUES ($1, $2, $3, $4, 'notification', $5, $6::jsonb, $7)
      RETURNING id::text, created_at AS "createdAt"
    `,
    [
      input.recipientId ?? null,
      input.recipientAddress ?? "system@chaintrace.local",
      "system",
      input.eventType ?? "system_notification",
      input.checkpointId ?? input.productId ?? randomUUID(),
      JSON.stringify({
        channel: input.channel ?? "in_app",
        domain: input.domain ?? "general",
        severity: input.severity ?? "info",
        recipientId: input.recipientId ?? null,
        recipientAddress: input.recipientAddress ?? null,
        title: input.title ?? "ChainTrace notification",
        message: input.message ?? "Activity recorded in the ecosystem.",
        payload: input.payload ?? {},
        deliveryStatus: input.deliveryStatus ?? "queued"
      }),
      input.companyId ?? null
    ]
  );
  return rows[0];
}
