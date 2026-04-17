import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(8).default("change_this_secret"),
  JWT_EXPIRY: z.string().default("1h"),
  REFRESH_EXPIRY: z.string().default("7d"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  APP_BASE_URL: z.string().default("http://localhost:5173"),
  EVM_RPC_URL: z.string().default("http://127.0.0.1:7545"),
  CHAIN_ID: z.coerce.number().default(5777),
  CHAIN_NAME: z.string().default("ganache-local"),
  TRACEABILITY_CONTRACT: z.string().optional(),
  EVM_PRIVATE_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  PG_URL: z.string().default("postgresql://postgres:postgres@127.0.0.1:5432/chaintrace"),
  PG_SSL: z
    .preprocess((value) => {
      if (typeof value === "string") {
        return ["1", "true", "yes", "on"].includes(value.toLowerCase());
      }
      return value;
    }, z.boolean())
    .default(false),
  MQTT_URL: z.string().default("mqtt://localhost:1883"),
  EMAIL_FROM: z.string().default("noreply@chaintrace.io"),
  INVITE_TOKEN_TTL_HOURS: z.coerce.number().default(72),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().default(30),
  INTEGRATION_SYNC_INTERVAL_MS: z.coerce.number().default(0),
  GEMINI_API_KEY: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

export const env = parsed.data;
