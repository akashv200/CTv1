import type { Request, Response } from "express";
import type { AuthPayload } from "../middleware/auth.js";
import { listDevicesByOrganization, registerDevice } from "../services/iotService.js";

export async function listIoTDevicesHandler(req: Request, res: Response) {
  const user = req.user as AuthPayload | undefined;
  const devices = await listDevicesByOrganization(user?.orgId ?? "org-demo");
  return res.status(200).json(devices);
}

export async function registerDeviceHandler(req: Request, res: Response) {
  const user = req.user as AuthPayload | undefined;
  if (!user || !user.orgId) return res.status(401).json({ error: "Unauthorized" });

  const device = await registerDevice({
    ...req.body,
    companyId: user.orgId
  });
  return res.status(200).json(device);
}

export async function ingestReadingHandler(req: Request, res: Response) {
  const { insertSensorReading, pgPool } = await import("../config/postgres.js");
  const { randomUUID } = await import("crypto");
  const data = req.body;

  // Auto-provision device if first time seen
  if (data.companyId && data.deviceId) {
    await pgPool.query(
      `INSERT INTO iot_devices (id, company_id, device_id, device_name, device_type, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       ON CONFLICT (device_id) DO UPDATE SET updated_at = NOW(), metadata = EXCLUDED.metadata`,
      [randomUUID(), data.companyId, data.deviceId, data.deviceId, data.sensorType ?? "temperature_sensor"]
    );
  }

  await insertSensorReading({
    deviceId: data.deviceId ?? "manual-entry",
    productId: data.productId ?? "",
    companyId: data.companyId,
    sensorType: data.sensorType ?? "temperature",
    value: data.value ?? 0,
    unit: data.unit ?? "°C",
    latitude: data.latitude,
    longitude: data.longitude,
    rawPayload: {
      ...data,
      temperature: data.sensorType === "temperature" ? data.value : undefined,
      humidity: data.sensorType === "humidity" ? data.value : undefined
    }
  });

  req.app.get("io")?.emit("sensor:update", data);
  return res.status(201).json({ ok: true });
}
