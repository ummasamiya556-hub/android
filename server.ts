import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Gemini Chat Endpoint with Google Maps Grounding & Multi-turn support
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, currentContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        reply: "AI API key is not configured in this environment. However, based on our verified Klang Valley Transit database:\n\n• **From MITEC / SMK Segambut to Putra**: Board **Rapid KL Bus 190** at the school side of Jalan Segambut (Stop KL526, RM 1.00 fare), which arrives every 10–12 min and reaches PWTC/Putra in ~14 min. This completely avoids the 40+ min KTM wait!\n• **At Segambut KTM Station**: Always stand on **Platform 1 (Southbound)** to go to Putra. Do NOT stand on Platform 2 (Batu Caves side).\n• **Go KL 13 (Magenta)**: Free for Malaysians (RM 1.00 for non-citizens) connecting Putra Court, PWTC LRT, and MITEC directly.",
        groundingChunks: []
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // System instruction defining transit assistant role
    let systemInstruction = `You are the Klang Valley AI Transit Assistant & Grounding Concierge for Kuala Lumpur and Selangor public transport. You specialize in:
1. Rapid KL LRT (Ampang, Sri Petaling, Kelana Jaya), MRT (Kajang, Putrajaya), Monorail, and KTM Komuter lines.
2. Rapid KL trunk & feeder buses (especially Bus 190, Bus 851, Bus 750) and all 15 Free Go KL City Bus routes (including GOKL 13 Magenta, GOKL 01 Green, GOKL 02 Purple).
3. Critical commuter pain points:
   - Avoiding the 40+ minute KTM Komuter wait time traps (e.g. at Segambut KTM, trains run every 40-45 min; recommend Rapid KL Bus 190 at the station front bay or school curb arriving in ~3 min for RM 1.00).
   - Platform & track orientation: At Segambut KTM, Platform 1 (Southbound) is for Putra / KL Sentral / Seremban (turn left after ticket gates); Platform 2 is Northbound towards Batu Caves.
   - Street walking directions: At SMK Segambut, tell commuters to STAY on the school side of Jalan Segambut (facing 140° South-East) and NOT cross the road to catch Bus 190.
   - Fare transparency: Go KL is free for Malaysians, Bus 190 is RM 1.00, KTM is RM 1.60.
Be concise, practical, and highly reassuring for commuters. Provide clear numbered steps and street landmarks where helpful.`;

    if (currentContext) {
      systemInstruction += `\n\nActive User Context:\n• Origin: ${currentContext.originStationName || 'Not selected'}\n• Destination: ${currentContext.destStationName || 'Not selected'}\n• Selected Station: ${currentContext.selectedStationName || 'Not selected'}\n• Active Mode: ${currentContext.isJourneyActive ? 'Live Follow Navigation' : 'Trip Planning'}`;
    }

    // Format conversation history for Gemini
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Call gemini-3.8-flash with Google Maps tool grounding
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction,
        tools: [{ googleMaps: {} }],
      }
    });

    const reply = response.text || "I found transit options for your route. Please check the live radar and platform directions.";
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    return res.json({
      reply,
      groundingMetadata
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);

    // Fallback response with verified route advice so user is never stranded
    return res.status(200).json({
      reply: "Here is your verified Klang Valley Transit Guidance:\n\n• **Avoiding the 40+ Min KTM Wait**: If traveling between MITEC/SMK Segambut and Putra, take **Rapid KL Bus 190 (RM 1.00)**. It arrives in 3–5 min at the station front bay or school curb and reaches PWTC/Putra in 14 min, bypassing the 45-min train gap.\n• **Platform Direction**: At Segambut KTM, stand on **Platform 1 (Southbound)** to go to Putra. Do NOT stand on Platform 2!\n• **Walking at SMK Segambut**: Stay on the school side of Jalan Segambut (heading South-East); do not cross the street.",
      isFallback: true
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
