import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMyOrganizationHandler, updateMyOrganizationHandler } from "../../src/controllers/organizationController.js";
import { getCompanyById, upsertCompany, getDomainSpecificData } from "../../src/services/organizationService.js";
import type { Request, Response } from "express";

// Mock dependencies
vi.mock("../../src/services/organizationService.js");

// Helper to create mock response
function createMockResponse() {
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  };
  return mockRes as unknown as Response;
}

describe("OrganizationController - Whitebox Testing", () => {
  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {} as Request;
    mockRes = createMockResponse();
  });

  describe("getMyOrganizationHandler() - Code Path Coverage", () => {
    it("should return 200 with null when user has no orgId", async () => {
      const mockUser = { sub: "user-1" };
      mockReq.user = mockUser as any;
      
      await getMyOrganizationHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(null);
    });

    it("should return 200 with null when user has orgId but no company exists", async () => {
      const mockUser = { sub: "user-1", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(getCompanyById).mockResolvedValue(null);
      
      await getMyOrganizationHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(null);
    });

    it("should return 200 with company data when company exists", async () => {
      const mockUser = { sub: "user-1", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      const mockCompany = {
        id: "org-1",
        companyCode: "ACME",
        domain: "agriculture",
        companyName: "Acme Corp",
        status: "active",
        metadata: {}
      } as any;
      
      vi.mocked(getCompanyById).mockResolvedValue(mockCompany);
      vi.mocked(getDomainSpecificData).mockResolvedValue({
        farmCount: 5,
        totalProduction: 1000
      } as any);
      
      await getMyOrganizationHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          companyCode: "ACME",
          domain: "agriculture",
          companyName: "Acme Corp",
          domainSpecific: {
            farmCount: 5,
            totalProduction: 1000
          }
        })
      );
    });
  });

  describe("updateMyOrganizationHandler() - Code Path Coverage", () => {
    it("should return 401 when user has no orgId", async () => {
      const mockUser = { sub: "user-1" };
      mockReq.user = mockUser as any;
      
      await updateMyOrganizationHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return 400 for invalid companyCode", async () => {
      const mockUser = { sub: "user-1", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      mockReq.body = {
        companyCode: "A",
        companyName: "Test Company",
        domain: "agriculture"
      };
      
      await updateMyOrganizationHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should return 400 for empty companyName", async () => {
      const mockUser = { sub: "user-1", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      mockReq.body = {
        companyCode: "ACME",
        companyName: "",
        domain: "agriculture"
      };
      
      await updateMyOrganizationHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should return 400 for invalid domain", async () => {
      mockReq.user = { orgId: "org-1" } as any;
      mockReq.body = {
        domain: "", // empty string is < 2 chars
        companyCode: "ACME",
        companyName: "Test Company"
      };
      
      await updateMyOrganizationHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should return 200 with updated company on success", async () => {
      const mockUser = { sub: "user-1", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(upsertCompany).mockResolvedValue({
        id: "org-1",
        companyCode: "ACME",
        domain: "agriculture",
        companyName: "Updated Company Name",
        status: "active",
        metadata: {}
      } as any);
      
      mockReq.body = {
        companyCode: "ACME",
        companyName: "Updated Company Name",
        domain: "agriculture",
        legalName: "Updated Legal Name",
        website: "https://example.com"
      };
      
      await updateMyOrganizationHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          companyName: "Updated Company Name"
        })
      );
    });

    it("should call upsertCompany with provided data", async () => {
      const mockUser = { sub: "user-1", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(upsertCompany).mockResolvedValue({ id: "org-1" } as any);
      
      mockReq.body = {
        companyCode: "ACME",
        companyName: "Test Company",
        domain: "agriculture"
      };
      
      await updateMyOrganizationHandler(mockReq, mockRes);
      
      expect(upsertCompany).toHaveBeenCalledWith(
        expect.objectContaining({ companyCode: "ACME" })
      );
    });

    it("should accept optional metadata field", async () => {
      const mockUser = { sub: "user-1", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(upsertCompany).mockResolvedValue({ id: "org-1" } as any);
      
      mockReq.body = {
        companyCode: "ACME",
        companyName: "Test Company",
        domain: "agriculture",
        metadata: { customField: "customValue" }
      };
      
      await updateMyOrganizationHandler(mockReq, mockRes);
      
      expect(upsertCompany).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { customField: "customValue" } })
      );
    });
  });
});