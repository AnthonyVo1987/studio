
import { config } from 'dotenv';
config();

// Ensure all flow files are imported so Genkit discovers them
import '@/ai/flows/analyze-ta-flow.ts'; 
import '@/ai/flows/analyze-stock-data.ts';
import '@/ai/flows/chat-flow.ts';
import '@/ai/flows/analyze-options-chain-flow.ts';
import '@/ai/flows/format-web-search-flow.ts';
