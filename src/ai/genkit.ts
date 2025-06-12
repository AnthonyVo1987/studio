
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { DEFAULT_ANALYSIS_MODEL_ID } from './models';

export const ai = genkit({
  plugins: [googleAI()],
  model: DEFAULT_ANALYSIS_MODEL_ID,
  enableOpenTelemetry: false, // Explicitly disable OpenTelemetry
});
