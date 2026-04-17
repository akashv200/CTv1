import mqtt from "mqtt";
import { env } from "../config/env.js";

const client = mqtt.connect(env.MQTT_URL);

const sampleProducts = [
  { productId: "CT-PH-3044", domain: "pharmaceutical", baseTemp: 5 },
  { productId: "CT-AG-1001", domain: "agriculture", baseTemp: 24 },
  { productId: "CT-WH-9910", domain: "warehouse", baseTemp: 18 }
];

client.on("connect", () => {
  console.log("[sim] IoT simulator connected");

  setInterval(() => {
    const item = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
    const temperature = Number((item.baseTemp + (Math.random() * 3 - 1.5)).toFixed(2));
    const humidity = Number((35 + Math.random() * 40).toFixed(2));
    const payload = {
      productId: item.productId,
      domain: item.domain,
      temperature,
      humidity,
      timestamp: new Date().toISOString()
    };

    client.publish("chaintrace/sensors/env", JSON.stringify(payload));
    console.log("[sim] published", payload);
  }, 3000);
});
