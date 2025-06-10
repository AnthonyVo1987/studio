
import { config } from 'dotenv';
config();

// Ensure all flow files are imported so Genkit discovers them
import '@/ai/flows/calculate-ai-ta-flow.ts';
import '@/ai/flows/analyze-stock-data.ts';
import '@/ai/flows/chat-flow.ts';
