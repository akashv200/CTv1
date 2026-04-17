import { describe, it, expect, vi, beforeEach } from "vitest";
import { listIoTDevicesHandler, registerDeviceHandler, ingestReadingHandler } from "../../src/controllers/iotController.js";
import { listDevicesByOrganization, registerDevice } from "../../src/services/iotService.js";
import { insertSensorReading } from "../../src/config/postgres.js";
import type { Request, Response } from "express";

// Mock dependencies
vi.mock("../../src/services/iotService.js");
vi.mock("../../src/config/postgres.js");

// Helper to create mock response
function createMockResponse() {
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  };
  return mockRes as unknown as Response;
}

// Helper to create mock app
function createMockApp() {
  return {
    get: vi.fn().mockReturnValue({ emit: vi.fn() })
  };
}

describe("IoTController - Whitebox Testing", () => {
  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {} as Request;
    mockRes = createMockResponse();
  });

  describe("listIoTDevicesHandler() - Code Path Coverage", () => {
    it("should return 200 with devices for authenticated user", async () => {
      const mockUser = { orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(listDevicesByOrganization).mockResolvedValue([
        { id: "dev-1", deviceId: "sensor-001", deviceName: "Temp Sensor 1", deviceType: "temperature_sensor" },
        { id: "dev-2", deviceId: "sensor-002", deviceName: "Humidity Sensor 1", deviceType: "humidity_sensor" }
      ] as any);
      
      await listIoTDevicesHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([
        { id: "dev-1", deviceId: "sensor-001", deviceName: "Temp Sensor 1", deviceType: "temperature_sensor" },
        { id: "dev-2", deviceId: "sensor-002", deviceName: "Humidity Sensor 1", deviceType: "humidity_sensor" }
      ]);
    });

    it("should use org-demo as default when user has no orgId", async () => {
      const mockUser = {};
      mockReq.user = mockUser as any;
      
      vi.mocked(listDevicesByOrganization).mockResolvedValue([]);
      
      await listIoTDevicesHandler(mockReq, mockRes);
      
      expect(listDevicesByOrganization).toHaveBeenCalledWith("org-demo");
    });
  });

  describe("registerDeviceHandler() - Code Path Coverage", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockReq.user = undefined;
      
      await registerDeviceHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return 401 when user has no orgId", async () => {
      const mockUser = { sub: "user-1" };
      mockReq.user = mockUser as any;
      
      await registerDeviceHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should register device and return 200 on success", async () => {
      const mockUser = { sub: "user-1", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(registerDevice).mockResolvedValue({
        id: "dev-1",
        deviceId: "sensor-001",
        deviceName: "Temp Sensor 1",
        deviceType: "temperature_sensor",
        companyId: "org-1"
      } as any);
      
      mockReq.body = {
        deviceId: "sensor-001",
        deviceName: "Temp Sensor 1",
        deviceType: "temperature_sensor"
      };
      
      await registerDeviceHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: "sensor-001",
          companyId: "org-1"
        })
      );
    });

    it("should pass companyId from user orgId to registerDevice", async () => {
      const mockUser = { sub: "user-1", orgId: "org-1" };
      mockReq.user = mockUser as any;
      
      vi.mocked(registerDevice).mockResolvedValue({ id: "dev-1" } as any);
      
      mockReq.body = {
        deviceId: "sensor-001",
        deviceName: "Temp Sensor 1",
        deviceType: "temperature_sensor"
      };
      
      await registerDeviceHandler(mockReq, mockRes);
      
      expect(registerDevice).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: "org-1" })
      );
    });
  });

  describe("ingestReadingHandler() - Code Path Coverage", () => {
    it("should return 201 with ok=true on successful reading ingestion", async () => {
      const mockData = {
        deviceId: "sensor-001",
        productId: "prod-1",
        companyId: "org-1",
        sensorType: "temperature",
        value: 25.5,
        unit: "°C",
        latitude: 28.6139,
        longitude: 77.2090
      };
      
      mockReq.body = mockData;
      mockReq.app = createMockApp() as any;
      
      await ingestReadingHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ ok: true });
    });

    it("should auto-provision device if companyId and deviceId are provided", async () => {
      const mockData = {
        deviceId: "sensor-001",
        companyId: "org-1",
        sensorType: "temperature"
      };
      
      mockReq.body = mockData;
      mockReq.app = createMockApp() as any;
      
      await ingestReadingHandler(mockReq, mockRes);
      
      expect(insertSensorReading).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: "sensor-001",
          companyId: "org-1",
          sensorType: "temperature"
        })
      );
    });

    it("should use default values for optional fields", async () => {
      const mockData = {
        deviceId: "sensor-001",
        productId: "prod-1",
        companyId: "org-1",
        sensorType: "temperature",
        value: 25.5
      };
      
      mockReq.body = mockData;
      mockReq.app = createMockApp() as any;
      
      await ingestReadingHandler(mockReq, mockRes);
      
      expect(insertSensorReading).toHaveBeenCalledWith(
        expect.objectContaining({
          unit: "°C",
          latitude: undefined,
          longitude: undefined,
          rawPayload: expect.objectContaining({
            temperature: 25.5,
            humidity: undefined
          })
        })
      );
    });

    it("should emit sensor:update event via socket", async () => {
      const mockData = { deviceId: "sensor-001", value: 25.5 };
      mockReq.body = mockData;
      mockReq.app = createMockApp() as any;
      
      await ingestReadingHandler(mockReq, mockRes);
      
      expect(mockReq.app.get("io")).toBeDefined();
      expect(mockReq.app.get("io")?.emit).toHaveBeenCalledWith("sensor:update", mockData);
    });
  });
});