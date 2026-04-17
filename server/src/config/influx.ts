import { ensurePostgresSchema, insertSensorReading } from "./postgres.js";

// Backward-compatibility shim: historical Influx calls are routed into PostgreSQL.
type WritePoint = {
  tags?: {
    productId?: string;
    deviceId?: string;
    sensorType?: string;
    companyId?: string;
    mqttTopic?: string;
  };
  fields?: {
    temperature?: number;
    humidity?: number;
    value?: number;
    unit?: string;
    latitude?: number;
    longitude?: number;
  };
};

export const influx = {
  writePoints: async (points: WritePoint[]) => {
    for (const point of points) {
      await insertSensorReading({
        deviceId: point.tags?.deviceId ?? "unknown",
        productId: point.tags?.productId ?? "",
        companyId: point.tags?.companyId,
        sensorType: point.tags?.sensorType ?? "temperature",
        value: point.fields?.value ?? point.fields?.temperature ?? 0,
        unit: point.fields?.unit ?? "°C",
        latitude: point.fields?.latitude,
        longitude: point.fields?.longitude,
        rawPayload: point.fields,
        mqttTopic: point.tags?.mqttTopic
      });
    }
  }
};

export async function ensureInfluxDatabase() {
  await ensurePostgresSchema();
}
