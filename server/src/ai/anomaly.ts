export interface SensorSnapshot {
  productId: string;
  temperature?: number;
  humidity?: number;
  expectedMinTemp?: number;
  expectedMaxTemp?: number;
}

export interface AnomalyResult {
  score: number;
  isAnomaly: boolean;
  reason?: string;
}

export function detectAnomaly(snapshot: SensorSnapshot): AnomalyResult {
  const min = snapshot.expectedMinTemp ?? 2;
  const max = snapshot.expectedMaxTemp ?? 8;
  const temp = snapshot.temperature ?? 0;

  if (temp < min || temp > max) {
    const score = Math.min(1, Math.abs(temp - (temp < min ? min : max)) / 8 + 0.65);
    return {
      score,
      isAnomaly: true,
      reason: `Temperature ${temp}C out of expected range (${min}-${max}C)`
    };
  }

  return {
    score: 0.08,
    isAnomaly: false
  };
}
