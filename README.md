# StockSage

**A Next.js Financial Analysis Application with AI-Powered Insights**

[![Version](https://img.shields.io/badge/version-v4.6.0.0-blue.svg)](src/config/app-metadata.json)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC.svg)](https://tailwindcss.com/)
[![XState](https://img.shields.io/badge/XState-v5_Ready-orange.svg)](https://xstate.js.org/)

StockSage is a sophisticated financial analysis application built with Next.js that provides real-time stock data, options chain analysis, and AI-powered insights. The application features a dedicated two-tab architecture for NVDA and SPY analysis, powered by Google's Gemini AI and real-time financial data from Polygon.io. **NEW v4.6.0.0**: Completed comprehensive XState v5 implementation planning with systematic 5-phase migration roadmap (25-30 days) addressing historical pain points and delivering 70% code reduction potential.

## Protected Baseline Architecture

The current dedicated NVDA and SPY pages represent the stable, battle-tested architecture:
- `src/components/nvda-tab-content.tsx` & `src/components/spy-tab-content.tsx`
- `src/contexts/nvda-analysis-context.tsx` & `src/contexts/spy-analysis-context.tsx`

**These files MUST NOT be modified unless explicitly requested.** They ensure 100% application functionality with proven React patterns.

## XState Implementation Planning Complete (v4.6.0.0)

**PROJECT STATUS**: ✅ **XSTATE IMPLEMENTATION PLANNING COMPLETE**  
**DOCUMENTATION STATUS**: ✅ **CODE REVIEW PASSED**  
**NEXT PHASE**: Phase 1 Implementation Execution (25-30 days total)  

### XState v5 Migration Readiness

StockSage now features comprehensive XState v5 implementation planning with systematic migration from React-based state management to deterministic state machines, addressing 20+ debugging iterations and stale closure issues.

#### Implementation Planning Achievements:
- **📋 Complete Codebase Audit**: Comprehensive analysis revealing 1,400+ lines → ~400 lines projected (70% reduction)
- **📄 5-Phase Implementation Plan**: Systematic roadmap with 25-30 day timeline and detailed task breakdown
- **⭐ XState v5 API Compliance**: Modern TypeScript-first API patterns with typed events and context
- **🎯 Historical Pain Point Analysis**: 20+ debugging iteration lessons integrated into implementation strategy
- **📊 State Machine Design**: Deterministic transitions replacing manual step orchestration
- **🔧 XState Inspector Integration**: Visual debugging capabilities and development tools setup
- **🚀 Built-in Timeout Protection**: Native XState timeout handling vs current manual Promise.race patterns

#### Current System Analysis for XState Migration:
- **Current State**: React-based state management with stale closure issues requiring useRef escape hatches
- **Technical Debt**: 1,400+ lines of complex macro automation code with 20+ debugging iterations
- **Migration Path**: Systematic 5-phase approach maintaining 100% functionality during transition
- **Expected Benefits**: 70% code reduction, impossible invalid states, visual debugging, enhanced timeout protection

#### 5-Phase Implementation Roadmap:

**Phase 1: Foundation Setup (Days 1-5)**  
- XState v5 installation and TypeScript configuration  
- Basic state machine setup with core states (idle, loading, executing, error)  
- Integration with existing React components maintaining current functionality

**Phase 2: State Migration (Days 6-10)**  
- Convert React useState/useRef patterns to XState context  
- Implement deterministic state transitions for macro execution steps  
- Preserve existing functionality while migrating to state machine patterns

**Phase 3: Action Integration (Days 11-15)**  
- Migrate async operations (API calls, AI operations) to XState actions  
- Implement built-in timeout protection replacing manual Promise.race patterns  
- Enhanced error handling with state machine error states and recovery

**Phase 4: XState Inspector & Debugging (Days 16-20)**  
- XState Inspector integration for visual debugging and state visualization  
- Advanced state machine patterns implementation (parallel states, nested machines)  
- Comprehensive testing and validation ensuring feature parity

**Phase 5: Optimization & Finalization (Days 21-30)**  
- Performance optimization and code cleanup  
- Final documentation updates and migration guides  
- Production deployment preparation and rollback strategy validation

### XState Implementation Benefits:
- **Impossible Invalid States**: State machine guarantees prevent invalid state combinations that caused previous debugging issues
- **Visual Debugging**: XState Inspector provides real-time state visualization replacing console.log debugging
- **Deterministic Workflows**: Formal state transitions replace manual orchestration reducing complexity
- **Enhanced Network Resilience**: Built-in XState timeout and error handling capabilities
- **Code Reduction**: 70% reduction in complexity through state machine patterns

### Next Steps for XState Implementation:
1. **Phase 1 Execution**: Begin foundation setup with XState v5 installation
2. **State Machine Design**: Implement core macro automation state machine
3. **Progressive Migration**: Phase-by-phase conversion maintaining functionality
4. **Visual Debugging**: Integrate XState Inspector for enhanced development experience

**REFERENCE**: Complete implementation guide available at `/docs/macro-re-architecture/xstate-implementation-guide.md`

## Features

- **Real-Time Stock Data**: Live market data from Polygon.io API
- **Options Chain Analysis**: Comprehensive options data visualization
- **AI-Powered Insights**: Google Gemini AI integration for trading analysis
- **Macro Automation**: Production-ready 4-step sequential execution system
- **XState Ready**: Comprehensive implementation planning for state machine migration
- **Dedicated Tab Architecture**: Isolated NVDA and SPY analysis contexts
- **Professional AI Chat**: Financial analyst capabilities with specialized prompts
- **Export Capabilities**: JSON data export and copy functionality
- **Mobile Responsive**: Optimized for all device sizes

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Polygon.io API key
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd stocksage

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your API keys to .env
POLYGON_API_KEY=your_polygon_api_key
GEMINI_API_KEY=your_google_ai_api_key

# Start development server
npm run dev
```

Visit `http://localhost:9002` to view the application.

### Build Commands

```bash
npm run dev          # Development server (http://localhost:9002)
npm run build        # Production build
npm run start        # Production server
npm run typecheck    # TypeScript type checking
npm run genkit:dev   # Genkit AI flows dev server (http://localhost:3400)
```

## Architecture Overview

### Current Implementation (v4.6.0.0)
- **Frontend**: Next.js 15.3.3 with React 18.3.1
- **State Management**: React Context + useReducer (transitioning to XState v5)
- **AI Backend**: Google Genkit + Gemini 2.5-flash-lite
- **UI Framework**: ShadCN UI + Tailwind CSS
- **Data Source**: Polygon.io API
- **Macro System**: Production-ready with XState migration planning

### XState Migration Architecture
- **State Machines**: Deterministic macro execution workflows
- **Visual Debugging**: XState Inspector integration
- **Timeout Protection**: Built-in XState timeout handling
- **Error Recovery**: State machine error states and transitions
- **TypeScript Integration**: Typed events, context, and state definitions

## Documentation

### Core Documentation
- **[Implementation Guide](/docs/macro-re-architecture/xstate-implementation-guide.md)** - Complete XState v5 migration guide
- **[Architecture Analysis](/docs/macro-re-architecture/comprehensive-architecture-decision-analysis.md)** - Comprehensive re-architecture analysis
- **[Debugging Guide](/docs/macro-re-architecture/macro-automation-debugging-guide.md)** - Macro automation debugging reference

### API Documentation
- **[Project Instructions](CLAUDE.md)** - Complete development guidelines
- **[Change History](CHANGELOG.md)** - Detailed version history

## Development

### Code Quality Standards
- **TypeScript**: Strict mode enabled
- **Testing**: Manual testing with Debug tabs
- **Linting**: TypeScript compiler validation (ESLint not configured)
- **Quality Gates**: Mandatory `npm run typecheck` before commits

### Development Workflow
```bash
# Type checking (required before commits)
npm run typecheck

# Build verification
npm run build

# Development with hot reload
npm run dev
```

## Macro Automation System

### Current System (Production Ready)
- **4-Step Sequential Execution**: Fetch Expirations → Stock Data → AI Takeaways → AI Options
- **100% Success Rate**: Proven reliability with comprehensive debugging
- **AI Timeout Protection**: 45-second timeouts with exponential backoff retry
- **Enhanced Logging**: Comprehensive console debugging with ticker-agnostic patterns

### XState Migration (v4.6.0.0 Planning)
- **State Machine Workflow**: Deterministic transitions replacing manual orchestration
- **Visual Debugging**: XState Inspector for real-time state visualization
- **Built-in Timeouts**: Native XState timeout handling
- **Error Recovery**: Formal error states and recovery transitions
- **Code Reduction**: 70% complexity reduction through state machine patterns

## License

This project is private and proprietary.

## Contributing

This is a private project. For development guidelines, refer to [CLAUDE.md](CLAUDE.md).

---

**Current Version**: v4.6.0.0 - XState Macro Overhaul Implementation Planning Complete  
**Next Milestone**: Phase 1 XState Implementation Execution (25-30 days)  
**Documentation**: Complete implementation guide with systematic migration roadmap