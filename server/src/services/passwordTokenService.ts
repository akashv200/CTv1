import { createHash, randomBytes, randomUUID } from "crypto";
import { env } from "../config/env.js";
import { pgPool } from "../config/postgres.js";
import { createNotification } from "./notificationService.js";
import { createAuditLog } from "./auditService.js";
import { hashPassword } from "../utils/password.js";

export type PasswordTokenPurpose = "invite_setup" | "password_reset";

interface IssuePasswordTokenInput {
  userId: string;
  email: string;
  purpose: PasswordTokenPurpose;
  companyId?: string | null;
  createdBy?: string | null;
  recipientName?: string | null;
  companyName?: string | null;
  ttlMinutes?: number;
}

function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

function buildActionUrl(rawToken: string) {
  return `${env.APP_BASE_URL.replace(/\/$/, "")}/password/complete?token=${rawToken}`;
}

function getDefaultTtlMinutes(purpose: PasswordTokenPurpose) {
  return purpose === "invite_setup"
    ? env.INVITE_TOKEN_TTL_HOURS * 60
    : env.PASSWORD_RESET_TTL_MINUTES;
}

function getNotificationCopy(purpose: PasswordTokenPurpose, recipientName?: string | null, companyName?: string | null) {
  if (purpose === "invite_setup") {
    return {
      title: "Your ChainTrace business account is ready",
      message: `Hello ${recipientName ?? "there"}, your organization${companyName ? ` ${companyName}` : ""} has been approved. Use the invite link to set your password and start using ChainTrace.`
    };
  }

  return {
    title: "Reset your ChainTrace password",
    message: `Hello ${recipientName ?? "there"}, we received a request to reset your ChainTrace password. Use the link below to choose a new one.`
  };
}

export async function issuePasswordActionToken(input: IssuePasswordTokenInput) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const ttlMinutes = input.ttlMinutes ?? getDefaultTtlMinutes(input.purpose);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await pgPool.query(
    `
      UPDATE password_reset_tokens
      SET consumed_at = NOW()
      WHERE user_id = $1
        AND purpose = $2
        AND consumed_at IS NULL
        AND expires_at > NOW()
    `,
    [input.userId, input.purpose]
  );

  await pgPool.query(
    `
      INSERT INTO password_reset_tokens (
        id, user_id, email, token_hash, purpose, expires_at, created_by, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    `,
    [
      randomUUID(),
      input.userId,
      input.email,
      tokenHash,
      input.purpose,
      expiresAt,
      input.createdBy ?? null,
      JSON.stringify({
        issuedFor: input.purpose,
        companyName: input.companyName ?? null
      })
    ]
  );

  const actionUrl = buildActionUrl(rawToken);
  const notification = getNotificationCopy(input.purpose, input.recipientName, input.companyName);

  await createNotification({
    channel: "email",
    eventType: input.purpose === "invite_setup" ? "auth:invite" : "auth:password_reset",
    companyId: input.companyId ?? undefined,
    recipientId: input.userId,
    recipientAddress: input.email,
    severity: "info",
    title: notification.title,
    message: notification.message,
    payload: {
      actionUrl,
      emailFrom: env.EMAIL_FROM,
      expiresAt: expiresAt.toISOString(),
      purpose: input.purpose
    },
    deliveryStatus: "sent"
  });

  console.log(`[mail] ${input.purpose} link for ${input.email}: ${actionUrl}`);

  await createAuditLog({
    actorId: input.createdBy ?? input.userId,
    action: input.purpose === "invite_setup" ? "auth:invite_issued" : "auth:password_reset_issued",
    resourceType: "user",
    resourceId: input.userId,
    metadata: {
      email: input.email,
      expiresAt: expiresAt.toISOString(),
      purpose: input.purpose
    }
  });

  return {
    actionUrl,
    expiresAt: expiresAt.toISOString()
  };
}

export async function getPasswordTokenInfo(rawToken: string, expectedPurpose?: PasswordTokenPurpose) {
  const tokenHash = hashToken(rawToken);
  const { rows } = await pgPool.query(
    `
      SELECT
        t.id,
        t.user_id AS "userId",
        t.email,
        t.purpose,
        t.expires_at AS "expiresAt",
        t.consumed_at AS "consumedAt",
        u.name,
        u.role,
        u.organization_id AS "organizationId",
        c.company_name AS "companyName"
      FROM password_reset_tokens t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN companies c ON c.id = u.organization_id
      WHERE t.token_hash = $1
      LIMIT 1
    `,
    [tokenHash]
  );

  const token = rows[0];
  if (!token) return null;
  if (expectedPurpose && token.purpose !== expectedPurpose) return null;
  if (token.consumedAt) return null;
  if (new Date(token.expiresAt).getTime() <= Date.now()) return null;

  return token as {
    userId: string;
    email: string;
    purpose: PasswordTokenPurpose;
    expiresAt: string;
    name: string;
    role: string;
    organizationId: string | null;
    companyName?: string | null;
  };
}

export async function completePasswordAction(rawToken: string, password: string) {
  const token = await getPasswordTokenInfo(rawToken);
  if (!token) {
    throw new Error("Token is invalid or expired");
  }

  const passwordHash = await hashPassword(password);
  const tokenHash = hashToken(rawToken);
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        UPDATE users
        SET password_hash = $2, updated_at = NOW()
        WHERE id = $1
      `,
      [token.userId, passwordHash]
    );

    await client.query(
      `
        UPDATE password_reset_tokens
        SET consumed_at = NOW()
        WHERE token_hash = $1
      `,
      [tokenHash]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  await createAuditLog({
    actorId: token.userId,
    action: token.purpose === "invite_setup" ? "auth:invite_completed" : "auth:password_reset_completed",
    resourceType: "user",
    resourceId: token.userId,
    metadata: {
      email: token.email,
      purpose: token.purpose
    }
  });

  return token;
}
