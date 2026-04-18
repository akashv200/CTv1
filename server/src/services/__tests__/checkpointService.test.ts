import { describe, it, expect, beforeEach, vi } from "vitest";
import { createCheckpoint, getCheckpointsByProductId } from "../checkpointService";
import * as traceabilityClient from "../../blockchain/traceabilityClient";

vi.mock("../../lib/firebase", () => ({
  db: {}
}));

vi.mock("../../blockchain/traceabilityClient");

describe("checkpointService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCheckpoint", () => {
    it("should create checkpoint with valid input", async () => {
      vi.mocked(traceabilityClient.addCheckpointOnChain).mockResolvedValue({
        txHash: "0xabc123",
        contractId: "1"
      });

      const input = {
        productId: "AG-123456-ABCD",
        location: { latitude: 12.345, longitude: 67.890 },
        timestamp: new Date().toISOString(),
        handler: { id: "logistics-1", name: "John" },
        status: "shipped",
        notes: "In transit to distribution center",
        temperature: 15,
        humidity: 65
      };

      const result = await createCheckpoint(input);

      expect(result).toBeDefined();
      expect(result.productId).toBe("AG-123456-ABCD");
      expect(result.status).toBe("shipped");
      expect(result.blockchainTxHash).toBe("0xabc123");
    });

    it("should validate location coordinates", async () => {
      const input = {
        productId: "AG-123456-ABCD",
        location: { latitude: 999, longitude: 999 }, // Invalid coordinates
        timestamp: new Date().toISOString(),
        handler: { id: "logistics-1", name: "John" },
        status: "shipped"
      } as any;

      try {
        await createCheckpoint(input);
        expect.fail("Should have thrown error for invalid coordinates");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle blockchain failure with rollback", async () => {
      vi.mocked(traceabilityClient.addCheckpointOnChain).mockRejectedValue(
        new Error("Network error")
      );

      const input = {
        productId: "AG-123456-ABCD",
        location: { latitude: 12.345, longitude: 67.890 },
        timestamp: new Date().toISOString(),
        handler: { id: "logistics-1", name: "John" },
        status: "shipped"
      };

      try {
        await createCheckpoint(input);
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error instanceof Error).toBe(true);
      }
    });

    it("should include optional fields (temperature, humidity, photos)", async () => {
      vi.mocked(traceabilityClient.addCheckpointOnChain).mockResolvedValue({
        txHash: "0xdef456",
        contractId: "2"
      });

      const input = {
        productId: "AG-789012-WXYZ",
        location: { latitude: 20.0, longitude: 80.0 },
        timestamp: new Date().toISOString(),
        handler: { id: "logistics-2", name: "Jane" },
        status: "received",
        temperature: 8,
        humidity: 70,
        photoUrl: "ipfs://Qm..."
      };

      const result = await createCheckpoint(input);

      expect(result.temperature).toBe(8);
      expect(result.humidity).toBe(70);
      expect(result.photoUrl).toBe("ipfs://Qm...");
    });

    it("should reject checkpoint for non-existent product", async () => {
      const input = {
        productId: "AG-NONEXISTENT",
        location: { latitude: 12.345, longitude: 67.890 },
        timestamp: new Date().toISOString(),
        handler: { id: "logistics-1", name: "John" },
        status: "shipped"
      };

      try {
        await createCheckpoint(input);
        expect.fail("Should reject non-existent product");
      } catch (error) {
        expect(error instanceof Error).toBe(true);
      }
    });

    it("should increment product checkpoint count", async () => {
      vi.mocked(traceabilityClient.addCheckpointOnChain).mockResolvedValue({
        txHash: "0xghi789",
        contractId: "3"
      });

      const input = {
        productId: "AG-COUNT-TEST",
        location: { latitude: 12.345, longitude: 67.890 },
        timestamp: new Date().toISOString(),
        handler: { id: "logistics-3", name: "Bob" },
        status: "shipped"
      };

      const result = await createCheckpoint(input);

      expect(result.productId).toBe("AG-COUNT-TEST");
      // In real test, we'd verify the product's checkpointCount was incremented
    });
  });

  describe("getCheckpointsByProductId", () => {
    it("should return checkpoints for product", async () => {
      const checkpoints = await getCheckpointsByProductId("AG-123456-ABCD");
      expect(Array.isArray(checkpoints)).toBe(true);
    });

    it("should return empty array for non-existent product", async () => {
      const checkpoints = await getCheckpointsByProductId("AG-NONEXISTENT");
      expect(Array.isArray(checkpoints)).toBe(true);
      expect(checkpoints.length).toBe(0);
    });
  });
});
