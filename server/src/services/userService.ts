import { randomUUID } from "crypto";
import { pgPool } from "../config/postgres.js";
import { createAuditLog } from "./auditService.js";

export type UserRole = "super_admin" | "org_admin" | "producer" | "distributor" | "retailer" | "inspector" | "consumer" | "auditor";

export interface UserRecord {
  id: string;
  organizationId: string | null;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  oauthProvider: string | null;
  oauthId: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userColumns = `
  id,
  organization_id AS "organizationId",
  name,
  email,
  password_hash AS "passwordHash",
  role,
  oauth_provider AS "oauthProvider",
  oauth_id AS "oauthId",
  avatar_url AS "avatarUrl",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export async function getUserById(id: string): Promise<UserRecord | null> {
  const { rows } = await pgPool.query<UserRecord>(
    `SELECT ${userColumns} FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateUser(id: string, updates: Partial<Pick<UserRecord, "name" | "avatarUrl">>): Promise<UserRecord | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 2;

  if (updates.name !== undefined) {
    fields.push(`name = $${i++}`);
    values.push(updates.name);
  }
  if (updates.avatarUrl !== undefined) {
    fields.push(`avatar_url = $${i++}`);
    values.push(updates.avatarUrl);
  }

  if (fields.length === 0) return getUserById(id);

  const { rows } = await pgPool.query<UserRecord>(
    `UPDATE users SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $1 RETURNING ${userColumns}`,
    [id, ...values]
  );

  return rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const { rows } = await pgPool.query<UserRecord>(
    `
      SELECT ${userColumns}
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email]
  );

  return rows[0] ?? null;
}

interface CreateUserInput {
  organizationId?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  oauthProvider?: string;
  oauthId?: string;
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const { rows } = await pgPool.query<UserRecord>(
    `
      INSERT INTO users (
        id,
        organization_id,
        name,
        email,
        password_hash,
        role,
        oauth_provider,
        oauth_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING ${userColumns}
    `,
    [
      randomUUID(),
      input.organizationId ?? null,
      input.name,
      input.email,
      input.passwordHash,
      input.role,
      input.oauthProvider ?? null,
      input.oauthId ?? null
    ]
  );

  const user = rows[0];

  await createAuditLog({
    actorId: user.id,
    action: "user:registered",
    resourceType: "user",
    resourceId: user.id,
    metadata: { email: user.email, role: user.role }
  });

  return user;
}

interface FindOrCreateOAuthUserInput {
  email: string;
  name: string;
  oauthProvider: string;
  oauthId: string;
  role?: UserRole;
  organizationId?: string;
}

export async function findOrCreateOAuthUser(input: FindOrCreateOAuthUserInput): Promise<UserRecord> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    if (existing.oauthProvider !== input.oauthProvider || existing.oauthId !== input.oauthId) {
      const { rows } = await pgPool.query<UserRecord>(
        `
          UPDATE users
          SET oauth_provider = $2, oauth_id = $3, updated_at = NOW()
          WHERE id = $1
          RETURNING ${userColumns}
        `,
        [existing.id, input.oauthProvider, input.oauthId]
      );
      return rows[0];
    }
    return existing;
  }

  return createUser({
    email: input.email,
    name: input.name,
    passwordHash: "oauth_login",
    role: input.role ?? "consumer",
    organizationId: input.organizationId,
    oauthProvider: input.oauthProvider,
    oauthId: input.oauthId
  });
}
