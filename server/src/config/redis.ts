import Redis from "ioredis";
import { env } from "./env.js";

const createRedisClient = () => {
  try {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1, // Minimize retries if service is missing
      retryStrategy: (times) => {
        if (times > 1) return null; // stop retrying after 1 attempt
        return 2000;
      }
    });

    client.on("connect", () => console.log("[redis] Connected"));
    client.on("error", (error) => {
      if (times_hit === 0) {
        console.warn("[redis] Service not found at " + env.REDIS_URL + ". Falling back to dummy mode.");
        times_hit++;
      }
    });
    return client;
  } catch {
    return createDummyRedis();
  }
};

let times_hit = 0;

function createDummyRedis() {
  return {
    on: () => {},
    lpush: async () => 1,
    ltrim: async () => "OK",
    set: async () => "OK",
    get: async () => null,
    del: async () => 1,
    status: "failed"
  } as any;
}

export const redis = createRedisClient();
