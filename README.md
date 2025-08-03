# StockSage

**A Next.js Financial Analysis Application with AI-Powered Insights**

[![Version](https://img.shields.io/badge/version-v4.5.3.0-blue.svg)](src/config/app-metadata.json)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC.svg)](https://tailwindcss.com/)

StockSage is a sophisticated financial analysis application built with Next.js that provides real-time stock data, options chain analysis, and AI-powered insights. The application features a dedicated two-tab architecture for NVDA and SPY analysis, powered by Google's Gemini AI and real-time financial data from Polygon.io. **NEW v4.5.3.0**: Completed comprehensive macro re-architecture analysis with 3 viable implementation options and strategic decision framework ready for implementation phase.

## Protected Baseline Architecture

The current dedicated NVDA and SPY pages represent the stable, battle-tested architecture:
- `src/components/nvda-tab-content.tsx` & `src/components/spy-tab-content.tsx`
- `src/contexts/nvda-analysis-context.tsx` & `src/contexts/spy-analysis-context.tsx`

**These files MUST NOT be modified unless explicitly requested.** They ensure 100% application functionality with proven React patterns.

## Macro Re-Architecture Analysis Complete (v4.5.3.0)

**PROJECT STATUS**: ✅ **MACRO RE-ARCHITECTURE ANALYSIS COMPLETE**  
**DOCUMENTATION STATUS**: ✅ **CODE REVIEW PASSED**  
**NEXT PHASE**: Implementation Decision & Development  

### Comprehensive Analysis Delivered

StockSage now features a complete macro automation re-architecture analysis with strategic decision framework and implementation-ready documentation.

#### Key Achievements:
- **📋 Complete Technical Analysis**: Comprehensive evaluation of 3 viable re-architecture options
- **📄 Strategic Decision Framework**: Clear criteria for selecting optimal architectural approach
- **⭐ 3 Implementation Options**: XState (4-5 days), Command Pattern (5-6 days), Hybrid (20-25 days)
- **🎯 Implementation Roadmaps**: Step-by-step migration strategies with timeline estimates
- **📊 Technical Specifications**: Detailed Product Requirements Documents (PRDs) for all options
- **🔧 Risk Assessment**: Comprehensive analysis of implementation challenges and mitigation strategies

#### Current System Analysis:
- **Current State**: 1,400+ lines of complex macro automation code
- **Technical Debt**: High complexity React closure patterns, difficult maintenance, limited extensibility
- **Success Rate**: 100% execution reliability using useRef escape hatch patterns
- **Performance**: 5-11 second baseline, up to 45 seconds for complex operations with AI timeout protection

#### Re-Architecture Options Available:

**1. XState State Machine (Option 2)** ⭐ **PRIMARY RECOMMENDATION**  
- **Implementation**: 4-5 days  
- **Benefits**: 65% complexity reduction, impossible invalid states, visual debugging  
- **Best For**: Fast implementation with proven state machine patterns  

**2. Command Pattern (Option 3)** ⭐ **ALTERNATIVE RECOMMENDATION**  
- **Implementation**: 5-6 days  
- **Benefits**: Complete separation of concerns, excellent testability  
- **Best For**: Maximum testability and enterprise security requirements  

**3. Hybrid Command + XState (Option 4)** 🚀 **FUTURE-PROOF CHOICE**  
- **Implementation**: 20-25 days  
- **Benefits**: Ultimate modularity, AI-native integration, plugin ecosystem  
- **Best For**: Revolutionary architecture with unlimited extensibility  

#### Documentation Structure:
```
/docs/macro-re-architecture/
├── README.md                                     # Project hub and status
├── comprehensive-architecture-decision-analysis.md # Complete decision analysis
├── strategic-implementation-guide.md            # Strategic guidance
├── option-2-xstate-prd.md                      # XState PRD
├── option-3-command-pattern-prd.md             # Command Pattern PRD
├── option-4-hybrid-command-xstate-prd.md       # Hybrid PRD
└── macro-automation-debugging-guide.md         # Current system debugging
```

#### Next Steps:
1. **Review Documentation**: Study comprehensive analysis and decision framework
2. **Select Architecture**: Choose from 3 viable options based on requirements
3. **Implementation Planning**: Use provided roadmaps and timelines
4. **Development Execution**: Begin implementation of selected architectural approach

**REFERENCE**: For complete analysis, refer to `/docs/macro-re-architecture/README.md` and comprehensive documentation suite.

## Features

### Core Functionality
- **Real-Time Financial Data**: Live stock quotes, market status, and comprehensive market data via Polygon.io API
- **Advanced Options Analysis**: Complete options chain data with AI-powered call/put wall analysis
- **AI-Powered Insights**: Intelligent key takeaways covering price action, trends, volatility, momentum, and chart patterns
- **Technical Analysis**: Standard and AI-enhanced technical indicators including pivot points and trend analysis
- **Enhanced AI Chat Systems**: Professional AI chat interface with optimized sizing and engaging emoji formatting

### Application Architecture (v4.5.3.0)
- **Dedicated Two-Tab System**: Clean NVDA and SPY analysis pages with complete context isolation
- **Battle-Tested Patterns**: React Context + useReducer with deterministic handlers
- **Enhanced Macro Automation**: "Analyze All" button with reliable React state management (v4.4.3.5 AI resilience improvements)
- **Advanced Export Features**: JSON export functionality for all data components
- **Build System Stability**: Reliable compilation and development workflows
- **AI Timeout Protection**: Comprehensive 45-second timeout handling with exponential backoff retry logic
- **Network Resilience**: Enhanced error handling for network interruptions and long-dated options processing
- **NEW v4.5.3.0**: **Re-Architecture Analysis**: Complete macro automation architectural analysis with 3 implementation options

### AI Integration
- **Google Gemini 2.5-flash-lite**: Latest AI model optimized for financial analysis
- **Specialized Trading Prompts**: Purpose-built prompts for stock traders, options traders, and holistic market analysis
- **Conditional Web Search**: Enhanced AI responses with real-time web search when appropriate
- **Professional Responses**: Standardized temperature settings (0.2 with seed 42) for consistent, focused responses
- **Robust Error Handling**: User-friendly error messages replacing cryptic "{}" failures
- **Enhanced Reliability**: >90% success rate for AI operations after retry logic implementation

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

### Dedicated Tab Architecture (v4.5.3.0)

StockSage features a proven two-tab architecture with complete context isolation:

#### 1. NVDA Dedicated Tab
- **Complete Independence**: Dedicated context with zero cross-dependencies
- **Advanced AI Chat**: Specialized NVDA trading chat with context-aware prompts
- **Full Feature Set**: Stock data, options chain, technical analysis, and AI key takeaways
- **Enhanced AI Resilience**: Robust timeout handling and network failure recovery

#### 2. SPY Dedicated Tab
- **Complete Independence**: Dedicated context with zero cross-dependencies  
- **Blueprint Reference**: Production-ready architecture serving as implementation reference
- **Advanced AI Chat**: Specialized SPY trading chat with web search capabilities
- **Network Resilience**: Comprehensive error handling for network interruptions

#### 3. Context Isolation Pattern
- **Zero Cross-Dependencies**: Each ticker maintains completely independent state
- **Proven Stability**: Thoroughly tested architecture with consistent behavior
- **Deterministic Handlers**: Reliable async/await patterns for all complex operations
- **FSM Integration**: Clean state management with simplified state machine

### Enhanced Macro Automation System (v4.5.3.0)

StockSage includes a sophisticated macro automation system with comprehensive re-architecture analysis:

#### Current "Analyze All" Button Features
- **AI Resilience**: Comprehensive timeout handling with 45-second protection and exponential backoff retry logic
- **4-Step Sequential Execution**: Automated workflow (Fetch Expirations → Get Stock Data → AI Takeaways → AI Options Analysis)
- **Isolated State Management**: Macro execution context completely separate from component state
- **Cross-Tab Consistency**: Identical macro functionality in both NVDA and SPY tabs
- **Progress Tracking**: Real-time progress indication with step-by-step execution feedback
- **User Cancellation**: Cancel automation at any point during execution
- **Comprehensive Error Handling**: Graceful failure recovery with detailed error reporting
- **Network Resilience**: Handles DNS failures (ENOTFOUND), connection resets (ECONNRESET), and request timeouts
- **Enhanced User Experience**: Clear, actionable error messages replace cryptic "{}" failures

#### Re-Architecture Analysis (NEW v4.5.3.0)
- **Current System**: 1,400+ lines with complex React closure patterns
- **Technical Debt**: High maintenance complexity, limited extensibility
- **Future Options**: 3 viable re-architecture approaches analyzed and documented
- **Implementation Ready**: Complete PRDs with roadmaps and timeline estimates
- **Decision Framework**: Strategic guidance for selecting optimal approach

## Macro Automation Debugging Reference

For comprehensive macro automation debugging, the project includes a complete debugging guide:

### Essential Reference Documentation
- **`/docs/macro-re-architecture/macro-automation-debugging-guide.md`** - Complete debugging reference with 20+ iteration lessons learned
- **Root Cause Analysis**: Detailed analysis of React state synchronization patterns, macro execution issues, and AI timeout handling
- **Failed Approaches**: Documentation of incorrect debugging approaches to avoid (11+ hours of lessons learned)
- **Emergency Response**: 5-minute diagnostic patterns for production issues including AI timeout scenarios
- **Prevention Strategies**: Future-proofing techniques and best practices for state management and AI resilience

### Quick Emergency Response
If experiencing macro automation failures:
1. **Check Console**: Look for "Prerequisites not met" + UI showing populated data (smoking gun pattern)
2. **Apply State Sync Fix**: Ensure immediate ref updates when bypassing execution steps
3. **Verify Prerequisites**: Ensure robust validation with expiration state consistency checks
4. **Check AI Timeout Errors**: Look for "{}" empty error objects indicating network timeouts
5. **Apply Timeout Protection**: Wrap AI operations with 45-second timeout + retry logic
6. **Reference Complete Guide**: Use debugging guide for systematic resolution approach

This debugging reference enables future teams to resolve similar macro state issues AND AI timeout problems in 2-3 iterations instead of 20+, saving 8-11 hours of debugging time per incident.

## Version Management

- **Version Source**: `src/config/app-metadata.json` (single source of truth)
- **Current Version**: v4.5.3.0 (Macro Re-Architecture Analysis Complete: Comprehensive analysis of macro automation re-architecture with 3 viable implementation options (XState, Command Pattern, Hybrid). Delivered strategic decision framework with detailed PRDs, technical specifications, and implementation roadmaps. Code review PASSED for all architectural documentation. System ready for implementation decision and development phase.)
- **Versioning Scheme**: `v4.w.x.y.z` format for clear version tracking
- **Update Policy**: Version and timestamp updates required for all code changes

## Future Development

### Macro Re-Architecture Implementation (Ready)
The comprehensive re-architecture analysis provides clear paths forward:

- **Status**: Analysis complete, ready for implementation decision
- **Options**: 3 viable approaches with detailed technical specifications
- **Documentation**: Complete PRDs, roadmaps, and decision framework
- **Timeline**: 4-25 days depending on selected approach
- **Benefits**: 65% complexity reduction potential, improved maintainability, enhanced extensibility

### Blueprint System (Preserved Scaffolding)
The blueprint system remains available as unused scaffolding for future development phases:

- **Status**: Preserved but not integrated into current application
- **Purpose**: Future ticker addition with configuration-driven development
- **Location**: `src/lib/ticker-framework/` (unused scaffolding)
- **Integration**: Available when stability requirements allow for enhancement phases

### Potential Future Enhancements
- Macro re-architecture implementation using selected approach
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
6. **Documentation**: Update relevant documentation for architectural changes

### Architecture Principles
- **Context Isolation**: Maintain complete independence between ticker tabs
- **Deterministic Handlers**: Use proven async/await patterns for complex operations
- **State Synchronization**: Ensure proper synchronization between UI and execution context
- **FSM Integration**: Provide proper state feedback for UI consistency
- **Type Safety**: Leverage TypeScript for compile-time error prevention
- **Baseline Protection**: Preserve stable, tested components unless explicitly requested to modify
- **AI Resilience**: All AI operations must include timeout and retry protection

## License

This project is private and proprietary.

## Support

For technical issues or questions about the codebase architecture, refer to the comprehensive documentation in `CLAUDE.md` or contact the development team.

For macro automation debugging issues, consult the essential reference guide at `/docs/macro-re-architecture/macro-automation-debugging-guide.md`.

For macro re-architecture implementation guidance, refer to `/docs/macro-re-architecture/README.md` and the comprehensive analysis documentation.

---

**StockSage v4.5.3.0** - A sophisticated financial analysis platform powered by Next.js and AI with proven dedicated tab architecture, enhanced macro automation with comprehensive AI timeout handling and network resilience improvements, and complete macro re-architecture analysis with 3 implementation options ready for development phase.