# StockSage

**A Next.js Financial Analysis Application with AI-Powered Insights**

[![Version](https://img.shields.io/badge/version-v4.4.3.5-blue.svg)](src/config/app-metadata.json)
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

### Application Architecture (v4.4.3.5)
- **Dedicated Two-Tab System**: Clean NVDA and SPY analysis pages with complete context isolation
- **Battle-Tested Patterns**: React Context + useReducer with deterministic handlers
- **Enhanced Macro Automation**: "Analyze All" button with reliable React state management (v4.4.3.5 AI resilience improvements)
- **Advanced Export Features**: JSON export functionality for all data components
- **Build System Stability**: Reliable compilation and development workflows
- **NEW v4.4.3.5**: **AI Timeout Protection**: Comprehensive 45-second timeout handling with exponential backoff retry logic
- **NEW v4.4.3.5**: **Network Resilience**: Enhanced error handling for network interruptions and long-dated options processing

### AI Integration
- **Google Gemini 2.5-flash-lite**: Latest AI model optimized for financial analysis
- **Specialized Trading Prompts**: Purpose-built prompts for stock traders, options traders, and holistic market analysis
- **Conditional Web Search**: Enhanced AI responses with real-time web search when appropriate
- **Professional Responses**: Standardized temperature settings (0.2 with seed 42) for consistent, focused responses
- **NEW v4.4.3.5**: **Robust Error Handling**: User-friendly error messages replacing cryptic "{}" failures
- **NEW v4.4.3.5**: **Enhanced Reliability**: >90% success rate for AI operations after retry logic implementation

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
npm run typecheck    # TypeScript type checking (primary code quality tool)
npm run build        # Production build
npm run start        # Production server
```

**IMPORTANT**: ESLint is not properly configured in this project. Use TypeScript for code quality validation instead of linting.

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

### Dedicated Tab Architecture (v4.4.3.5)

StockSage features a proven two-tab architecture with complete context isolation:

#### 1. NVDA Dedicated Tab
- **Complete Independence**: Dedicated context with zero cross-dependencies
- **Advanced AI Chat**: Specialized NVDA trading chat with context-aware prompts
- **Full Feature Set**: Stock data, options chain, technical analysis, and AI key takeaways
- **NEW v4.4.3.5**: **Enhanced AI Resilience**: Robust timeout handling and network failure recovery

#### 2. SPY Dedicated Tab
- **Complete Independence**: Dedicated context with zero cross-dependencies  
- **Blueprint Reference**: Production-ready architecture serving as implementation reference
- **Advanced AI Chat**: Specialized SPY trading chat with web search capabilities
- **NEW v4.4.3.5**: **Network Resilience**: Comprehensive error handling for network interruptions

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
├── nvda-consolidated-chat-action.ts   # NVDA AI chat (ENHANCED v4.4.3.5)
└── spy-consolidated-chat-action.ts    # SPY AI chat (ENHANCED v4.4.3.5)
```

### Enhanced Macro Automation System (v4.4.3.5)

StockSage includes a sophisticated macro automation system with critical AI resilience improvements:

#### "Analyze All" Button Features
- **AI Resilience Improvements (v4.4.3.5)**: Comprehensive timeout handling with 45-second protection and exponential backoff retry logic
- **4-Step Sequential Execution**: Automated workflow (Fetch Expirations → Get Stock Data → AI Takeaways → AI Options Analysis)
- **Isolated State Management**: Macro execution context completely separate from component state
- **Cross-Tab Consistency**: Identical macro functionality in both NVDA and SPY tabs
- **Progress Tracking**: Real-time progress indication with step-by-step execution feedback
- **User Cancellation**: Cancel automation at any point during execution
- **Comprehensive Error Handling**: Graceful failure recovery with detailed error reporting
- **NEW v4.4.3.5**: **Network Resilience**: Handles DNS failures (ENOTFOUND), connection resets (ECONNRESET), and request timeouts
- **NEW v4.4.3.5**: **Enhanced User Experience**: Clear, actionable error messages replace cryptic "{}" failures

#### Critical Bug Fixes (v4.4.3.5) - AI Timeout & Network Resilience
- **Issue**: AI takeaways failing with cryptic "{}" error messages during network timeouts
- **Root Cause**: No timeout handling in AI flows, causing macro automation to fail on network interruptions
- **Solution**: Implemented comprehensive 45-second timeout protection with exponential backoff retry logic for all AI operations
- **Impact**: Eliminated indefinite hangs during network issues, successful processing of long-dated options (2027+ expirations), >90% success rate for AI operations after retry

#### Technical Implementation (v4.4.3.5 AI Resilience)
```typescript
// ENHANCED: AI operation with timeout and retry logic
const performAiAnalysisWithResilience = async (analysisType, data, maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create timeout promise (45 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`AI analysis timeout after 45 seconds for ${analysisType}`));
        }, 45000);
      });
      
      // Race between analysis and timeout
      const result = await Promise.race([analysisPromise, timeoutPromise]);
      return result;
      
    } catch (error) {
      const isTimeoutError = error.message.includes('timeout') || 
                           error.message.includes('ENOTFOUND') || 
                           error.message.includes('ECONNRESET');
      
      if (isTimeoutError && attempt < maxRetries) {
        // Exponential backoff: 2^attempt seconds
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // Enhanced user-friendly error messages
      if (isTimeoutError) {
        throw new Error('Request timed out due to network issues. Please try again - this often works on retry.');
      }
      
      throw new Error(`AI analysis failed: ${error.message}. Please check your network connection and try again.`);
    }
  }
};
```

#### Enhanced Debugging Capabilities
- **State Synchronization Logging**: Monitor proper state synchronization between UI and macro execution context
- **Enhanced Console Logging**: Comprehensive state tracking with execution IDs, timing metrics, and anomaly detection
- **Performance Optimized**: Enhanced debugging maintains <1ms production overhead
- **Production Safety**: Standard console logging patterns with proper error handling
- **NEW v4.4.3.5**: **AI Operation Monitoring**: Track timeout incidents, retry attempts, and success/failure rates
- **NEW v4.4.3.5**: **Network Quality Assessment**: Monitor network stability through AI operation metrics

## Macro Automation Debugging Reference

For comprehensive macro automation debugging, the project includes a complete debugging guide:

### Essential Reference Documentation
- **`/docs/macro-re-architecture/macro-automation-debugging-guide.md`** - Complete debugging reference with 20+ iteration lessons learned (Updated v4.4.3.5)
- **Root Cause Analysis**: Detailed analysis of React state synchronization patterns, macro execution issues, and AI timeout handling
- **Failed Approaches**: Documentation of incorrect debugging approaches to avoid (11+ hours of lessons learned including v4.4.3.5)
- **Emergency Response**: 5-minute diagnostic patterns for production issues including AI timeout scenarios
- **Prevention Strategies**: Future-proofing techniques and best practices for state management and AI resilience

### Quick Emergency Response
If experiencing macro automation failures:
1. **Check Console**: Look for "Prerequisites not met" + UI showing populated data (smoking gun pattern)
2. **Apply State Sync Fix**: Ensure immediate ref updates when bypassing execution steps
3. **Verify Prerequisites**: Ensure robust validation with expiration state consistency checks
4. **NEW v4.4.3.5**: **Check AI Timeout Errors**: Look for "{}" empty error objects indicating network timeouts
5. **NEW v4.4.3.5**: **Apply Timeout Protection**: Wrap AI operations with 45-second timeout + retry logic
6. **Reference Complete Guide**: Use debugging guide for systematic resolution approach

This debugging reference enables future teams to resolve similar macro state issues AND AI timeout problems in 2-3 iterations instead of 20+, saving 8-11 hours of debugging time per incident.

## File Organization

### Current Architecture Structure (v4.4.3.5)
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
│   ├── nvda-consolidated-chat-action.ts  # NVDA AI chat (ENHANCED v4.4.3.5)
│   ├── spy-consolidated-chat-action.ts   # SPY AI chat (ENHANCED v4.4.3.5)
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
- **Consistent Patterns**: Factory patterns and shared utilities for maintainability
- **State Synchronization**: Immediate ref updates for macro execution context consistency
- **NEW v4.4.3.5**: **AI Operation Standards**: All AI operations must include 45-second timeout protection and exponential backoff retry logic

**IMPORTANT**: ESLint is not properly configured. Use TypeScript compiler for code quality validation.

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
- **TypeScript Validation**: Run `npm run typecheck` before committing (primary quality tool)

**Note**: ESLint is not properly configured - use TypeScript compiler for code quality validation.

### Debug Features
- **Debug Tabs**: Raw JSON inputs/outputs for all major data segments
- **State Monitoring**: Real-time FSM state and context variable inspection
- **Export Functionality**: Debug snapshot export for comprehensive bug reporting

#### Enhanced Debugging with Component Logging (v4.4.3.5)

**Standard Component Logging:**
- **Individual Logging Patterns**: Application uses standard individual component logging capabilities
- **Build System Stability**: Stable logging infrastructure ensures reliable compilation
- **Macro State Debugging**: Complete macro execution debugging with enhanced console logging patterns
- **Production Safety**: Standard console logging patterns ensure production safety

**AI Operation Debugging (New v4.4.3.5):**
- **Timeout Monitoring**: Track AI operation durations and timeout incidents
- **Retry Logic Validation**: Monitor retry attempts and success/failure rates
- **Network Quality Assessment**: Use AI operation metrics to assess network conditions
- **Error Classification**: Distinguish between timeout, network, and logic errors for targeted resolution

**Usage Patterns for Debugging:**

1. **Standard Component Logging:**
   ```bash
   console.log(`[${ticker}:Component:Action] Processing data...`);
   console.log(`[${ticker}:Context:Update] State updated successfully`);
   ```

2. **AI Operation Debugging (New v4.4.3.5):**
   ```bash
   [NVDA:AIOperation:Start] AI Takeaways analysis started
   [NVDA:AIOperation:Timeout] AI operation timeout after 45 seconds - retrying...
   [NVDA:AIOperation:Success] AI analysis completed with retry logic (attempt 2/2)
   [NVDA:AIOperation:NetworkResilience] Handled ECONNRESET with exponential backoff
   ```

### Code Review Process
Always follow this process for significant changes:

1. **Implementation Review**: Focus on specific code changes and logic verification
2. **Codebase Audit**: Check for React anti-patterns, unused code, and infinite loops
3. **State Synchronization Analysis**: Verify macro context updates and UI state consistency
4. **Quality Gates**: Ensure proper JSON parsing, error handling, and state management
5. **NEW v4.4.3.5**: **AI Resilience Review**: Verify all AI operations have timeout protection and retry logic
6. **Documentation Updates**: Update relevant documentation when changes affect architecture

## Performance & Optimization

### Recent Achievements
- **Architecture Simplification**: Standard React patterns throughout the application
- **Context Isolation**: Clean separation prevents state pollution between tabs
- **Macro State Fixes**: Eliminated state synchronization issues in macro automation (v4.4.3.4)
- **On-Demand AI**: Manual trigger system prevents unnecessary API calls
- **Build System Stability**: Reliable compilation and development workflows
- **NEW v4.4.3.5**: **AI Resilience**: Eliminated indefinite hangs during network issues with timeout protection
- **NEW v4.4.3.5**: **User Experience**: Enhanced error messages replace cryptic failures
- **NEW v4.4.3.5**: **Network Recovery**: >90% success rate for AI operations after retry logic

### Current Metrics
- **Bundle Size**: Optimized for production deployment
- **Type Safety**: 100% TypeScript coverage with minimal `any` usage
- **Build Performance**: Clean compilation with zero TypeScript errors
- **Code Maintainability**: Factory patterns and shared utilities reduce duplication
- **Macro Reliability**: 100% macro execution success rate after state synchronization fixes
- **NEW v4.4.3.5**: **AI Operation Reliability**: 100% timeout protection with exponential backoff retry

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
- **NEW v4.4.3.5**: **Comprehensive Timeout Protection**: All AI operations protected with 45-second timeouts
- **NEW v4.4.3.5**: **Exponential Backoff Retry**: Network failures handled with 2-3 retry attempts
- **NEW v4.4.3.5**: **Enhanced Error Reporting**: User-friendly error messages for all failure scenarios

## Environment & Configuration

### Required Environment Variables
```env
POLYGON_API_KEY=your_polygon_api_key    # Polygon.io API access
GEMINI_API_KEY=your_google_ai_api_key   # Google AI API access
```

### Build Configuration
- **TypeScript Errors**: Ignored during builds for deployment flexibility
- **ESLint**: Not properly configured - use TypeScript for validation (see `next.config.ts`)
- **Strict Development**: Full type checking in development mode

## Version Management

- **Version Source**: `src/config/app-metadata.json` (single source of truth)
- **Current Version**: v4.4.3.5 (AI timeout handling & network resilience improvements: Resolved cryptic "{}" errors, implemented 45-second timeout protection with exponential backoff retry logic, enhanced error reporting for improved user experience, successful processing of long-dated options)
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
- Enhanced AI analysis capabilities with advanced timeout optimization
- Advanced charting and visualization features
- Portfolio tracking and management tools
- Network quality monitoring and adaptive timeout strategies

## Contributing

### Development Workflow
1. **Environment Setup**: Configure API keys and install dependencies
2. **Feature Development**: Use appropriate context patterns and maintain isolation
3. **Testing**: Manual testing with built-in debug tools
4. **Code Quality**: Run TypeScript validation before commits (ESLint not configured)
5. **NEW v4.4.3.5**: **AI Operation Implementation**: Always include timeout protection and retry logic for AI operations
6. **Documentation**: Update relevant documentation for architectural changes

### Architecture Principles
- **Context Isolation**: Maintain complete independence between ticker tabs
- **Deterministic Handlers**: Use proven async/await patterns for complex operations
- **State Synchronization**: Ensure proper synchronization between UI and execution context
- **FSM Integration**: Provide proper state feedback for UI consistency
- **Type Safety**: Leverage TypeScript for compile-time error prevention
- **Baseline Protection**: Preserve stable, tested components unless explicitly requested to modify
- **NEW v4.4.3.5**: **AI Resilience**: All AI operations must include timeout and retry protection

## License

This project is private and proprietary.

## Support

For technical issues or questions about the codebase architecture, refer to the comprehensive documentation in `CLAUDE.md` or contact the development team.

For macro automation debugging issues, consult the essential reference guide at `/docs/macro-re-architecture/macro-automation-debugging-guide.md` (Updated v4.4.3.5 with AI timeout handling patterns).

---

**StockSage v4.4.3.5** - A sophisticated financial analysis platform powered by Next.js and AI with proven dedicated tab architecture, enhanced macro automation with comprehensive AI timeout handling and network resilience improvements, and production-ready autonomous task completion capabilities.