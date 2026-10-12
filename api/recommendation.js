import { GoogleGenAI, Type } from '@google/genai';

// Deterministic structured fallback generator
function generateLocalFallback(shortages = [], surpluses = []) {
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
    reason: 'Local peer facilities do not hold sufficient surplus buffer to cover the deficit safely.',
    confidence: 0.88,
    affected_location: topShortage.location,
  };
}

export default async function handler(req, res) {
  console.info('[recommendation] Request received', { method: req.method });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    let body = req.body;

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON request body.' });
      }
    } else if (Buffer.isBuffer(body)) {
      try {
        body = JSON.parse(body.toString('utf8'));
      } catch {
        return res.status(400).json({ error: 'Invalid JSON request body.' });
      }
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Invalid recommendation request.' });
    }

    const { shortages = [], surpluses = [] } = body;
    if (!Array.isArray(shortages) || !Array.isArray(surpluses)) {
      return res.status(400).json({ error: 'Invalid recommendation request format.' });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.VITE_GEMINI_API_KEY;

    const hasApiKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
    console.info('[recommendation] GEMINI_API_KEY configured:', hasApiKey);

    // If no Gemini API key configured in Vercel environment, gracefully serve local rule-based fallback
    if (!hasApiKey) {
      const fallback = generateLocalFallback(shortages, surpluses);
      return res.status(200).json({
        recommendation: fallback,
        isFallback: true,
        reason: 'Rule-based fallback active (GEMINI_API_KEY not configured in Vercel environment variables)',
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

      const shortageSummary = shortages
        .slice(0, 3)
        .map((item) => `- ${item.name} at ${item.location}: -${item.deficit} ${item.unit} (${item.status})`)
        .join('\n');
      const surplusSummary = surpluses
        .slice(0, 3)
        .map((item) => `- ${item.name} at ${item.location}: +${item.surplus} ${item.unit} available`)
        .join('\n');

      console.info('[recommendation] Gemini request started', { model: 'gemini-3.8-flash' });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Current Facility Resource State:\nDeficits:\n${shortageSummary || 'None'}\n\nAvailable Surpluses:\n${surplusSummary || 'None'}\n\nState exactly one immediate coordination action with factual justification.`,
        config: {
          systemInstruction:
            'You are a resource coordination assistant. Analyze the resource deficits and surpluses, and return exactly one prioritized redistribution directive in structured JSON format.',
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              severity: { type: Type.STRING },
              recommended_action: { type: Type.STRING },
              reason: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              affected_location: { type: Type.STRING },
            },
            required: ['severity', 'recommended_action', 'reason', 'confidence', 'affected_location'],
          },
        },
      });
      console.info('[recommendation] Gemini response received');

      const rawRecommendation = response.text?.trim();
      if (!rawRecommendation) {
        throw new Error('Empty recommendation response');
      }

      return res.status(200).json({
        recommendation: JSON.parse(rawRecommendation),
        isFallback: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const safeErrorMessage = apiKey ? errorMessage.replaceAll(apiKey, '[REDACTED]') : errorMessage;
      console.error('[recommendation] Gemini request failed, using fallback:', safeErrorMessage);

      // Graceful fallback if Gemini service is temporarily unavailable or quotas exceeded
      const fallback = generateLocalFallback(shortages, surpluses);
      return res.status(200).json({
        recommendation: fallback,
        isFallback: true,
        reason: 'Rule-based fallback active (Gemini API unavailable or quota reached)',
      });
    }
  } catch (outerError) {
    const errorMsg = outerError instanceof Error ? outerError.message : String(outerError);
    console.error('[recommendation] Unexpected handler error:', errorMsg);
    const fallback = generateLocalFallback([], []);
    return res.status(200).json({
      recommendation: fallback,
      isFallback: true,
      reason: 'Rule-based fallback active (Internal handler fallback)',
    });
  }
}
