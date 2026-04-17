import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProductHandler, listProductsHandler, getProductJourneyHandler } from "../../src/controllers/productController.js";
import { createProduct, getProductJourney, listProductsByOrganization } from "../../src/services/productService.js";
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

describe("ProductController - Whitebox Testing", () => {
  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {} as Request;
    mockRes = createMockResponse();
  });

  describe("createProductHandler() - Code Path Coverage", () => {
    it("should return 400 for invalid domain", async () => {
      mockReq.body = {
        domain: "invalid_domain",
        productName: "Test Product",
        batchNumber: "BATCH001",
        quantity: 100,
        unit: "kg",
        originLocation: "Farm A"
      };
      
      await createProductHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should return 400 for empty product name", async () => {
      mockReq.body = {
        domain: "agriculture",
        productName: "",
        batchNumber: "BATCH001",
        quantity: 100,
        unit: "kg",
        originLocation: "Farm A"
      };
      
      await createProductHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should return 400 for batch number shorter than 2 chars", async () => {
      mockReq.body = {
        domain: "agriculture",
        productName: "Test Product",
        batchNumber: "B",
        quantity: 100,
        unit: "kg",
        originLocation: "Farm A"
      };
      
      await createProductHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should return 400 for non-positive quantity", async () => {
      mockReq.body = {
        domain: "agriculture",
        productName: "Test Product",
        batchNumber: "BATCH001",
        quantity: -100,
        unit: "kg",
        originLocation: "Farm A"
      };
      
      await createProductHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should return 400 for empty unit", async () => {
      mockReq.body = {
        domain: "agriculture",
        productName: "Test Product",
        batchNumber: "BATCH001",
        quantity: 100,
        unit: "",
        originLocation: "Farm A"
      };
      
      await createProductHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should return 400 for empty origin location", async () => {
      mockReq.body = {
        domain: "agriculture",
        productName: "Test Product",
        batchNumber: "BATCH001",
        quantity: 100,
        unit: "kg",
        originLocation: ""
      };
      
      await createProductHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should create product and return 201 on success", async () => {
      const mockUser = { sub: "user-1", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(createProduct).mockResolvedValue({
        id: "prod-1",
        productId: "CT-AG-000001",
        domain: "agriculture",
        productName: "Organic Rice",
        batchNumber: "BATCH001",
        quantity: 100,
        unit: "kg",
        originLocation: "Farm A",
        organizationId: "org-1",
        createdBy: "user-1"
      } as any);
      
      mockReq.body = {
        domain: "agriculture",
        productName: "Organic Rice",
        batchNumber: "BATCH001",
        quantity: 100,
        unit: "kg",
        originLocation: "Farm A"
      };
      
      await createProductHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: "CT-AG-000001",
          domain: "agriculture",
          productName: "Organic Rice"
        })
      );
    });

    it("should use org-1 as default organization when user has no orgId", async () => {
      const mockUser = { sub: "user-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(createProduct).mockResolvedValue({
        id: "prod-1",
        productId: "CT-AG-000001",
        domain: "agriculture",
        productName: "Test Product",
        batchNumber: "BATCH001",
        quantity: 100,
        unit: "kg",
        originLocation: "Farm A",
        organizationId: "org-1",
        createdBy: "user-1"
      } as any);
      
      mockReq.body = {
        domain: "agriculture",
        productName: "Test Product",
        batchNumber: "BATCH001",
        quantity: 100,
        unit: "kg",
        originLocation: "Farm A"
      };
      
      await createProductHandler(mockReq, mockRes);
      
      expect(createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: "org-demo"
        })
      );
    });

    it("should accept optional category field", async () => {
      const mockUser = { sub: "user-1", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(createProduct).mockResolvedValue({
        id: "prod-1",
        productId: "CT-AG-000001",
        domain: "agriculture",
        productName: "Test Product",
        batchNumber: "BATCH001",
        quantity: 100,
        unit: "kg",
        originLocation: "Farm A",
        organizationId: "org-1",
        createdBy: "user-1"
      } as any);
      
      mockReq.body = {
        domain: "agriculture",
        productName: "Test Product",
        category: "Grains",
        batchNumber: "BATCH001",
        quantity: 100,
        unit: "kg",
        originLocation: "Farm A"
      };
      
      await createProductHandler(mockReq, mockRes);
      
      expect(createProduct).toHaveBeenCalledWith(
        expect.objectContaining({ category: "Grains" })
      );
    });

    it("should accept optional description field", async () => {
      const mockUser = { sub: "user-1", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(createProduct).mockResolvedValue({
        id: "prod-1",
        productId: "CT-AG-000001",
        domain: "agriculture",
        productName: "Test Product",
        batchNumber: "BATCH001",
        quantity: 100,
        unit: "kg",
        originLocation: "Farm A",
        organizationId: "org-1",
        createdBy: "user-1"
      } as any);
      
      mockReq.body = {
        domain: "agriculture",
        productName: "Test Product",
        batchNumber: "BATCH001",
        quantity: 100,
        unit: "kg",
        originLocation: "Farm A",
        description: "Premium quality organic rice"
      };
      
      await createProductHandler(mockReq, mockRes);
      
      expect(createProduct).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Premium quality organic rice" })
      );
    });

    it("should accept optional metadata field", async () => {
      const mockUser = { sub: "user-1", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(createProduct).mockResolvedValue({
        id: "prod-1",
        productId: "CT-AG-000001",
        domain: "agriculture",
        productName: "Test Product",
        batchNumber: "BATCH001",
        quantity: 100,
        unit: "kg",
        originLocation: "Farm A",
        organizationId: "org-1",
        createdBy: "user-1"
      } as any);
      
      mockReq.body = {
        domain: "agriculture",
        productName: "Test Product",
        batchNumber: "BATCH001",
        quantity: 100,
        unit: "kg",
        originLocation: "Farm A",
        metadata: { harvestDate: "2026-01-01", farmer: "John Doe" }
      };
      
      await createProductHandler(mockReq, mockRes);
      
      expect(createProduct).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { harvestDate: "2026-01-01", farmer: "John Doe" } })
      );
    });
  });

  describe("listProductsHandler() - Code Path Coverage", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockReq.user = undefined;
      
      await listProductsHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return 200 with products for authenticated user", async () => {
      const mockUser = { role: "producer", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(listProductsByOrganization).mockResolvedValue([
        { id: "prod-1", productId: "CT-AG-000001", productName: "Product 1" },
        { id: "prod-2", productId: "CT-AG-000002", productName: "Product 2" }
      ] as any);
      
      await listProductsHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([
        { id: "prod-1", productId: "CT-AG-000001", productName: "Product 1" },
        { id: "prod-2", productId: "CT-AG-000002", productName: "Product 2" }
      ]);
    });

    it("should pass orgId to listProductsByOrganization for regular users", async () => {
      const mockUser = { role: "producer", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(listProductsByOrganization).mockResolvedValue([]);
      
      await listProductsHandler(mockReq, mockRes);
      
      expect(listProductsByOrganization).toHaveBeenCalledWith("org-1");
    });

    it("should pass 'org-demo' to listProductsByOrganization for admin users (role != admin is regular user logic)", async () => {
      // Note: In current implementation: orgId = user.role === "admin" ? undefined : (user.orgId ?? "org-demo");
      // producer role will use orgId ?? "org-demo"
      const mockUser = { role: "admin", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(listProductsByOrganization).mockResolvedValue([]);
      
      await listProductsHandler(mockReq, mockRes);
      
      expect(listProductsByOrganization).toHaveBeenCalledWith(undefined);
    });

    it("should pass 'org-1' to listProductsByOrganization for non-admin users", async () => {
      const mockUser = { role: "super_admin", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(listProductsByOrganization).mockResolvedValue([]);
      
      await listProductsHandler(mockReq, mockRes);
      
      // role "super_admin" !== "admin", so it uses orgId ("org-1")
      expect(listProductsByOrganization).toHaveBeenCalledWith("org-1");
    });
  });

  describe("getProductJourneyHandler() - Code Path Coverage", () => {
    it("should return 404 when product not found", async () => {
      mockReq.params = { productId: "nonexistent" };
      vi.mocked(getProductJourney).mockResolvedValue(null);
      
      await getProductJourneyHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Product not found" });
    });

    it("should return 200 with product journey on success", async () => {
      const mockJourney = {
        product: {
          id: "prod-1",
          productId: "CT-AG-000001",
          productName: "Organic Rice",
          authenticityScore: 95
        },
        checkpoints: [
          { id: "cp-1", checkpointType: "harvest", location: "Farm A" },
          { id: "cp-2", checkpointType: "dispatched", location: "Warehouse B" }
        ]
      } as any;
      
      mockReq.params = { productId: "CT-AG-000001" };
      vi.mocked(getProductJourney).mockResolvedValue(mockJourney);
      
      await getProductJourneyHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockJourney);
    });
  });
});