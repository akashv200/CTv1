import { describe, it, expect } from "vitest";
import { computeAuthenticityScore, evaluateSensorAnomaly } from "../../src/services/aiService.js";
import { detectAnomaly } from "../../src/ai/anomaly.js";

describe("AI Service - Whitebox Testing", () => {
  describe("computeAuthenticityScore() - Code Path Coverage", () => {
    it("should return 25 when no checkpoints, no certificates, and no anomalies", () => {
      const result = computeAuthenticityScore({
        checkpoints: 0,
        anomalies: 0,
        certificateCount: 0
      });
      
      expect(result).toBe(25);
    });

    it("should return 65 when 8 checkpoints, no anomalies, no certificates", () => {
      const result = computeAuthenticityScore({
        checkpoints: 8,
        anomalies: 0,
        certificateCount: 0
      });
      
      expect(result).toBe(65);
    });

    it("should return 100 when 8 checkpoints, 4 certificates, no anomalies", () => {
      const result = computeAuthenticityScore({
        checkpoints: 8,
        anomalies: 0,
        certificateCount: 4
      });
      
      expect(result).toBe(100);
    });

    it("should penalize for anomalies", () => {
      const result = computeAuthenticityScore({
        checkpoints: 8,
        anomalies: 1,
        certificateCount: 0
      });
      
      expect(result).toBe(59); // 65 - 6 = 59
    });

    it("should penalize for multiple anomalies", () => {
      const result = computeAuthenticityScore({
        checkpoints: 8,
        anomalies: 4,
        certificateCount: 0
      });
      
      expect(result).toBe(41); // 65 - 24 = 41
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it("should cap anomaly penalty at 25", () => {
      const result = computeAuthenticityScore({
        checkpoints: 8,
        anomalies: 100,
        certificateCount: 0
      });
      
      // Max penalty is 25, so result should be 65 - 25 = 40
      expect(result).toBe(40);
    });

    it("should handle 1 checkpoint", () => {
      const result = computeAuthenticityScore({
        checkpoints: 1,
        anomalies: 0,
        certificateCount: 0
      });
      
      // checkpointFactor = min(1, 1/8) * 40 = 5
      expect(result).toBe(30); // 5 + 0 + 25 = 30
    });

    it("should handle 1 certificate", () => {
      const result = computeAuthenticityScore({
        checkpoints: 0,
        anomalies: 0,
        certificateCount: 1
      });
      
      // certificateFactor = min(1, 1/4) * 35 = 8.75, rounded = 9
      expect(result).toBe(34); // 0 + 9 + 25 = 34
    });

    it("should handle 5 certificates", () => {
      const result = computeAuthenticityScore({
        checkpoints: 0,
        anomalies: 0,
        certificateCount: 5
      });
      
      // certificateFactor = min(1, 5/4) * 35 = 35
      expect(result).toBe(60); // 0 + 35 + 25 = 60
    });

    it("should return 0 when score goes negative", () => {
      const result = computeAuthenticityScore({
        checkpoints: 0,
        anomalies: 100,
        certificateCount: 0
      });
      
      // anomalyPenalty = min(25, 100 * 6) = 25
      // result = max(0, 0 + 0 + 25 - 25) = 0
      expect(result).toBe(0);
    });

    it("should handle edge case with 1 checkpoint and 1 anomaly", () => {
      const result = computeAuthenticityScore({
        checkpoints: 1,
        anomalies: 1,
        certificateCount: 0
      });
      
      // checkpointFactor = 5, anomalyPenalty = 6
      // result = max(0, 5 + 0 + 25 - 6) = 24
      expect(result).toBe(24);
    });

    it("should handle edge case with 1 checkpoint, 1 certificate, 1 anomaly", () => {
      const result = computeAuthenticityScore({
        checkpoints: 1,
        anomalies: 1,
        certificateCount: 1
      });
      
      // checkpointFactor = 5, certificateFactor = 9, anomalyPenalty = 6
      // result = max(0, 5 + 9 + 25 - 6) = 33
      expect(result).toBe(33);
    });
  });

  describe("evaluateSensorAnomaly() - Code Path Coverage", () => {
    it("should call detectAnomaly with productId, temperature, and humidity", () => {
      const result = evaluateSensorAnomaly("prod-1", 25.5, 60);
      
      expect(result).toBeDefined();
    });

    it("should call detectAnomaly with only productId when no sensor data", () => {
      const result = evaluateSensorAnomaly("prod-1");
      
      expect(result).toBeDefined();
    });

    it("should call detectAnomaly with only temperature", () => {
      const result = evaluateSensorAnomaly("prod-1", 25.5);
      
      expect(result).toBeDefined();
    });

    it("should call detectAnomaly with only humidity", () => {
      const result = evaluateSensorAnomaly("prod-1", undefined, 60);
      
      expect(result).toBeDefined();
    });
  });
});