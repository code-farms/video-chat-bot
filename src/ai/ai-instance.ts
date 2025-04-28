
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Load environment variables if needed (e.g., using dotenv in local dev)
// import dotenv from 'dotenv';
// dotenv.config();


if (!process.env.GOOGLE_GENAI_API_KEY) {
    console.warn(
      'GOOGLE_GENAI_API_KEY environment variable not set. Genkit AI features may not work.'
    );
    // Optional: Throw an error if the API key is absolutely required
    // throw new Error('GOOGLE_GENAI_API_KEY environment variable is missing.');
  }


export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      // Ensure the API key is passed correctly
      // The googleAI plugin automatically looks for GOOGLE_GENAI_API_KEY
      // apiKey: process.env.GOOGLE_GENAI_API_KEY, // This line is optional if the env var is set
    }),
  ],
  // Using a recent, free-tier friendly model. Change if needed.
  // See https://ai.google.dev/gemini-api/docs/models/gemini
  model: 'googleai/gemini-1.5-flash-latest',
  logLevel: 'debug', // Enable detailed logging for development
  enableTracing: true, // Enable tracing for debugging flows
});
