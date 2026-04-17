import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyProductHandler } from "../../src/controllers/verificationController.js";
import { getProductJourney } from "../../src/services/productService.js";
import type { Request, Response } from "express";

// Mock dependencies
vi.mock("../../src/services/productService.js");

// Helper to create mock response
function createMockResponse() {
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  };
  return mockRes as unknown as Response;
}

describe("VerificationController - Whitebox Testing", () => {
  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {} as Request;
    mockRes = createMockResponse();
  });

  describe("verifyProductHandler() - Code Path Coverage", () => {
    it("should return 404 when product not found", async () => {
      mockReq.params = { productId: "nonexistent" };
      vi.mocked(getProductJourney).mockResolvedValue(null);
      
      await verifyProductHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Product not found" });
    });

    it("should return 200 with verified status when authenticityScore >= 95", async () => {
      const mockJourney = {
        product: {
          id: "prod-1",
          productId: "CT-AG-000001",
          productName: "Organic Rice",
          authenticityScore: 98
        },
        checkpoints: [
          { id: "cp-1", checkpointType: "harvest", location: "Farm A" }
        ]
      } as any;
      
      mockReq.params = { productId: "CT-AG-000001" };
      vi.mocked(getProductJourney).mockResolvedValue(mockJourney);
      
      await verifyProductHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "verified",
        trustScore: 98,
        product: mockJourney.product,
        checkpoints: mockJourney.checkpoints
      });
    });

    it("should return 200 with warning status when authenticityScore >= 85 and < 95", async () => {
      const mockJourney = {
        product: {
          id: "prod-1",
          productId: "CT-AG-000001",
          productName: "Test Product",
          authenticityScore: 90
        },
        checkpoints: []
      } as any;
      
      mockReq.params = { productId: "CT-AG-000001" };
      vi.mocked(getProductJourney).mockResolvedValue(mockJourney);
      
      await verifyProductHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "warning",
        trustScore: 90,
        product: mockJourney.product,
        checkpoints: mockJourney.checkpoints
      });
    });

    it("should return 200 with suspicious status when authenticityScore < 85", async () => {
      const mockJourney = {
        product: {
          id: "prod-1",
          productId: "CT-AG-000001",
          productName: "Test Product",
          authenticityScore: 70
        },
        checkpoints: []
      } as any;
      
      mockReq.params = { productId: "CT-AG-000001" };
      vi.mocked(getProductJourney).mockResolvedValue(mockJourney);
      
      await verifyProductHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "suspicious",
        trustScore: 70,
        product: mockJourney.product,
        checkpoints: mockJourney.checkpoints
      });
    });

    it("should return 200 with suspicious status when authenticityScore is 0", async () => {
      const mockJourney = {
        product: {
          id: "prod-1",
          productId: "CT-AG-000001",
          productName: "Test Product",
          authenticityScore: 0
        },
        checkpoints: []
      } as any;
      
      mockReq.params = { productId: "CT-AG-000001" };
      vi.mocked(getProductJourney).mockResolvedValue(mockJourney);
      
      await verifyProductHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "suspicious",
        trustScore: 0,
        product: mockJourney.product,
        checkpoints: mockJourney.checkpoints
      });
    });

    it("should return 200 with boundary score of 85 as warning", async () => {
      const mockJourney = {
        product: {
          id: "prod-1",
          productId: "CT-AG-000001",
          productName: "Test Product",
          authenticityScore: 85
        },
        checkpoints: []
      } as any;
      
      mockReq.params = { productId: "CT-AG-000001" };
      vi.mocked(getProductJourney).mockResolvedValue(mockJourney);
      
      await verifyProductHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "warning",
        trustScore: 85,
        product: mockJourney.product,
        checkpoints: mockJourney.checkpoints
      });
    });

    it("should return 200 with boundary score of 95 as verified", async () => {
      const mockJourney = {
        product: {
          id: "prod-1",
          productId: "CT-AG-000001",
          productName: "Test Product",
          authenticityScore: 95
        },
        checkpoints: []
      } as any;
      
      mockReq.params = { productId: "CT-AG-000001" };
      vi.mocked(getProductJourney).mockResolvedValue(mockJourney);
      
      await verifyProductHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "verified",
        trustScore: 95,
        product: mockJourney.product,
        checkpoints: mockJourney.checkpoints
      });
    });
  });
});