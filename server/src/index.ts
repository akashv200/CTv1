import http from "http";
import { randomUUID } from "crypto";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { redis } from "./config/redis.js";
import { ensurePostgresSchema, insertSensorReading, pgPool } from "./config/postgres.js";
import { mqttClient } from "./config/mqtt.js";
import { createSocketServer } from "./socket/realtime.js";
import { blockchainEngine } from "./blockchain/blockchainEngine.js";
import { startAutomationEngine } from "./services/automationService.js";
import { generateSupplyChainInsight } from "./services/geminiService.js";
import { db } from "./lib/firebase.js";
import { doc, setDoc } from "firebase/firestore";

async function bootstrap() {
  await blockchainEngine.start();
  await ensurePostgresSchema();
  startAutomationEngine();

  const app = await buildApp();
  const server = http.createServer(app);
  const io = createSocketServer(server);
  app.set("io", io);

  mqttClient.on("message", async (topic, payloadBuffer) => {
    const payload = payloadBuffer.toString();
    await redis.lpush("mqtt:raw", payload);
    await redis.ltrim("mqtt:raw", 0, 300);

      try {
        const data = JSON.parse(payload) as {
          productId: string;
          deviceId?: string;
          companyId?: string;
          sensorType?: string;
          value?: number;
          unit?: string;
          temperature?: number;
          humidity?: number;
          latitude?: number;
          longitude?: number;
        };

        const deviceId = data.deviceId ?? "mqtt-sensor";
        
        // Auto-provision device if first time seen
        if (data.companyId) {
          await pgPool.query(
            `INSERT INTO iot_devices (id, company_id, device_id, device_name, device_type, status)
             VALUES ($1, $2, $3, $4, $5, 'active')
             ON CONFLICT (device_id) DO UPDATE SET updated_at = NOW()`,
            [randomUUID(), data.companyId, deviceId, deviceId, data.sensorType ?? "temperature_sensor"]
          );
        }

        await insertSensorReading({
          deviceId,
          productId: data.productId ?? "",
          companyId: data.companyId,
          sensorType: data.sensorType ?? "temperature",
          value: data.value ?? data.temperature ?? 0,
          unit: data.unit ?? "°C",
          latitude: data.latitude,
          longitude: data.longitude,
          rawPayload: data,
          mqttTopic: "mqtt:raw"
        });
        io.emit("sensor:update", data);

        // AI Insight Trigger (Suspicious temperature drift)
        if (data.productId && data.temperature && (data.temperature > 40 || data.temperature < 0)) {
           generateSupplyChainInsight({
            productName: data.productId,
            domain: "logistics",
            recentCheckpoints: [],
            sensorData: [data]
          }).then(async (insight) => {
            await setDoc(doc(db, "ai_insights", randomUUID()), {
              ...insight,
              productId: data.productId,
              companyId: data.companyId,
              createdAt: new Date().toISOString(),
              isResolved: false
            });
            console.log(`[ai] Critical insight persisted to cloud: ${insight.title}`);
          }).catch(err => console.error("[ai] Failed to generate insight:", err));
        }
      } catch {
        // ignore malformed payloads
      }
  });

  server.listen(env.PORT, () => {
    console.log(`[server] ChainTrace API running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("[server] Failed to start", error);
  process.exit(1);
});
