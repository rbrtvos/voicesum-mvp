// api/process-audio.js - Serverless functie voor audio verwerking

import fetch from 'node-fetch';
import { FormData } from 'formdata-node';
import { fileFromBuffer } from 'formdata-node/file-from';

// OpenAI API configuratie
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GPT_MODEL = 'gpt-3.5-turbo';

// Functie voor het verwerken van audio
export default async function handler(req, res) {
  // CORS headers toevoegen voor lokale ontwikkeling
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // CORS preflight afhandelen
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Alleen POST requests accepteren
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {

    
console.log("Request received");
console.log("Request body:", JSON.stringify(req.body).substring(0, 100) + "...");
    
// Audio uit request halen
    if (!req.body || !req.body.audio) {
      return res.status(400).json({ error: 'Geen audiobestand gevonden in request' });
    }
    
    // Audio base64 decoderen naar buffer
    const audioBase64 = req.body.audio;
    const audioData = Buffer.from(audioBase64.split(',')[1], 'base64');
    
    // Maak een FormData object met het audio bestand
    const formData = new FormData();
    
    // Bepaal bestandsnaam en type op basis van de meegestuurde informatie
    const fileName = req.body.fileName || 'audio.webm';
    const fileType = req.body.fileType || 'audio/webm';
    
    // Converteer buffer naar een file voor FormData
    const file = await fileFromBuffer(audioData, fileName, { type: fileType });
    
    // Voeg de file toe aan formData
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    formData.append('language', req.body.language || 'nl');
    formData.append('response_format', 'json');
    
    // Audio naar Whisper API sturen voor transcriptie
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    });
    
    // Controleer of de transcriptie gelukt is
    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      console.error('Transcription error:', error);
      return res.status(500).json({ error: 'Er is een fout opgetreden bij het transcriberen' });
    }
    
    // Haal de transcriptie op uit de response
    const transcriptionResult = await transcriptionResponse.json();
    const transcriptionText = transcriptionResult.text;
    
    // Genereer een samenvatting met GPT
    const summaryPrompt = `
      Vat het volgende getranscribeerde spraakbericht samen in korte, duidelijke punten.
      Focus op:
      1. De hoofdboodschap
      2. Belangrijke actiepunten (gemarkeerd met '•')
      3. Deadlines of tijdgevoelige informatie
      4. Keuzes die gemaakt moeten worden
      
      Houd de samenvatting beknopt en duidelijk. Gebruik bullet points voor actiepunten.
      
      Spraakbericht:
      ${transcriptionText}
    `;
    
    // GPT aanroepen voor samenvatting
    const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          { role: 'system', content: 'Je bent een assistent die spraakberichten samenvat in korte, duidelijke punten.' },
          { role: 'user', content: summaryPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });
    
    // Controleer of de samenvatting gelukt is
    if (!summaryResponse.ok) {
      const error = await summaryResponse.text();
      console.error('Summary error:', error);
      
      // Als de samenvatting mislukt, stuur dan alleen de transcriptie terug
      return res.status(200).json({
        transcription: transcriptionText,
        summary: "Kon geen samenvatting genereren. Hier is de volledige transcriptie.",
        error: "Samenvatting mislukt, maar transcriptie gelukt"
      });
    }
    
    // Haal de samenvatting op uit de response
    const summaryResult = await summaryResponse.json();
    const summaryText = summaryResult.choices[0].message.content;
    
    // Stuur beide terug naar de client
    return res.status(200).json({
      transcription: transcriptionText,
      summary: summaryText
    });
  } catch (error) {
    console.error('Error processing audio:', error);
    return res.status(500).json({ error: 'Er is een fout opgetreden bij het verwerken van het audiobestand' });
  }
}