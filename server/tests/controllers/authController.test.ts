import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { register, login, requestPasswordReset, inspectPasswordToken, completePasswordFlow } from "../../src/controllers/authController.js";
import { hashPassword, verifyPassword } from "../../src/utils/password.js";
import { signAccessToken, signRefreshToken } from "../../src/utils/jwt.js";
import { findUserByEmail, createUser } from "../../src/services/userService.js";
import { issuePasswordActionToken, completePasswordAction, getPasswordTokenInfo } from "../../src/services/passwordTokenService.js";
import type { Request, Response } from "express";

// Mock dependencies
vi.mock("../../src/services/userService.js");
vi.mock("../../src/utils/password.js");
vi.mock("../../src/utils/jwt.js");
vi.mock("../../src/services/passwordTokenService.js");

// Helper to create mock response
function createMockResponse() {
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  };
  return mockRes as unknown as Response;
}

describe("AuthController - Whitebox Testing", () => {
  const mockReq = {} as Request;
  let mockRes: Response;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = createMockResponse();
  });

  describe("register() - Code Path Coverage", () => {
    it("should return 400 for invalid email format", async () => {
      mockReq.body = { name: "John", email: "invalid", password: "password123" };
      
      await register(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should return 400 for password shorter than 8 chars", async () => {
      mockReq.body = { name: "John", email: "john@example.com", password: "short" };
      
      await register(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should return 409 when email already exists", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({ id: "1", email: "john@example.com" } as any);
      
      mockReq.body = { name: "John", email: "john@example.com", password: "password123" };
      
      await register(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Email already exists" });
    });

    it("should create user and return 201 on success", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(null);
      vi.mocked(hashPassword).mockResolvedValue("hashed_password");
      vi.mocked(createUser).mockResolvedValue({
        id: "user-1",
        email: "john@example.com",
        role: "consumer",
        name: "John"
      } as any);

      mockReq.body = { name: "John", email: "john@example.com", password: "password123" };
      
      await register(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: "user-1",
        email: "john@example.com",
        role: "consumer"
      });
    });

    it("should default role to consumer when not specified", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(null);
      vi.mocked(hashPassword).mockResolvedValue("hashed");
      vi.mocked(createUser).mockResolvedValue({
        id: "user-1",
        email: "john@example.com",
        role: "consumer",
        name: "John"
      } as any);

      mockReq.body = { name: "John", email: "john@example.com", password: "password123" };
      
      await register(mockReq, mockRes);
      
      expect(createUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: "consumer" })
      );
    });
  });

  describe("login() - Code Path Coverage", () => {
    it("should return 400 for invalid email format", async () => {
      mockReq.body = { email: "invalid", password: "password123" };
      
      await login(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should return 400 for password shorter than 8 chars", async () => {
      mockReq.body = { email: "john@example.com", password: "short" };
      
      await login(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should return 401 when user not found", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(null);
      
      mockReq.body = { email: "john@example.com", password: "password123" };
      
      await login(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    it("should return 401 when password is incorrect", async () => {
      const mockUser = {
        id: "user-1",
        email: "john@example.com",
        passwordHash: "hashed",
        role: "producer",
        organizationId: "org-1"
      } as any;
      
      vi.mocked(findUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(verifyPassword).mockResolvedValue(false);
      
      mockReq.body = { email: "john@example.com", password: "wrongpassword" };
      
      await login(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    it("should return 200 with tokens on successful login", async () => {
      const mockUser = {
        id: "user-1",
        email: "john@example.com",
        passwordHash: "hashed",
        role: "producer",
        organizationId: "org-1"
      } as any;
      
      vi.mocked(findUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(signAccessToken).mockReturnValue("access_token");
      vi.mocked(signRefreshToken).mockReturnValue("refresh_token");
      
      mockReq.body = { email: "john@example.com", password: "correctpassword" };
      
      await login(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        accessToken: "access_token",
        refreshToken: "refresh_token"
      });
    });

    it("should include orgId in token payload when user has organization", async () => {
      const mockUser = {
        id: "user-1",
        email: "john@example.com",
        passwordHash: "hashed",
        role: "producer",
        organizationId: "org-1"
      } as any;
      
      vi.mocked(findUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      
      mockReq.body = { email: "john@example.com", password: "correctpassword" };
      
      await login(mockReq, mockRes);
      
      expect(signAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({ orgId: "org-1" })
      );
    });

    it("should set orgId to undefined when user has no organization", async () => {
      const mockUser = {
        id: "user-1",
        email: "john@example.com",
        passwordHash: "hashed",
        role: "consumer",
        organizationId: null
      } as any;
      
      vi.mocked(findUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      
      mockReq.body = { email: "john@example.com", password: "correctpassword" };
      
      await login(mockReq, mockRes);
      
      expect(signAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({ orgId: undefined })
      );
    });
  });

  describe("requestPasswordReset() - Code Path Coverage", () => {
    it("should return 400 for invalid email format", async () => {
      mockReq.body = { email: "invalid" };
      
      await requestPasswordReset(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should issue password reset token when user exists", async () => {
      const mockUser = {
        id: "user-1",
        email: "john@example.com",
        name: "John",
        organizationId: "org-1"
      } as any;
      
      vi.mocked(findUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(issuePasswordActionToken).mockResolvedValue({ actionUrl: "http://example.com", expiresAt: "2026-01-01" });
      
      mockReq.body = { email: "john@example.com" };
      
      await requestPasswordReset(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.stringContaining("password reset link") });
      expect(issuePasswordActionToken).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: "password_reset" })
      );
    });

    it("should handle user with null organizationId", async () => {
      const mockUser = {
        id: "user-1",
        email: "john@example.com",
        name: "John",
        organizationId: null
      } as any;
      
      vi.mocked(findUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(issuePasswordActionToken).mockResolvedValue({ actionUrl: "http://example.com", expiresAt: "2026-01-01" });
      
      mockReq.body = { email: "john@example.com" };
      
      await requestPasswordReset(mockReq, mockRes);
      
      expect(issuePasswordActionToken).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: null })
      );
    });
  });

  describe("inspectPasswordToken() - Code Path Coverage", () => {
    it("should return 400 when token is missing", async () => {
      mockReq.params = {};
      
      await inspectPasswordToken(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Missing token" });
    });

    it("should return 404 when token is invalid", async () => {
      mockReq.params = { token: "invalid_token" };
      vi.mocked(getPasswordTokenInfo).mockResolvedValue(null);
      
      await inspectPasswordToken(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Token is invalid or expired" });
    });

    it("should return 200 with token info when valid", async () => {
      const mockTokenInfo = {
        email: "john@example.com",
        purpose: "password_reset",
        name: "John",
        companyName: "Acme Corp",
        expiresAt: new Date()
      } as any;
      
      vi.mocked(getPasswordTokenInfo).mockResolvedValue(mockTokenInfo);
      
      mockReq.params = { token: "valid_token" };
      
      await inspectPasswordToken(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        valid: true,
        email: "john@example.com",
        purpose: "password_reset",
        name: "John",
        companyName: "Acme Corp",
        expiresAt: expect.any(Date)
      });
    });
  });

  describe("completePasswordFlow() - Code Path Coverage", () => {
    it("should return 400 for invalid token", async () => {
      mockReq.body = { token: "short", password: "password123" };
      
      await completePasswordFlow(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should return 400 for password shorter than 8 chars", async () => {
      mockReq.body = { token: "valid_token_at_least_20_chars", password: "short" };
      
      await completePasswordFlow(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid payload" }));
    });

    it("should return 200 with success message for password_reset", async () => {
      vi.mocked(completePasswordAction).mockResolvedValue({
        purpose: "password_reset",
        email: "john@example.com"
      } as any);
      
      mockReq.body = { token: "valid_token_at_least_20_chars", password: "newpassword123" };
      
      await completePasswordFlow(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Password reset successfully. You can log in now."
      });
    });

    it("should return 200 with success message for invite_setup", async () => {
      vi.mocked(completePasswordAction).mockResolvedValue({
        purpose: "invite_setup",
        email: "john@example.com"
      } as any);
      
      mockReq.body = { token: "valid_token_at_least_20_chars", password: "newpassword123" };
      
      await completePasswordFlow(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Password set successfully. You can log in now."
      });
    });

    it("should return 400 on error from completePasswordAction", async () => {
      vi.mocked(completePasswordAction).mockRejectedValue(new Error("Token expired"));
      
      mockReq.body = { token: "valid_token_at_least_20_chars", password: "newpassword123" };
      
      await completePasswordFlow(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Token expired" });
    });
  });
});