import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Compact resource summary interfaces
interface CompactShortage {
  name: string;
  location: string;
  deficit: number;
  unit: string;
  status: string;
}

interface CompactSurplus {
  name: string;
  location: string;
  surplus: number;
  unit: string;
}

interface RecommendationRequest {
  shortages: CompactShortage[];
  surpluses?: CompactSurplus[];
}

export interface StructuredCoordinationRecommendation {
  severity: 'critical' | 'high' | 'warning' | 'normal';
  recommended_action: string;
  reason: string;
  confidence: number;
  affected_location: string;
}

// Deterministic structured fallback generator
function generateLocalFallback(shortages: CompactShortage[], surpluses: CompactSurplus[] = []): StructuredCoordinationRecommendation {
  if (!shortages || shortages.length === 0) {
    return {
      severity: 'normal',
      recommended_action: 'Maintain routine resource monitoring and regular reserve audits across facilities.',
      reason: 'All facilities are operating within safe baseline thresholds.',
      confidence: 0.95,
      affected_location: 'Network-wide',
    };
  }

  const topShortage = shortages[0];
  const matchingSurplus = (surpluses || []).find(
    (s) => s.name.toLowerCase() === topShortage.name.toLowerCase() && s.surplus > 0
  );

  if (matchingSurplus) {
    const transferQty = Math.min(topShortage.deficit, matchingSurplus.surplus);
    return {
      severity: topShortage.status === 'critical' ? 'critical' : 'high',
      recommended_action: `Reallocate ${transferQty} ${topShortage.unit} of ${topShortage.name} from ${matchingSurplus.location} to ${topShortage.location}.`,
      reason: `${topShortage.location} has a ${topShortage.deficit} ${topShortage.unit} deficit while ${matchingSurplus.location} maintains a +${matchingSurplus.surplus} surplus above baseline.`,
      confidence: 0.94,
      affected_location: topShortage.location,
    };
  }

  return {
    severity: topShortage.status === 'critical' ? 'critical' : 'high',
    recommended_action: `Dispatch ${topShortage.deficit} ${topShortage.unit} of ${topShortage.name} from Regional Logistics Reserve to ${topShortage.location}.`,
    reason: `Local peer facilities do not hold sufficient surplus buffer to cover the deficit safely.`,
    confidence: 0.88,
    affected_location: topShortage.location,
  };
}

// Server-side API endpoint for Gemini structured coordination recommendation
app.post('/api/recommendation', async (req: Request, res: Response) => {
  const { shortages = [], surpluses = [] } = (req.body || {}) as RecommendationRequest;
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback if no API key is configured
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const fallback = generateLocalFallback(shortages, surpluses);
    return res.json({
      recommendation: fallback,
      isFallback: true,
      reason: 'Rule-based fallback active (API key not configured in environment)',
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const compactShortagesSummary = (shortages || [])
      .slice(0, 3)
      .map((s) => `- ${s.name} at ${s.location}: -${s.deficit} ${s.unit} (${s.status})`)
      .join('\n');

    const compactSurplusesSummary = (surpluses || [])
      .slice(0, 3)
      .map((s) => `- ${s.name} at ${s.location}: +${s.surplus} ${s.unit} available`)
      .join('\n');

    const prompt = `Current Facility Resource State:
Deficits:
${compactShortagesSummary || 'None'}

Available Surpluses:
${compactSurplusesSummary || 'None'}

State exactly one immediate coordination action with factual justification.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a resource coordination assistant. Analyze the resource deficits and surpluses, and return exactly one prioritized redistribution directive in structured JSON format.',
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            severity: {
              type: Type.STRING,
              description: 'Urgency severity level: critical, high, warning, or normal.',
            },
            recommended_action: {
              type: Type.STRING,
              description: 'One concise redistribution directive specifying source, recipient, and quantity.',
            },
            reason: {
              type: Type.STRING,
              description: 'Operational justification explaining the deficit or capacity constraint.',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0.0 and 1.0 for this suggestion.',
            },
            affected_location: {
              type: Type.STRING,
              description: 'The specific facility or ward experiencing the deficit.',
            },
          },
          required: ['severity', 'recommended_action', 'reason', 'confidence', 'affected_location'],
        },
      },
    });

    const rawJson = response.text?.trim();

    if (!rawJson) {
      throw new Error('Empty response from model');
    }

    const structuredRecommendation: StructuredCoordinationRecommendation = JSON.parse(rawJson);

    return res.json({
      recommendation: structuredRecommendation,
      isFallback: false,
    });
  } catch (error: any) {
    console.error('Gemini API call failed, switching to local fallback:', error?.message || error);
    const fallback = generateLocalFallback(shortages, surpluses);
    return res.json({
      recommendation: fallback,
      isFallback: true,
      reason: 'Rule-based fallback active (Gemini API unavailable or network timeout)',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OpsPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
