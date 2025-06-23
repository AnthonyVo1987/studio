
import { config } from 'dotenv';
config();

// Ensure all flow files are imported so Genkit discovers them
import '@/ai/flows/analyze-ta-flow.ts'; 
import '@/ai/flows/analyze-stock-data.ts';
import '@/ai/flows/chat-flow.ts';
import '@/ai/flows/analyze-options-chain-flow.ts';
// DEPRECATED: The two flows below are now handled by the intelligent chat-flow.
// import '@/ai/flows/augmented-ta-search-flow.ts';
// import '@/ai/flows/augmented-options-search-flow.ts';
