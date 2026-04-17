import { GoogleGenerativeAI } from "@google/genai";
import { env } from "../config/env.js";

let genAI: GoogleGenerativeAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found. AI insights will be simulated.");
      return null;
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateSupplyChainInsight(context: {
  productName: string;
  domain: string;
  recentCheckpoints: any[];
  sensorData: any[];
}) {
  const ai = getAI();
  if (!ai) {
    return {
      title: "Limited Analysis",
      description: "AI analysis is currently limited due to missing credentials. Based on raw triggers, the system recommends verifying recent telemetry.",
      severity: "warning",
      insightType: "optimization"
    };
  }

  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are a Senior Supply Chain Consultant for a platform called ChainTrace. 
    Analyze the following data for a product in the "${context.domain}" sector.
    
    Product: ${context.productName}
    Recent Checkpoints: ${JSON.stringify(context.recentCheckpoints)}
    Sensor Telemetry: ${JSON.stringify(context.sensorData)}
    
    Tasks:
    1. Identify any anomalies or risks (temperature drift, delays, location deviations).
    2. Provide a 1-sentence recommendation.
    3. Categorize the insight by severity (info, warning, high, critical).
    4. Categorize by type (temperature_breach, humidity_spike, location_deviation, delay, tampering, demand_forecast, optimization, inventory_alert, quality_risk).

    Return ONLY a JSON object with this structure:
    {
      "title": "Short catchy title",
      "description": "Detailed explanation",
      "recommendation": "Actionable advice",
      "severity": "info | warning | high | critical",
      "insightType": "type_from_list"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Simple JSON extraction in case model returns markdown blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid AI response format");
  } catch (error) {
    console.error("Gemini AI error:", error);
    return {
      title: "Analysis Failure",
      description: "The AI was unable to process the supply chain model at this time.",
      severity: "info",
      insightType: "optimization"
    };
  }
}
