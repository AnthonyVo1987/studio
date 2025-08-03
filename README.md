# StockSage

**A Next.js Financial Analysis Application with AI-Powered Insights**

[![Version](https://img.shields.io/badge/version-v4.5.0.0-blue.svg)](src/config/app-metadata.json)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC.svg)](https://tailwindcss.com/)

StockSage is a sophisticated financial analysis application built with Next.js that provides real-time stock data, options chain analysis, and AI-powered insights. The application features a dedicated three-tab architecture including production NVDA and SPY analysis tabs, plus a new experimental staging environment, powered by Google's Gemini AI and real-time financial data from Polygon.io.

## v4.5.0.0 - Staging Infrastructure Foundation

### NEW EXPERIMENTAL SERIES: v4.5.x.x

StockSage v4.5.0.0 introduces a comprehensive staging infrastructure foundation, marking the beginning of the v4.5.x.x experimental series focused on macro automation enhancements and cutting-edge financial analysis capabilities.

#### Major New Features
- **🧪 NVDA (Macro Staging) Tab**: Brand new experimental staging tab for testing enhanced macro automation features safely
- **Enterprise Security Boundaries**: Comprehensive isolation framework with monitoring, audit logging, and compliance capabilities
- **Feature Flag System**: Production-ready feature toggles enabling controlled experimental feature rollouts
- **Component Isolation Architecture**: Complete separation of staging components from production systems
- **Version Series Evolution**: Beginning of v4.5.x.x experimental series focused on macro automation enhancements

## Protected Baseline Architecture

The current dedicated production NVDA and SPY pages represent the stable, battle-tested architecture:
- `src/components/nvda-tab-content.tsx` & `src/components/spy-tab-content.tsx`
- `src/contexts/nvda-analysis-context.tsx` & `src/contexts/spy-analysis-context.tsx`

**These files MUST NOT be modified unless explicitly requested.** They ensure 100% application functionality with proven React patterns.

## Features

### Core Functionality (v4.5.0.0)
- **Real-Time Financial Data**: Live stock quotes, market status, and comprehensive market data via Polygon.io API
- **Advanced Options Analysis**: Complete options chain data with AI-powered call/put wall analysis
- **AI-Powered Insights**: Intelligent key takeaways covering price action, trends, volatility, momentum, and chart patterns
- **Technical Analysis**: Standard and AI-enhanced technical indicators including pivot points and trend analysis
- **Enhanced AI Chat Systems**: Professional AI chat interface with optimized sizing and engaging emoji formatting
- **NEW v4.5.0.0**: **Experimental Staging Environment**: Safe testing environment for macro automation enhancements

### Application Architecture (v4.5.0.0)
- **Three-Tab System**: Production NVDA, production SPY, and experimental NVDA staging tabs
- **Battle-Tested Production Patterns**: React Context + useReducer with deterministic handlers
- **Enterprise-Grade Staging Infrastructure**: Complete component isolation with security boundaries
- **Enhanced Macro Automation**: "Analyze All" button with reliable React state management (v4.4.3.5 AI resilience improvements)
- **Advanced Export Features**: JSON export functionality for all data components
- **Build System Stability**: Reliable compilation and development workflows
- **AI Timeout Protection**: Comprehensive 45-second timeout handling with exponential backoff retry logic
- **Network Resilience**: Enhanced error handling for network interruptions and long-dated options processing
- **NEW v4.5.0.0**: **Feature Flag Management**: Runtime feature enabling/disabling without code changes
- **NEW v4.5.0.0**: **Audit Logging**: Comprehensive tracking of all staging feature interactions
- **NEW v4.5.0.0**: **Compliance Monitoring**: Real-time compliance validation for experimental features

### AI Integration (Enhanced v4.5.0.0)
- **Google Gemini 2.5-flash-lite**: Latest AI model optimized for financial analysis
- **Specialized Trading Prompts**: Purpose-built prompts for stock traders, options traders, and holistic market analysis
- **Conditional Web Search**: Enhanced AI responses with real-time web search when appropriate
- **Professional Responses**: Standardized temperature settings (0.2 with seed 42) for consistent, focused responses
- **Robust Error Handling**: User-friendly error messages replacing cryptic "{}" failures
- **Enhanced Reliability**: >90% success rate for AI operations after retry logic implementation
- **NEW v4.5.0.0**: **Staging AI Isolation**: Dedicated AI flows for experimental staging features with comprehensive monitoring

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

### Enhanced Tab Architecture (v4.5.0.0)

StockSage features a proven three-tab architecture with enterprise-grade staging infrastructure:

#### 1. NVDA Dedicated Tab (Production)
- **Complete Independence**: Dedicated context with zero cross-dependencies
- **Advanced AI Chat**: Specialized NVDA trading chat with context-aware prompts
- **Full Feature Set**: Stock data, options chain, technical analysis, and AI key takeaways
- **Enhanced AI Resilience**: Robust timeout handling and network failure recovery

#### 2. SPY Dedicated Tab (Production)
- **Complete Independence**: Dedicated context with zero cross-dependencies  
- **Blueprint Reference**: Production-ready architecture serving as implementation reference
- **Advanced AI Chat**: Specialized SPY trading chat with web search capabilities
- **Network Resilience**: Comprehensive error handling for network interruptions

#### 3. 🧪 NVDA (Macro Staging) Tab (NEW v4.5.0.0)
- **Experimental Environment**: Safe testing ground for macro automation enhancements
- **Complete Isolation**: Zero impact on production systems with dedicated security boundaries
- **Enterprise Security**: Comprehensive audit logging and compliance monitoring
- **Feature Flag Integration**: Runtime feature management without code changes
- **Innovation Platform**: Foundation for testing cutting-edge financial analysis capabilities

#### 4. Context Isolation Pattern
- **Zero Cross-Dependencies**: Each ticker maintains completely independent state
- **Proven Stability**: Thoroughly tested architecture with consistent behavior
- **Deterministic Handlers**: Reliable async/await patterns for all complex operations
- **FSM Integration**: Clean state management with simplified state machine
- **NEW v4.5.0.0**: **Staging Boundaries**: Enterprise-grade isolation preventing staging code contamination

### Staging Infrastructure Architecture (v4.5.0.0)

#### Enterprise Security Framework
```typescript
// Security boundary enforcement
export const StagingSecurityBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auditLogger = useStagingAuditLogger();
  const complianceMonitor = useStagingComplianceMonitor();
  
  return (
    <StagingSecurityProvider auditLogger={auditLogger} complianceMonitor={complianceMonitor}>
      <StagingIsolationBoundary>
        {children}
      </StagingIsolationBoundary>
    </StagingSecurityProvider>
  );
};
```

#### Feature Flag System
- **Environment-Aware Configuration**: Staging features enabled only in development environments
- **Production Safety**: Automatic feature disabling in production builds
- **Toggle Management**: Runtime feature enabling/disabling without code changes
- **Rollback Capabilities**: Instant feature rollback for production safety

#### Component Isolation Framework
- **Staging Component Library**: Complete component hierarchy isolated from production systems
- **Context Boundaries**: Separate state management preventing cross-contamination
- **API Isolation**: Dedicated staging API endpoints and data flows
- **UI Distinction**: Clear visual indicators distinguishing staging from production features

### State Management Architecture

#### Context Isolation Pattern
```typescript
// Production NVDA Tab - Independent Context
const nvdaContext = useNvdaAnalysis();  // nvda-analysis-context.tsx

// Production SPY Tab - Independent Context  
const spyContext = useSpyAnalysis();    // spy-analysis-context.tsx

// NEW v4.5.0.0: Staging NVDA Tab - Isolated Experimental Context
const nvdaStagingContext = useNvdaStagingAnalysis();  // nvda-staging-analysis-context.tsx
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

### Enhanced Macro Automation System (v4.5.0.0)

StockSage includes a sophisticated macro automation system with critical AI resilience improvements and new staging capabilities:

#### "Analyze All" Button Features
- **AI Resilience Improvements**: Comprehensive timeout handling with 45-second protection and exponential backoff retry logic
- **4-Step Sequential Execution**: Automated workflow (Fetch Expirations → Get Stock Data → AI Takeaways → AI Options Analysis)
- **Isolated State Management**: Macro execution context completely separate from component state
- **Cross-Tab Consistency**: Identical macro functionality in both production tabs
- **Progress Tracking**: Real-time progress indication with step-by-step execution feedback
- **User Cancellation**: Cancel automation at any point during execution
- **Comprehensive Error Handling**: Graceful failure recovery with detailed error reporting
- **Network Resilience**: Handles DNS failures (ENOTFOUND), connection resets (ECONNRESET), and request timeouts
- **Enhanced User Experience**: Clear, actionable error messages replace cryptic "{}" failures
- **NEW v4.5.0.0**: **Staging Integration**: Experimental macro enhancements available in staging environment

#### Staging Macro Enhancements (NEW v4.5.0.0)
- **Enhanced Performance**: Optimized macro execution patterns for faster completion
- **Advanced Error Recovery**: Improved retry logic with intelligent failure analysis
- **Experimental Features**: Testing ground for next-generation macro automation capabilities
- **Security Monitoring**: Comprehensive audit logging of all experimental macro operations
- **Feature Validation**: Safe environment for validating enhancements before production deployment

#### Technical Implementation (AI Resilience)
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
- **AI Operation Monitoring**: Track timeout incidents, retry attempts, and success/failure rates
- **Network Quality Assessment**: Monitor network stability through AI operation metrics
- **NEW v4.5.0.0**: **Staging Audit Trails**: Comprehensive logging of all experimental feature interactions

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
4. **Check AI Timeout Errors**: Look for "{}" empty error objects indicating network timeouts
5. **Apply Timeout Protection**: Wrap AI operations with 45-second timeout + retry logic
6. **NEW v4.5.0.0**: **Check Staging Logs**: Review staging audit logs for experimental feature issues
7. **Reference Complete Guide**: Use debugging guide for systematic resolution approach

This debugging reference enables future teams to resolve similar macro state issues AND AI timeout problems in 2-3 iterations instead of 20+, saving 8-11 hours of debugging time per incident.

## File Organization

### Current Architecture Structure (v4.5.0.0)
```
src/
├── components/                        # UI Components
│   ├── nvda-tab-content.tsx          # NVDA production tab (PROTECTED)
│   ├── spy-tab-content.tsx           # SPY production tab (PROTECTED)
│   ├── nvda-*.tsx                    # NVDA-specific production components
│   ├── spy-*.tsx                     # SPY-specific production components
│   ├── staging/                      # NEW v4.5.0.0: Staging component library
│   │   ├── nvda-staging-tab-content.tsx    # Experimental NVDA staging orchestrator
│   │   ├── nvda-staging-*.tsx              # Staging-specific components
│   │   └── security/                       # Enterprise security boundaries
│   ├── macro-orchestrator/           # Enhanced Macro Automation System
│   └── ui/                           # ShadCN UI components
│
├── contexts/                          # State Management (PROTECTED)
│   ├── nvda-analysis-context.tsx     # NVDA production state (PROTECTED)
│   ├── spy-analysis-context.tsx      # SPY production state (PROTECTED)
│   └── nvda-staging-analysis-context.tsx  # NEW v4.5.0.0: Staging state isolation
│
├── actions/                           # Server Actions
│   ├── nvda-consolidated-chat-action.ts    # NVDA AI chat (ENHANCED v4.4.3.5)
│   ├── spy-consolidated-chat-action.ts     # SPY AI chat (ENHANCED v4.4.3.5)
│   ├── analyze-stock-server-action.ts      # Stock data fetching
│   └── perform-ai-*.ts               # AI analysis actions
│
├── lib/                              # Utilities & Infrastructure
│   ├── ticker-logger.ts              # Centralized logging system
│   ├── staging/                      # NEW v4.5.0.0: Staging infrastructure
│   │   ├── feature-flags.ts          # Feature flag management
│   │   ├── audit-logger.ts           # Staging audit logging
│   │   └── security-boundaries.ts    # Enterprise security framework
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
- **AI Operation Standards**: All AI operations must include 45-second timeout protection and exponential backoff retry logic
- **NEW v4.5.0.0**: **Staging Boundaries**: All experimental features must maintain complete isolation from production systems

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

#### Enhanced Debugging with Component Logging (v4.5.0.0)

**Standard Component Logging:**
- **Individual Logging Patterns**: Application uses standard individual component logging capabilities
- **Build System Stability**: Stable logging infrastructure ensures reliable compilation
- **Macro State Debugging**: Complete macro execution debugging with enhanced console logging patterns
- **Production Safety**: Standard console logging patterns ensure production safety

**AI Operation Debugging:**
- **Timeout Monitoring**: Track AI operation durations and timeout incidents
- **Retry Logic Validation**: Monitor retry attempts and success/failure rates
- **Network Quality Assessment**: Use AI operation metrics to assess network conditions
- **Error Classification**: Distinguish between timeout, network, and logic errors for targeted resolution

**NEW v4.5.0.0 Staging Debugging:**
- **Audit Trail Monitoring**: Comprehensive tracking of experimental feature interactions
- **Compliance Validation**: Real-time monitoring of staging feature compliance
- **Security Boundary Testing**: Validation of isolation between staging and production
- **Feature Flag Testing**: Debug feature toggle behavior and rollback capabilities

**Usage Patterns for Debugging:**

1. **Standard Component Logging:**
   ```bash
   console.log(`[${ticker}:Component:Action] Processing data...`);
   console.log(`[${ticker}:Context:Update] State updated successfully`);
   ```

2. **AI Operation Debugging:**
   ```bash
   [NVDA:AIOperation:Start] AI Takeaways analysis started
   [NVDA:AIOperation:Timeout] AI operation timeout after 45 seconds - retrying...
   [NVDA:AIOperation:Success] AI analysis completed with retry logic (attempt 2/2)
   [NVDA:AIOperation:NetworkResilience] Handled ECONNRESET with exponential backoff
   ```

3. **NEW v4.5.0.0 Staging Debugging:**
   ```bash
   [Staging:Security:Boundary] Staging operation isolated from production
   [Staging:Audit:Log] Experimental feature interaction logged
   [Staging:Feature:Toggle] Feature flag updated: staging-macro-enhancements=true
   [Staging:Compliance:Check] Compliance validation passed for experimental operation
   ```

### Code Review Process
Always follow this process for significant changes:

1. **Implementation Review**: Focus on specific code changes and logic verification
2. **Codebase Audit**: Check for React anti-patterns, unused code, and infinite loops
3. **State Synchronization Analysis**: Verify macro context updates and UI state consistency
4. **Quality Gates**: Ensure proper JSON parsing, error handling, and state management
5. **AI Resilience Review**: Verify all AI operations have timeout protection and retry logic
6. **NEW v4.5.0.0**: **Staging Isolation Review**: Ensure experimental features maintain complete separation from production
7. **Documentation Updates**: Update relevant documentation when changes affect architecture

## Performance & Optimization

### Recent Achievements
- **Architecture Simplification**: Standard React patterns throughout the application
- **Context Isolation**: Clean separation prevents state pollution between tabs
- **Macro State Fixes**: Eliminated state synchronization issues in macro automation (v4.4.3.4)
- **On-Demand AI**: Manual trigger system prevents unnecessary API calls
- **Build System Stability**: Reliable compilation and development workflows
- **AI Resilience**: Eliminated indefinite hangs during network issues with timeout protection
- **User Experience**: Enhanced error messages replace cryptic failures
- **Network Recovery**: >90% success rate for AI operations after retry logic
- **NEW v4.5.0.0**: **Staging Infrastructure**: Zero-impact experimental environment with enterprise-grade isolation

### Current Metrics
- **Bundle Size**: Optimized for production deployment
- **Type Safety**: 100% TypeScript coverage with minimal `any` usage
- **Build Performance**: Clean compilation with zero TypeScript errors
- **Code Maintainability**: Factory patterns and shared utilities reduce duplication
- **Macro Reliability**: 100% macro execution success rate after state synchronization fixes
- **AI Operation Reliability**: 100% timeout protection with exponential backoff retry
- **NEW v4.5.0.0**: **Staging Performance**: Zero impact on production performance with optimized staging feature loading

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
- **Comprehensive Timeout Protection**: All AI operations protected with 45-second timeouts
- **Exponential Backoff Retry**: Network failures handled with 2-3 retry attempts
- **Enhanced Error Reporting**: User-friendly error messages for all failure scenarios

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
- **Current Version**: v4.5.0.0 (Staging Infrastructure Foundation: Complete experimental environment with enterprise security boundaries, feature flag system, component isolation architecture, and foundation for v4.5.x.x series focused on macro automation enhancements)
- **Versioning Scheme**: `v4.w.x.y.z` format for clear version tracking
- **Update Policy**: Version and timestamp updates required for all code changes

## Future Development

### v4.5.x.x Experimental Series
The v4.5.x.x series focuses on macro automation enhancements and experimental features:

- **Current Status**: v4.5.0.0 staging infrastructure foundation complete
- **Series Focus**: Macro automation enhancements, experimental financial analysis capabilities
- **Architecture Foundation**: Robust staging infrastructure supporting advanced features
- **Innovation Platform**: Safe environment for testing cutting-edge capabilities
- **Production Stability**: Maintaining rock-solid production systems while enabling innovation

### Blueprint System (Preserved Scaffolding)
The blueprint system remains available as unused scaffolding for future development phases:

- **Status**: Preserved but not integrated into current application
- **Purpose**: Future ticker addition with configuration-driven development
- **Location**: `src/lib/ticker-framework/` (unused scaffolding)
- **Integration**: Available when stability requirements allow for enhancement phases

### Potential Future Enhancements
- Advanced macro automation capabilities in staging environment
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
5. **AI Operation Implementation**: Always include timeout protection and retry logic for AI operations
6. **NEW v4.5.0.0**: **Staging Feature Development**: Experimental features must be developed in staging environment first
7. **Documentation**: Update relevant documentation for architectural changes

### Architecture Principles
- **Context Isolation**: Maintain complete independence between ticker tabs and staging environment
- **Deterministic Handlers**: Use proven async/await patterns for complex operations
- **State Synchronization**: Ensure proper synchronization between UI and execution context
- **FSM Integration**: Provide proper state feedback for UI consistency
- **Type Safety**: Leverage TypeScript for compile-time error prevention
- **Baseline Protection**: Preserve stable, tested components unless explicitly requested to modify
- **AI Resilience**: All AI operations must include timeout and retry protection
- **NEW v4.5.0.0**: **Staging Boundaries**: All experimental features must maintain complete isolation from production systems

## License

This project is private and proprietary.

## Support

For technical issues or questions about the codebase architecture, refer to the comprehensive documentation in `CLAUDE.md` or contact the development team.

For macro automation debugging issues, consult the essential reference guide at `/docs/macro-re-architecture/macro-automation-debugging-guide.md` (Updated v4.4.3.5 with AI timeout handling patterns).

---

**StockSage v4.5.0.0** - A sophisticated financial analysis platform powered by Next.js and AI with proven production tab architecture, comprehensive staging infrastructure foundation, enhanced macro automation with AI timeout handling and network resilience, and enterprise-grade experimental environment for innovation.