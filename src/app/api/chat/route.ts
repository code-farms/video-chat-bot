// src/app/api/chat/route.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const MODEL_NAME = "gemini-1.5-flash-latest"; // Use a free-tier friendly model

export async function POST(req: NextRequest) {
  try {
    const { userMessage } = await req.json();

    if (!userMessage) {
      return NextResponse.json({ error: 'Missing userMessage in request body' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY; // Changed from GOOGLE_GENAI_API_KEY for consistency
    if (!apiKey) {
        console.error('GOOGLE_API_KEY environment variable not set.');
        return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [
        // Optional: Add conversation history here if needed later
        // { role: "user", parts: [{ text: "Previous user message" }] },
        // { role: "model", parts: [{ text: "Previous AI response" }] },
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    const aiResponse = response.text();

    return NextResponse.json({ aiResponse });

  } catch (error) {
    console.error('Error processing chat request:', error);
    // Check for specific Gemini API errors if possible
    if (error instanceof Error && 'message' in error) {
        // You might want to check error.message or error.name for specific API errors
        return NextResponse.json({ error: `AI service error: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
