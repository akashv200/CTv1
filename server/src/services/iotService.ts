import { pgPool } from "../config/postgres.js";
import { randomUUID } from "crypto";

export interface IoTDeviceRecord {
  id: string;
  companyId: string;
  deviceType: string;
  externalId: string;
  status: string;
  lastReading?: any;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export async function listDevicesByOrganization(orgId: string) {
  const { rows } = await pgPool.query(
    `
      SELECT
        id,
        company_id AS "companyId",
        device_type AS "deviceType",
        device_id AS "externalId",
        status,
        COALESCE(metadata->'lastReading', '{}'::jsonb) AS "lastReading",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM iot_devices
      WHERE company_id = $1
    `,
    [orgId]
  );
  return rows;
}

export async function registerDevice(input: Partial<IoTDeviceRecord>) {
  const { rows } = await pgPool.query(
    `
      INSERT INTO iot_devices (id, company_id, domain, device_id, device_name, device_type, status, metadata, mqtt_topic)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
      RETURNING id, created_at AS "createdAt"
    `,
    [
      randomUUID(),
      input.companyId,
      (input.metadata as any)?.domain ?? "warehouse",
      input.externalId ?? `DEV-${Date.now()}`,
      input.externalId ?? "IoT Device",
      input.deviceType ?? "temperature_sensor",
      "active",
      JSON.stringify(input.metadata ?? {}),
      `tracking/${input.externalId || 'default'}`
    ]
  );
  return rows[0];
}
