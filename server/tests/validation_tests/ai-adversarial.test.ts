import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as aiService from '../../src/services/aiService.js';

describe('AI Service - Adversarial Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect adversarial sensor data patterns', async () => {
    // Create adversarial sensor data - rapid fluctuations
    const adversarialData = Array.from({ length: 100 }, (_, i) => ({
      timestamp: Date.now() + i * 100,
      value: Math.sin(i * 0.1) * 100 + (i % 10 === 0 ? 50 : 0) // Inject anomalies
    }));

    const result = await aiService.processSensorData(adversarialData);

    expect(result.anomalyScore).toBeGreaterThan(0.7);
    expect(result.detectedAnomalies.length).toBeGreaterThan(0);
  });

  it('should handle crafted evasion patterns', async () => {
    // Crafted data that might evade detection
    const evasionPattern = Array.from({ length: 50 }, (_, i) => ({
      timestamp: Date.now() + i * 1000,
      value: 25 + Math.random() * 5 // Small random variations
    }));

    const result = await aiService.processSensorData(evasionPattern);

    // Should still detect some anomalies
    expect(result.anomalyScore).toBeGreaterThan(0.01);
  });

  it('should detect data poisoning attacks', async () => {
    // Inject false data points
    const poisonedData = Array.from({ length: 20 }, (_, i) => ({
      timestamp: Date.now() + i * 5000,
      value: i % 5 === 0 ? 999 : 25 // Inject extreme values
    }));

    const result = await aiService.processSensorData(poisonedData);

    expect(result.anomalyScore).toBeGreaterThan(0.8);
    expect(result.detectedAnomalies.length).toBeGreaterThan(0);
  });

  it('should validate feature extraction robustness', async () => {
    const edgeCaseData = Array.from({ length: 10 }, (_, i) => ({
      timestamp: Date.now(),
      value: i === 0 ? NaN : 25 // Test NaN handling
    }));

    const result = await aiService.processSensorData(edgeCaseData);

    expect(result).toBeDefined();
    expect(result.featureVector).toBeDefined();
  });
});