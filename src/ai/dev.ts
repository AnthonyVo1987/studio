
import { config } from 'dotenv';
config();

// Ensure all flow files are imported so Genkit discovers them
import '@/ai/flows/analyze-ta-flow.ts'; 
import '@/ai/flows/analyze-stock-data.ts';
import '@/ai/flows/app-data-chat-flow.ts';
import '@/ai/flows/analyze-options-chain-flow.ts';
// DEPRECATED: import '@/ai/flows/web-search-chat-flow.ts';
import '@/ai/flows/raw-web-search-debug-flow.ts';
