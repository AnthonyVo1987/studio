
'use server';

// START CLIENT-SIDE EXECUTION GUARD
if (typeof window !== 'undefined') {
  const errorMessage = "CRITICAL ALARM: The server-only file 'src/ai/genkit.ts' has been imported into the CLIENT-SIDE BUNDLE! This indicates a severe misconfiguration or incorrect import chain. Review imports leading to this file from client components. This will cause build failures or runtime errors.";
  console.error(errorMessage);
  // Making it throw in development can make it unmissable and halt faulty execution.
  if (process.env.NODE_ENV === 'development') {
    throw new Error(errorMessage);
  }
}
// END CLIENT-SIDE EXECUTION GUARD

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { DEFAULT_ANALYSIS_MODEL_ID } from './models';

export const ai = genkit({
  plugins: [googleAI()],
  model: DEFAULT_ANALYSIS_MODEL_ID,
  enableOpenTelemetry: false, // Explicitly disable OpenTelemetry
});
