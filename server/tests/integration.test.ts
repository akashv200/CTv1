import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { buildApp } from "../src/app.js";
import request from "supertest";
import { pgPool } from "../src/config/postgres.js";
import { ensurePostgresSchema } from "../src/config/postgres.js";

// Mock environment for testing
const originalEnv = process.env;

beforeAll(async () => {
  // Ensure database schema exists
  await ensurePostgresSchema();
});

afterAll(async () => {
  // Reset environment
  process.env = originalEnv;
  // Close database connection
  await pgPool.end();
});

describe("API Integration Tests", () => {
  let app: any;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe("Health Check", () => {
    it("GET /api/health returns 200 with ok=true", async () => {
      const response = await request(app).get("/api/health");
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
  });

  describe("API Routes Discovery", () => {
    it("GET /api returns 404 (no root endpoint)", async () => {
      const response = await request(app).get("/api");
      expect(response.status).toBe(404);
    });
  });
});
