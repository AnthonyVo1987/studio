
// CRITICAL: Server-only module guard.
// This check helps detect if this server-only module is mistakenly
// imported and executed in a client-side environment, which can lead to
// bundling issues and runtime errors.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const errorMessage = 'CRITICAL ERROR: src/ai/genkit.ts is a server-only module but is being executed in the client environment! This indicates a serious bundling issue. Check import chains, especially from schema files or other shared utilities that might incorrectly import {z} from "genkit" or have other server-side leakage.';
  console.error(errorMessage);
  throw new Error(errorMessage);
} else if (typeof window !== 'undefined') {
  // In production, just log, don't throw, to avoid crashing the client for all users,
  // though this scenario should ideally be caught before production.
  console.error('CRITICAL ERROR: src/ai/genkit.ts (server-only) executed in client environment (production build). Investigate bundling.');
}

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { DEFAULT_ANALYSIS_MODEL_ID } from './models'; // DEFAULT_ANALYSIS_MODEL_ID will now be gemini-2.5-flash-lite-preview-06-17

export const ai = genkit({
  plugins: [googleAI()],
  model: DEFAULT_ANALYSIS_MODEL_ID, // This now correctly uses the updated model from models.ts
  enableOpenTelemetry: false, // Explicitly disable OpenTelemetry
});

