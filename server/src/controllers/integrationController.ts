import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { pgPool } from "../config/postgres.js";

function getConnectorScope(req: Request) {
  const role = req.user?.role;
  const companyId = req.user?.orgId ?? null;
  const isSuperAdmin = role === "super_admin";
  return { role, companyId, isSuperAdmin };
}

export async function listConnectors(req: Request, res: Response) {
  try {
    const { companyId, isSuperAdmin } = getConnectorScope(req);
    const { scope } = req.query;

    if (isSuperAdmin && (scope === "all" || !companyId)) {
      const result = await pgPool.query(
        `
          SELECT integration_connectors.*, companies.company_name
          FROM integration_connectors
          LEFT JOIN companies ON companies.id = integration_connectors.company_id
          ORDER BY integration_connectors.updated_at DESC
        `
      );
      return res.status(200).json(result.rows);
    }

    if (!companyId && !isSuperAdmin) {
      return res.status(403).json({ error: "Organization access is required for connectors." });
    }

    const result = await pgPool.query(
      `
        SELECT integration_connectors.*, companies.company_name
        FROM integration_connectors
        LEFT JOIN companies ON companies.id = integration_connectors.company_id
        WHERE integration_connectors.company_id = $1
        ORDER BY integration_connectors.updated_at DESC
      `,
      [companyId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching connectors:", error);
    return res.status(500).json({ error: "Failed to fetch connectors" });
  }
}

export async function upsertConnector(req: Request, res: Response) {
  try {
    const { companyId, isSuperAdmin } = getConnectorScope(req);
    const {
      id,
      provider,
      connectorType,
      displayName,
      status,
      baseUrl,
      authType,
      credentials,
      settings,
      metadata,
      companyId: requestedCompanyId
    } = req.body;

    if (!provider || !displayName) {
      return res.status(400).json({ error: "Missing provider or displayName" });
    }

    const targetCompanyId = isSuperAdmin ? requestedCompanyId ?? companyId ?? null : companyId;

    if (!targetCompanyId && !isSuperAdmin) {
      return res.status(403).json({ error: "Organization access is required for connectors." });
    }

    if (id) {
      await pgPool.query(
        `
          UPDATE integration_connectors
          SET provider = $2,
              connector_type = $3,
              display_name = $4,
              status = $5,
              base_url = $6,
              auth_type = $7,
              credentials = $8,
              settings = $9,
              metadata = $10,
              updated_by = $11,
              updated_at = NOW()
          WHERE id = $1
        `,
        [
          id,
          provider,
          connectorType ?? "erp",
          displayName,
          status ?? "configured",
          baseUrl ?? null,
          authType ?? "api_key",
          credentials ?? {},
          settings ?? {},
          metadata ?? {},
          req.user?.id ?? req.user?.sub ?? null
        ]
      );

      return res.status(200).json({ message: "Connector updated", id });
    }

    const connectorId = uuidv4();
    await pgPool.query(
      `
        INSERT INTO integration_connectors (
          id, company_id, provider, connector_type, display_name, status, base_url, auth_type,
          credentials, settings, metadata, created_by, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `,
      [
        connectorId,
        targetCompanyId,
        provider,
        connectorType ?? "erp",
        displayName,
        status ?? "configured",
        baseUrl ?? null,
        authType ?? "api_key",
        credentials ?? {},
        settings ?? {},
        metadata ?? {},
        req.user?.id ?? req.user?.sub ?? null,
        req.user?.id ?? req.user?.sub ?? null
      ]
    );

    return res.status(201).json({ message: "Connector created", id: connectorId });
  } catch (error) {
    console.error("Error saving connector:", error);
    return res.status(500).json({ error: "Failed to save connector" });
  }
}

export async function testConnector(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pgPool.query(
      `SELECT * FROM integration_connectors WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Connector not found" });
    }

    const connector = result.rows[0];
    const credentials = connector.credentials ?? {};
    const hasCredentials = Object.keys(credentials).length > 0;
    const passed = Boolean(connector.base_url || connector.connector_type === "webhook" || hasCredentials);
    const lastError = passed ? null : "Connector is missing base URL or credentials.";

    await pgPool.query(
      `
        UPDATE integration_connectors
        SET last_test_at = NOW(),
            last_test_status = $2,
            last_error = $3,
            status = $4,
            updated_at = NOW(),
            updated_by = $5
        WHERE id = $1
      `,
      [
        id,
        passed ? "success" : "failed",
        lastError,
        passed ? "active" : "error",
        req.user?.id ?? req.user?.sub ?? null
      ]
    );

    return res.status(200).json({
      ok: passed,
      connectorId: id,
      provider: connector.provider,
      message: passed ? "Connector test passed" : lastError
    });
  } catch (error) {
    console.error("Error testing connector:", error);
    return res.status(500).json({ error: "Failed to test connector" });
  }
}
