# StockSage

**A Next.js Financial Analysis Application with AI-Powered Insights**

[![Version](https://img.shields.io/badge/version-v4.4.2.15-blue.svg)](src/config/app-metadata.json)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC.svg)](https://tailwindcss.com/)

StockSage is a sophisticated financial analysis application built with Next.js that provides real-time stock data, options chain analysis, and AI-powered insights. The application features a dedicated two-tab architecture for NVDA and SPY analysis, powered by Google's Gemini AI and real-time financial data from Polygon.io.

## Protected Baseline Architecture

The current dedicated NVDA and SPY pages represent the stable, battle-tested architecture:
- `src/components/nvda-tab-content.tsx` & `src/components/spy-tab-content.tsx`
- `src/contexts/nvda-analysis-context.tsx` & `src/contexts/spy-analysis-context.tsx`

**These files MUST NOT be modified unless explicitly requested.** They ensure 100% application functionality with proven React patterns.

## Features

### Core Functionality
- **Real-Time Financial Data**: Live stock quotes, market status, and comprehensive market data via Polygon.io API
- **Advanced Options Analysis**: Complete options chain data with AI-powered call/put wall analysis
- **AI-Powered Insights**: Intelligent key takeaways covering price action, trends, volatility, momentum, and chart patterns
- **Technical Analysis**: Standard and AI-enhanced technical indicators including pivot points and trend analysis
- **Enhanced AI Chat Systems**: Professional AI chat interface with optimized sizing and engaging emoji formatting

### Application Architecture (v4.4.2.15)
- **Dedicated Two-Tab System**: Clean NVDA and SPY analysis pages with complete context isolation
- **Battle-Tested Patterns**: React Context + useReducer with deterministic handlers
- **Enhanced Macro Automation**: "Analyze All" button with macro-aware state isolation and validation
- **Advanced Export Features**: JSON export functionality for all data components
- **Build System Stability**: Reliable compilation and development workflows

### AI Integration
- **Google Gemini 2.5-flash-lite**: Latest AI model optimized for financial analysis
- **Specialized Trading Prompts**: Purpose-built prompts for stock traders, options traders, and holistic market analysis
- **Conditional Web Search**: Enhanced AI responses with real-time web search when appropriate
- **Professional Responses**: Standardized temperature settings (0.2 with seed 42) for consistent, focused responses

## Technology Stack

### Frontend Architecture
- **Next.js 15.3.3**: Modern React framework with App Router architecture
- **React 18.3.1**: Latest React with Server Components and concurrent features
- **TypeScript**: Full type safety with strict mode enabled
- **Tailwind CSS 3.4.1**: Utility-first CSS framework with custom theme variables
- **ShadCN UI**: High-quality, accessible React components

### Backend & AI
- **Google Genkit 1.8.0**: AI flow orchestration and management
- **Google AI SDK**: Direct integration with Gemini models for enhanced stability
- **Server Actions**: Next.js server-side logic for API integration
- **Zod Validation**: Runtime type checking and data validation

### Data Sources & APIs
- **Polygon.io**: Primary source for real-time stock and options data
- **Google Search API**: Enhanced AI responses with real-time web information

## Getting Started

### Prerequisites
- Node.js (latest LTS version recommended)
- npm or yarn package manager
- API keys for Polygon.io and Google AI

### Environment Setup

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd studio
   npm install
   ```

2. **Configure environment variables**
   
   Create a `.env` file in the project root:
   ```env
   POLYGON_API_KEY=your_polygon_api_key
   GEMINI_API_KEY=your_google_ai_api_key
   ```

### Development Commands

#### Primary Development
```bash
# Start Next.js development server (USER RESERVED PORT)
npm run dev          # Runs on http://localhost:9002

# Start Genkit AI development server (USER RESERVED PORT)
npm run genkit:dev   # Runs on http://localhost:3400
npm run genkit:watch # Runs with file watching enabled
```

#### Code Quality & Build
```bash
npm run lint         # ESLint linting (fully configured)
npm run typecheck    # TypeScript type checking
npm run build        # Production build
npm run start        # Production server
```

### Port Usage Guidelines

**USER RESERVED PORTS** (for development and testing):
- **Port 9002**: Next.js development server
- **Port 3400**: Genkit AI development server

**INTERNAL TESTING PORTS** (for code review and internal testing):
```bash
# Use these ports for internal testing to avoid conflicts
next dev --turbopack -p 9003    # Internal dev server testing
genkit start -p 3401            # Internal Genkit testing
```

## Application Architecture

### Dedicated Tab Architecture (v4.4.2.15)

StockSage features a proven two-tab architecture with complete context isolation:

#### 1. NVDA Dedicated Tab
- **Complete Independence**: Dedicated context with zero cross-dependencies
- **Advanced AI Chat**: Specialized NVDA trading chat with context-aware prompts
- **Full Feature Set**: Stock data, options chain, technical analysis, and AI key takeaways

#### 2. SPY Dedicated Tab
- **Complete Independence**: Dedicated context with zero cross-dependencies  
- **Blueprint Reference**: Production-ready architecture serving as implementation reference
- **Advanced AI Chat**: Specialized SPY trading chat with web search capabilities

#### 3. Context Isolation Pattern
- **Zero Cross-Dependencies**: Each ticker maintains completely independent state
- **Proven Stability**: Thoroughly tested architecture with consistent behavior
- **Deterministic Handlers**: Reliable async/await patterns for all complex operations
- **FSM Integration**: Clean state management with simplified state machine

### State Management Architecture

#### Context Isolation Pattern
```typescript
// NVDA Tab - Independent Context
const nvdaContext = useNvdaAnalysis();  // nvda-analysis-context.tsx

// SPY Tab - Independent Context  
const spyContext = useSpyAnalysis();    // spy-analysis-context.tsx
```

#### Deterministic Handler Pattern
```typescript
const handleAnalyzeStock = async () => {
  // Set loading state
  dispatchFsmEvent({ type: 'SET_LOADING' });
  
  try {
    // Execute server action
    const result = await analyzeStockAction({...});
    
    // Update state based on result
    if (result.status === 'success') {
      setStockData(result.data);
    }
  } finally {
    // Reset to idle state
    dispatchFsmEvent({ type: 'SET_IDLE' });
  }
};
```

### AI Flow Architecture

#### Specialized Prompt System
The application includes three distinct AI analysis modes:

1. **Stock Trader Takeaways** - Trading-focused market analysis
2. **Options Trader Takeaways** - Options-specific strategy analysis  
3. **Holistic Takeaways** - Comprehensive market analysis

#### Server Actions Integration
```
src/actions/
├── analyze-stock-server-action.ts     # Core stock data fetching
├── analyze-ta-action.ts               # Technical analysis
├── perform-ai-analysis-action.ts      # AI key takeaways
├── perform-ai-options-analysis-action.ts # AI options analysis
├── nvda-consolidated-chat-action.ts   # NVDA AI chat
└── spy-consolidated-chat-action.ts    # SPY AI chat
```

### Enhanced Macro Automation System (v4.4.2.15)

StockSage includes a sophisticated macro automation system with macro-aware state isolation:

#### "Analyze All" Button Features
- **Macro-Aware State Validation**: Dedicated validation functions that prioritize macro context over shared state
- **Enhanced State Capture**: useRef-based immediate state access for reliable Step 1 expiration capture
- **4-Step Sequential Execution**: Automated workflow (Fetch Expirations → Get Stock Data → AI Takeaways → AI Options Analysis)
- **Isolated State Management**: Macro execution context completely separate from component state
- **Cross-Tab Consistency**: Identical macro functionality in both NVDA and SPY tabs
- **Progress Tracking**: Real-time progress indication with step-by-step execution feedback
- **User Cancellation**: Cancel automation at any point during execution
- **Comprehensive Error Handling**: Graceful failure recovery with detailed error reporting

#### Enhanced Debugging Capabilities
- **Isolated Macro State**: Complete separation between macro execution context and component state
- **Enhanced Console Logging**: Comprehensive state tracking with execution IDs, timing metrics, and anomaly detection
- **Performance Optimized**: Enhanced debugging maintains <1.5ms production overhead
- **Production Safety**: Standard console logging patterns with proper error handling

#### Technical Implementation (v4.4.2.15 Critical Bug Fix)
```typescript
// Macro-aware validation that prioritizes macro context
const isMacroExpirationSelected = useCallback(() => {
  // Check macro context first (immediate access via ref)
  if (macroContextRef.current?.selectedExpirationDate) {
    return true;
  }
  
  // Fallback to shared state for non-macro operations
  return nvda.selectedExpirationDate ? true : false;
}, [nvda.selectedExpirationDate]);

// Enhanced state capture for Step 1
const captureExpirationFromStep1 = useCallback((expiration: string) => {
  // Update both state and ref for immediate macro access
  nvda.setSelectedExpirationDate(expiration);
  
  if (macroContextRef.current) {
    macroContextRef.current.selectedExpirationDate = expiration;
  }
}, [nvda]);
```

#### Bug Fix Details (v4.4.2.15)
- **Issue**: Macro automation from v4.4.2.14 wasn't working - Steps 2-4 were skipped because macro context wasn't capturing expiration from Step 1
- **Root Cause**: Validation functions were checking shared state instead of macro-isolated state, missing immediate updates from Step 1
- **Solution**: Implemented macro-aware validation functions with useRef for immediate state access and dual state capture
- **Result**: Macro automation now works reliably with proper state isolation and immediate capture mechanisms

## File Organization

### Current Architecture Structure (v4.4.2.15)
```
src/
├── components/                        # UI Components
│   ├── nvda-tab-content.tsx          # NVDA dedicated tab (PROTECTED)
│   ├── spy-tab-content.tsx           # SPY dedicated tab (PROTECTED)
│   ├── nvda-*.tsx                    # NVDA-specific components
│   ├── spy-*.tsx                     # SPY-specific components
│   ├── macro-orchestrator/           # Enhanced Macro Automation System
│   └── ui/                           # ShadCN UI components
│
├── contexts/                          # State Management (PROTECTED)
│   ├── nvda-analysis-context.tsx     # NVDA independent state
│   └── spy-analysis-context.tsx      # SPY independent state
│
├── actions/                           # Server Actions
│   ├── nvda-consolidated-chat-action.ts  # NVDA AI chat
│   ├── spy-consolidated-chat-action.ts   # SPY AI chat
│   ├── analyze-stock-server-action.ts    # Stock data fetching
│   └── perform-ai-*.ts               # AI analysis actions
│
├── lib/                              # Utilities & Infrastructure
│   ├── ticker-logger.ts              # Centralized logging system
│   ├── ticker-framework/             # Blueprint system (UNUSED)
│   └── utils.ts                      # Shared utilities
│
├── ai/                               # AI System
│   ├── flows/                        # Genkit AI flows
│   ├── definitions/                  # JSON prompt templates
│   └── schemas/                      # Zod validation schemas
│
└── types/                            # TypeScript definitions
```

### Blueprint Framework (Preserved as Unused Scaffolding)
```
src/lib/ticker-framework/              # UNUSED - Future development scaffolding
├── core/
│   ├── context-factory.ts            # Context generation templates
│   ├── base-components/              # Component templates (unused)
│   └── types.ts                      # Blueprint type definitions
└── examples/                         # Usage examples and guides
```

## Development Guidelines

### Code Quality Standards
- **TypeScript Strict Mode**: Full type safety with `import type` for type imports
- **Error Handling**: Comprehensive `try...catch` blocks for all async operations
- **ESLint Integration**: Fully configured linting with custom rules
- **Consistent Patterns**: Factory patterns and shared utilities for maintainability

### UI/UX Conventions
- **ShadCN Components**: High-quality, accessible React components
- **Tailwind CSS**: Utility-first styling approach with custom theme variables
- **Responsive Design**: Mobile-first approach with proper breakpoints
- **Dark Mode Support**: Full theme switching capabilities
- **Lucide React Icons**: Consistent iconography throughout the application

### Data Handling Best Practices
- **Zod Validation**: Runtime type checking for all API responses
- **Safe JSON Parsing**: Try/catch patterns for all JSON operations
- **Loading States**: Derived from FSM state for consistent UI feedback
- **Export Functionality**: "Copy JSON" and "Export JSON" on all data cards

## Testing & Quality Assurance

### Development Testing
- **Manual Testing Required**: No formal test suite - rely on comprehensive manual testing
- **Built-in Debug Tools**: Debug tabs for raw JSON inspection and application state monitoring
- **ESLint & TypeScript**: Run `npm run lint` and `npm run typecheck` before committing

### Debug Features
- **Debug Tabs**: Raw JSON inputs/outputs for all major data segments
- **State Monitoring**: Real-time FSM state and context variable inspection
- **Export Functionality**: Debug snapshot export for comprehensive bug reporting

#### Enhanced Debugging with Component Logging (v4.4.2.15)

**Standard Component Logging:**
- **Individual Logging Patterns**: Application uses standard individual component logging capabilities
- **Build System Stability**: Stable logging infrastructure ensures reliable compilation
- **Macro State Debugging**: Complete macro execution debugging with enhanced console logging patterns
- **Production Safety**: Standard console logging patterns ensure production safety

**Macro State Debugging (Enhanced v4.4.2.15):**
- **Macro-Aware State Tracking**: Complete visibility into macro-isolated state separate from shared component state
- **Immediate State Access**: useRef-based state capture for reliable Step 1 expiration handling
- **Three-Tier Validation**: Macro context → useRef → shared state validation hierarchy
- **Execution Flow Analysis**: Step-by-step macro execution with timing metrics and progress tracking
- **Anomaly Detection**: Automatic detection of state inconsistencies and execution irregularities

**Usage Patterns for Debugging:**

1. **Standard Component Logging:**
   ```bash
   console.log(`[${ticker}:Component:Action] Processing data...`);
   console.log(`[${ticker}:Context:Update] State updated successfully`);
   ```

2. **Macro Execution Debugging (Enhanced v4.4.2.15):**
   ```bash
   [NVDA:MacroOrchestrator:StateCapture] Expiration captured via useRef: 2024-12-20
   [NVDA:MacroOrchestrator:Validation:MacroAware] Using macro context for validation
   [NVDA:MacroOrchestrator:Context:ExecutionID-abc123] Macro-isolated state initialized
   [NVDA:MacroOrchestrator:UserAction:Complete] All 4 steps completed successfully
   ```

### Code Review Process
Always follow this process for significant changes:

1. **Implementation Review**: Focus on specific code changes and logic verification
2. **Codebase Audit**: Check for React anti-patterns, unused code, and infinite loops
3. **Quality Gates**: Ensure proper JSON parsing, error handling, and state management
4. **Documentation Updates**: Update relevant documentation when changes affect architecture

## Performance & Optimization

### Recent Achievements
- **Architecture Simplification**: Standard React patterns throughout the application
- **Context Isolation**: Clean separation prevents state pollution between tabs
- **On-Demand AI**: Manual trigger system prevents unnecessary API calls
- **Build System Stability**: Reliable compilation and development workflows

### Current Metrics
- **Bundle Size**: Optimized for production deployment
- **Type Safety**: 100% TypeScript coverage with minimal `any` usage
- **Build Performance**: Clean compilation with zero TypeScript errors
- **Code Maintainability**: Factory patterns and shared utilities reduce duplication

## API Integration

### Polygon.io Integration
- **Real-Time Data**: Stock quotes, market status, and options chains
- **Error Handling**: Comprehensive retry logic and graceful degradation
- **Rate Limiting**: Built-in request management to stay within API limits
- **Data Validation**: Zod schemas for all API response validation

### Google AI Integration
- **Gemini 2.5-flash-lite**: Latest model optimized for financial analysis
- **Contextual Prompts**: Specialized prompts for different analysis types
- **Web Search Enhancement**: Conditional web search for enhanced AI responses
- **Request Management**: Race condition protection and timeout handling

## Environment & Configuration

### Required Environment Variables
```env
POLYGON_API_KEY=your_polygon_api_key    # Polygon.io API access
GEMINI_API_KEY=your_google_ai_api_key   # Google AI API access
```

### Build Configuration
- **TypeScript Errors**: Ignored during builds for deployment flexibility
- **ESLint Errors**: Ignored during builds (see `next.config.ts`)
- **Strict Development**: Full type checking and linting in development mode

## Version Management

- **Version Source**: `src/config/app-metadata.json` (single source of truth)
- **Current Version**: v4.4.2.15 (macro state capture bug fix - enhanced macro-aware validation)
- **Versioning Scheme**: `v4.w.x.y.z` format for clear version tracking
- **Update Policy**: Version and timestamp updates required for all code changes

## Future Development

### Blueprint System (Preserved Scaffolding)
The blueprint system remains available as unused scaffolding for future development phases:

- **Status**: Preserved but not integrated into current application
- **Purpose**: Future ticker addition with configuration-driven development
- **Location**: `src/lib/ticker-framework/` (unused scaffolding)
- **Integration**: Available when stability requirements allow for enhancement phases

### Potential Future Enhancements
- Blueprint system integration for additional ticker support
- Enhanced AI analysis capabilities
- Advanced charting and visualization features
- Portfolio tracking and management tools

## Contributing

### Development Workflow
1. **Environment Setup**: Configure API keys and install dependencies
2. **Feature Development**: Use appropriate context patterns and maintain isolation
3. **Testing**: Manual testing with built-in debug tools
4. **Code Quality**: Run linting and type checking before commits
5. **Documentation**: Update relevant documentation for architectural changes

### Architecture Principles
- **Context Isolation**: Maintain complete independence between ticker tabs
- **Deterministic Handlers**: Use proven async/await patterns for complex operations
- **FSM Integration**: Provide proper state feedback for UI consistency
- **Type Safety**: Leverage TypeScript for compile-time error prevention
- **Baseline Protection**: Preserve stable, tested components unless explicitly requested to modify

## License

This project is private and proprietary.

## Support

For technical issues or questions about the codebase architecture, refer to the comprehensive documentation in `CLAUDE.md` or contact the development team.

---

**StockSage v4.4.2.15** - A sophisticated financial analysis platform powered by Next.js and AI with proven dedicated tab architecture, enhanced macro automation with macro-aware state isolation, and production-ready autonomous task completion.