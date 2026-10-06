import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    const { shortages, surpluses = [] } = req.body || {};
    if (!Array.isArray(shortages) || !Array.isArray(surpluses)) {
        return res.status(400).json({ error: 'Invalid recommendation request.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(500).json({ error: 'Recommendation service is not configured.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const shortageSummary = shortages
            .slice(0, 3)
            .map((item) => `- ${item.name} at ${item.location}: -${item.deficit} ${item.unit} (${item.status})`)
            .join('\n');
        const surplusSummary = surpluses
            .slice(0, 3)
            .map((item) => `- ${item.name} at ${item.location}: +${item.surplus} ${item.unit} available`)
            .join('\n');

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

        const rawRecommendation = response.text?.trim();
        if (!rawRecommendation) {
            throw new Error('Empty recommendation response');
        }

        return res.status(200).json({
            recommendation: JSON.parse(rawRecommendation),
            isFallback: false,
        });
    } catch {
        console.error('Gemini recommendation request failed.');
        return res.status(502).json({ error: 'Recommendation service is temporarily unavailable.' });
    }
}
