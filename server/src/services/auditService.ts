import { pgPool } from "../config/postgres.js";

interface CreateAuditLogInput {
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  companyId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createAuditLog(input: CreateAuditLogInput) {
  try {
    const newValue = input.newValue ?? input.metadata ?? null;
    await pgPool.query(
      `
        INSERT INTO audit_logs (
          actor_id, actor_email, actor_role, action, entity_type, entity_id,
          old_value, new_value, company_id, ip_address, user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11)
      `,
      [
        input.actorId ?? null,
        input.actorEmail ?? "system@chaintrace.local",
        input.actorRole ?? "system",
        input.action,
        input.resourceType,
        input.resourceId,
        input.oldValue ? JSON.stringify(input.oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        input.companyId ?? null,
        input.ipAddress ?? null,
        input.userAgent ?? null
      ]
    );
  } catch (error) {
    console.error(`[AuditService] Failed to create audit log for ${input.action}`, error);
    // Don't fail the primary operation just because auditing failed.
  }
}

export async function listAuditLogs(resourceId?: string, limit = 50) {
  const whereClauses = [];
  const values = [];

  if (resourceId) {
    values.push(resourceId);
    whereClauses.push(`entity_id = $${values.length}`);
  }

  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const { rows } = await pgPool.query(
    `
      SELECT
        id,
        actor_id AS "actorId",
        actor_email AS "actorEmail",
        actor_role AS "actorRole",
        action,
        entity_type AS "resourceType",
        entity_id AS "resourceId",
        old_value AS "oldValue",
        new_value AS "newValue",
        COALESCE(new_value, '{}'::jsonb) AS metadata,
        company_id AS "companyId",
        ip_address AS "ipAddress",
        user_agent AS "userAgent",
        created_at AS "createdAt"
      FROM audit_logs
      ${where}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1}
    `,
    [...values, limit]
  );

  return rows;
}
