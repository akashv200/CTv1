import { describe, expect, it } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";

describe("GET /api/health", () => {
  it("returns service status", async () => {
    const app = await buildApp();
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });
});
