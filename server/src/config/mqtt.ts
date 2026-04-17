import mqtt from "mqtt";
import { EventEmitter } from "events";
import { env } from "./env.js";

class MqttManager extends EventEmitter {
  private client: any = null;
  private currentUrl: string = env.MQTT_URL;

  constructor() {
    super();
    this.connect(this.currentUrl);
  }

  public connect(url: string) {
    if (this.client) {
      this.client.end();
    }

    this.currentUrl = url;
    console.log(`[mqtt] Connecting to ${url}...`);

    try {
      this.client = mqtt.connect(url, {
        reconnectPeriod: 10000,
        connectTimeout: 30000,
        keepalive: 60
      });

      this.client.on("connect", () => {
        console.log(`[mqtt] Connected successfully to ${url}`);
        this.client.subscribe("chaintrace/sensors/#");
        this.emit("status", { connected: true, url });
      });

      this.client.on("message", (topic: string, payload: Buffer) => {
        this.emit("message", topic, payload);
      });

      this.client.on("error", (err: any) => {
        // Suppress loud error for public brokers in demo mode
        if (url.includes("hivemq")) {
          console.warn(`[mqtt] Public broker unreachable (hivemq): ${err.message}. Device status will be simulated.`);
        } else {
          console.error(`[mqtt] Connection error at ${url}:`, err.message);
        }
        this.emit("status", { connected: false, url, error: err.message });
      });
    } catch (e) {
      console.error(`[mqtt] Setup failed for ${url}`);
    }
  }

  public switchSimulationMode(enabled: boolean) {
    const targetUrl = enabled ? "mqtt://broker.hivemq.com:1883" : env.MQTT_URL;
    if (this.currentUrl !== targetUrl) {
      this.connect(targetUrl);
    }
  }

  public on(event: string | symbol, listener: (...args: any[]) => void): this {
    if (event === "message" && this.client) {
        // bridge the internal client message to the manager's listeners
    }
    return super.on(event, listener);
  }

  // Proxies for the internal client
  public subscribe(topic: string) { this.client?.subscribe(topic); }
  public publish(topic: string, payload: any) { this.client?.publish(topic, payload); }
}

export const mqttClient = new MqttManager();
