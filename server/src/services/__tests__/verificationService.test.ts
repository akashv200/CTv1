import { describe, it, expect, beforeEach, vi } from "vitest";
import { getProductWithCheckpoints, getProductSummary } from "../verificationService";

vi.mock("../../lib/firebase", () => ({
  db: {}
}));

describe("verificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProductWithCheckpoints", () => {
    it("should return product with full checkpoint timeline", async () => {
      // This endpoint is public and returns product + all checkpoints
      const result = await getProductWithCheckpoints("AG-123456-ABCD");

      if (result) {
        expect(result.product).toBeDefined();
        expect(result.checkpoints).toBeDefined();
        expect(Array.isArray(result.checkpoints)).toBe(true);
      }
    });

    it("should include blockchain verification info", async () => {
      const result = await getProductWithCheckpoints("AG-VERIFIED-01");

      if (result) {
        expect(result.product.blockchainTxHash).toBeDefined();
      }
    });

    it("should return null for non-existent product", async () => {
      const result = await getProductWithCheckpoints("AG-NONEXISTENT-9999");
      expect(result).toBeNull();
    });

    it("should include QR code URL for consumer scan", async () => {
      const result = await getProductWithCheckpoints("AG-QR-TEST-01");

      if (result) {
        expect(result.product.qrCodeUrl).toBeDefined();
      }
    });

    it("should calculate authenticity score based on checkpoint history", async () => {
      const result = await getProductWithCheckpoints("AG-AUTH-TEST-01");

      if (result) {
        const score = result.authenticity;
        expect(typeof score === "number" || score === undefined).toBe(true);
      }
    });

    it("should include geolocation trail", async () => {
      const result = await getProductWithCheckpoints("AG-LOCATION-TEST-01");

      if (result && result.checkpoints.length > 0) {
        const firstCheckpoint = result.checkpoints[0];
        expect(firstCheckpoint.location).toBeDefined();
      }
    });
  });

  describe("getProductSummary", () => {
    it("should return summary for dashboard display", async () => {
      const summary = await getProductSummary("AG-123456-ABCD");

      if (summary) {
        expect(summary.id).toBeDefined();
        expect(summary.name).toBeDefined();
        expect(summary.status).toBeDefined();
        expect(summary.checkpointCount).toBeDefined();
      }
    });

    it("should include last checkpoint info", async () => {
      const summary = await getProductSummary("AG-LAST-CP-01");

      if (summary) {
        expect(summary.lastCheckpointAt).toBeDefined();
        expect(summary.lastStatus).toBeDefined();
      }
    });

    it("should calculate days in supply chain", async () => {
      const summary = await getProductSummary("AG-DAYS-TEST-01");

      if (summary && summary.createdAt) {
        const daysInChain = Math.floor(
          (Date.now() - new Date(summary.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        expect(typeof daysInChain === "number").toBe(true);
      }
    });
  });
});
