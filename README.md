# StockSage

**A Next.js Financial Analysis Application with AI-Powered Insights**

[![Version](https://img.shields.io/badge/version-v4.6.5.0-green.svg)](src/config/app-metadata.json)
[![Status](https://img.shields.io/badge/status-Phase%204.5%20Planning%20Complete-green.svg)](CHANGELOG.md)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC.svg)](https://tailwindcss.com/)
[![XState](https://img.shields.io/badge/XState-v5_Phase4.5_Planning_Complete-green.svg)](https://xstate.js.org/)

StockSage is a sophisticated financial analysis application built with Next.js that provides real-time stock data, options chain analysis, and AI-powered insights. The application features a dedicated two-tab architecture for NVDA and SPY analysis, powered by Google's Gemini AI and real-time financial data from Polygon.io. **NEW v4.6.5.0**: Phase 4.5 Integration Planning Complete - Comprehensive integration plan created for systematic resolution of XState v5 compatibility issues while preserving all 25,361+ lines of Phase 4 advanced features including hierarchical state machines, performance monitoring, advanced UI components, error handling, debugging tools, and configuration management. **PLANNING STATUS**: Integration strategy complete with progressive enablement workflow, risk mitigation protocols, and production deployment roadmap ready for implementation.

## 🎯 Phase 4.5 Integration Planning Complete (v4.6.5.0)

**PROJECT STATUS**: 🎯 **PHASE 4.5 PLANNING COMPLETE - INTEGRATION READY**  
**PLANNING STATUS**: ✅ **COMPREHENSIVE INTEGRATION STRATEGY DOCUMENTED**  
**IMPLEMENTATION STATUS**: 🚀 **READY FOR PROGRESSIVE ROLLOUT**  

### Phase 4.5 Integration Planning Achievement

StockSage has successfully completed comprehensive Phase 4.5 integration planning with detailed implementation strategy, progressive enablement workflow, risk mitigation protocols, and automated rollback systems.

#### 🎯 Phase 4.5 Integration Plan Components:
- **📊 Strategic Integration Approach**: Progressive enablement with risk-first strategy and automated health monitoring
- **⚡ Implementation Workflow**: Pre-integration assessment, progressive feature rollout, integration validation, production deployment
- **🛡️ Risk Mitigation Systems**: Granular feature flags (20+ features), health monitoring, rollback automation, compatibility testing
- **🚀 Production Deployment Strategy**: Final validation and production rollout with comprehensive monitoring

#### 🏗️ Phase 4 Features Ready for Integration (25,361+ Lines Preserved):
- **Advanced XState Features** (5,050+ lines): Hierarchical machines, composition, parallel execution, actor spawning, resource management, state persistence
- **Performance Monitoring System** (1,259+ lines): Analytics engine, metrics collection, performance dashboards, bottleneck detection
- **Advanced UI Components** (5,600+ lines): Machine visualizers, performance dashboards, debug control panels, state inspectors, event timeline
- **Advanced Error Handling** (2,300+ lines): Circuit breaker patterns, error recovery systems, compensation patterns, error aggregation
- **Debugging Tools** (6,305+ lines): Advanced logging, state history tracking, debug utilities, testing utilities, performance profiler
- **Configuration Management** (4,847+ lines): Dynamic configuration, feature flags, environment management, schema validation

#### 📈 Integration Planning Benefits:
- **Systematic Compatibility Resolution**: Comprehensive plan eliminates ad-hoc compatibility fixes
- **Risk Mitigation**: Progressive rollout minimizes production impact
- **Quality Assurance**: Built-in validation and testing frameworks
- **Rollback Protection**: Automated safety measures for system stability

### Next Development Phase: Progressive Integration Implementation

**TIMELINE**: Progressive rollout with phased deployment  
**SCOPE**: Systematic compatibility resolution and production integration  
**APPROACH**: Feature flag-controlled rollout with automated monitoring  
**OUTCOME**: Production-ready Phase 4 advanced features with full StockSage integration  

## Protected Baseline Architecture

The current dedicated NVDA and SPY pages represent the stable, battle-tested architecture:
- `src/components/nvda-tab-content.tsx` & `src/components/spy-tab-content.tsx`
- `src/contexts/nvda-analysis-context.tsx` & `src/contexts/spy-analysis-context.tsx`

**These files MUST NOT be modified unless explicitly requested.** They ensure 100% application functionality with proven React patterns.

## XState Integration Architecture (v4.6.5.0 - Integration Planning Complete)

### Current XState Implementation Status

#### ✅ PRODUCTION-READY IMPLEMENTATIONS:
- **Phase 1 Foundation** (v4.6.1.0): Complete XState v5 foundation with machine architecture and TypeScript integration
- **Phase 2 Core Implementation** (v4.6.2.0): Integration layer, actor management, context bridging, and data transformers
- **Phase 3 React Integration** (v4.6.3.0): Complete React hooks, components, context providers, and error handling

#### 🎯 INTEGRATION PLANNING COMPLETE (v4.6.5.0):
- **Phase 4.5 Integration Plan**: Comprehensive strategy for systematic compatibility resolution
  - **Progressive Enablement**: Feature flag system for safe rollout of advanced features
  - **Risk Mitigation**: Automated rollback and health monitoring systems
  - **Compatibility Resolution**: Structured approach to XState v5 API alignment
  - **Production Deployment**: Final validation and production rollout strategy

#### 🚧 PRESERVED ADVANCED FEATURES (v4.6.4.0):
- **Phase 4 Advanced Features**: Enterprise-grade XState infrastructure preserved (25,361+ lines)
  - **Advanced State Management**: Hierarchical and parallel state machines
  - **Performance Monitoring**: Real-time analytics and optimization tools
  - **Advanced UI Components**: Sophisticated visualization and debugging interfaces
  - **Error Handling**: Circuit breaker patterns and automatic recovery systems
  - **Debugging Tools**: Comprehensive logging and development utilities
  - **Configuration Management**: Dynamic runtime configuration and feature flags

### Phase 4.5 Integration Strategy

#### Progressive Enablement Workflow:
1. **Pre-Integration Assessment**: Comprehensive compatibility audit and dependency analysis
2. **Feature Flag Rollout**: Granular control over 20+ advanced features
3. **Health Monitoring**: Real-time system health tracking with automatic rollback triggers
4. **Compatibility Resolution**: Systematic XState v5 API alignment and type system fixes
5. **Production Validation**: Thorough testing and final deployment preparation

#### Risk Mitigation Protocols:
- **Granular Feature Flags**: Individual control over advanced features
- **Health Monitoring**: Real-time metrics collection and automatic issue detection
- **Rollback Automation**: Immediate rollback triggers for system stability protection
- **Integration Testing**: Comprehensive validation framework for XState v5 integration

## High-Level Architecture (v4.6.5.0 - Integration Ready)

### Core Technology Stack
- **Frontend**: Next.js 15.3.3 with React 18.3.1
- **AI Backend**: Google Genkit + Google AI SDK
- **State Management**: React Context + FSM + **XState v5 Integration Plan Ready** (Phase 4.5)
- **UI Components**: ShadCN UI + Tailwind CSS
- **Data Sources**: Polygon.io API
- **AI Model**: Google Gemini 2.5-flash-lite

### Current Implementation Architecture (v4.6.5.0)

#### ✅ ACTIVE IMPLEMENTATION
- **Two-Tab System**: Hardcoded NVDA/SPY tabs in `src/components/page-content.tsx`
- **Dedicated Contexts**:
  - `src/contexts/nvda-analysis-context.tsx` (79 state fields)
  - `src/contexts/spy-analysis-context.tsx` (79 state fields)
- **Component Architecture**:
  - `src/components/nvda-tab-content.tsx` (main orchestrator)
  - `src/components/spy-tab-content.tsx` (main orchestrator)
  - Individual display components: `nvda-*-display.tsx`, `spy-*-display.tsx`
- **Context Providers**: Direct setup in `src/app/page.tsx`
- **AI Chat System**: Fully operational with restored `app-data-chatbot.json`
- **AI Timeout Handling**: Robust 45-second timeout protection with exponential backoff retry logic
- **Network Resilience**: Comprehensive error handling for network interruptions

#### 🎯 PRODUCTION-READY XState INTEGRATION
- **Phase 1-3 Complete**: Foundation, core implementation, and React integration fully operational
- **React Hooks Library**: Complete integration hooks for XState machine management
- **UI Component Library**: State visualization, progress tracking, and error boundary components
- **Context Provider System**: Global state management and macro execution coordination
- **Integration Utilities**: Easy setup and StockSage compatibility patterns

#### 🎯 INTEGRATION READY XState ADVANCED FEATURES (v4.6.5.0)
- **Advanced State Management**: Hierarchical and parallel state machine capabilities (integration plan ready)
- **Performance Monitoring**: Real-time analytics and optimization tools (progressive rollout ready)
- **Advanced UI Components**: Sophisticated visualization and debugging interfaces (feature flags ready)
- **Error Handling System**: Circuit breaker patterns and recovery systems (health monitoring ready)
- **Debugging Infrastructure**: Comprehensive logging and development tools (rollback automation ready)
- **Configuration Management**: Dynamic runtime configuration and feature flags (production deployment ready)

#### 🚧 PRESERVED SCAFFOLDING (UNUSED)
- **Blueprint Framework**: Complete but unused in `src/lib/ticker-framework/`
- **Dynamic Tab System**: `src/components/tabs/dynamic-tab-system.tsx` (not integrated)
- **Ticker Registry**: `src/lib/ticker-registry.ts` (not integrated)
- **Configuration System**: `src/config/ticker-configs.ts` (not integrated)

## Development Workflow (v4.6.5.0)

### Current Development Pattern
1. **Direct Component Development**: Modify existing `nvda-*` or `spy-*` components
2. **Context Usage**: Use `useNvdaAnalysis()` / `useSpyAnalysis()` hooks directly
3. **Server Actions**: Extend existing consolidated chat actions with timeout protection
4. **AI Prompts**: Modify JSON prompt definitions in `src/ai/definitions/`
5. **AI Operation Implementation**: Always include timeout and retry logic for AI calls
6. **XState Integration**: Use Phases 1-3 React + XState integration layer for enhanced state management
7. **🎯 PHASE 4.5 INTEGRATION**: Advanced features ready for progressive rollout implementation

### Phase 4.5 Integration Implementation Workflow
```bash
# When Phase 4.5 integration is executed:

# 1. Pre-Integration Assessment
npm run typecheck    # Validate current system compatibility
npm run build        # Test existing functionality

# 2. Progressive Feature Rollout
npm run dev          # Start development with feature flag system
# Enable features progressively through configuration

# 3. Integration Validation
npm run typecheck    # Verify XState v5 compatibility
npm run build        # Test advanced feature compilation

# 4. Advanced Feature Usage (Post-Integration)
import { 
  useHierarchicalMachine,
  usePerformanceMonitoring,
  CircuitBreakerProvider 
} from '@/lib/xstate/advanced';

# 5. Enhanced UI Components (Post-Integration)
import {
  MachineDashboard,
  PerformanceDashboard,
  DebugControlPanel
} from '@/lib/xstate/ui';
```

### Quality Gates (MANDATORY)
```bash
npm run typecheck    # TypeScript validation (primary quality check)
npm run build        # Build verification
```

**Note**: Do NOT run `npm run lint` as ESLint is not properly configured.

## Features

### 🚀 Core Features
- **Real-time Stock Data**: Live market data via Polygon.io API
- **Options Chain Analysis**: Comprehensive options data with AI insights
- **AI-Powered Analysis**: Google Gemini AI for market insights
- **Interactive Charts**: Technical analysis with customizable indicators
- **Macro Automation**: Automated multi-step analysis workflows
- **Export Capabilities**: JSON data export and sharing

### 🎯 XState Integration Features (Production-Ready)
- **Visual State Debugging**: Real-time state machine visualization (Phases 1-3)
- **Enhanced Error Handling**: React error boundaries with XState error states (Phases 1-3)
- **Performance Monitoring**: Built-in performance tracking and metrics (Phases 1-3)
- **Macro Orchestration**: State machine-powered macro execution workflows (Phases 1-3)
- **Development Tools**: Comprehensive debugging and inspection capabilities (Phases 1-3)

### 🎯 Advanced XState Features (Integration Ready - Phase 4.5)
- **Hierarchical State Management**: Complex nested state machines for sophisticated workflows
- **Performance Analytics**: Real-time performance monitoring with bottleneck detection
- **Circuit Breaker Patterns**: Fault tolerance and automatic recovery systems
- **Dynamic Configuration**: Runtime configuration updates and feature flags
- **Advanced Debugging**: Comprehensive logging, history tracking, and development tools
- **Enterprise UI Components**: Sophisticated visualization and debugging interfaces

## 🔧 Installation

```bash
# Clone the repository
git clone <repository-url>
cd stocksage

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys:
# POLYGON_API_KEY=your_polygon_api_key
# GEMINI_API_KEY=your_google_ai_api_key

# Run development server
npm run dev
```

## 💻 Usage

### Development Commands
```bash
npm run dev          # Development server (http://localhost:9002)
npm run build        # Production build
npm run start        # Production server
npm run typecheck    # TypeScript type checking
npm run genkit:dev   # Genkit AI flows dev server (http://localhost:3400)
```

### XState Integration Usage (Production-Ready: Phases 1-3)
```bash
# Development with XState debugging (Phases 1-3)
npm run dev          # Includes XState Inspector integration
npm run typecheck    # Validates XState + React integration types
```

### Phase 4.5 Integration Features (Implementation Ready)
```bash
# Advanced XState features (ready for progressive rollout)
npm run dev          # Will include advanced performance monitoring
npm run typecheck    # Will validate advanced XState feature types
```

## Architecture Overview

### Current Architecture
- **Frontend Framework**: Next.js 15.3.3 with App Router
- **React Integration**: React 18.3.1 with hooks and context
- **State Management**: React Context + useReducer + XState v5 integration (Phases 1-3 production-ready, Phase 4.5 integration ready)
- **AI Integration**: Google Genkit with Gemini 2.5-flash-lite
- **UI Framework**: ShadCN UI with Tailwind CSS
- **Type Safety**: TypeScript with strict mode

### XState Integration Architecture (v4.6.5.0)
- **State Machines**: XState v5 for deterministic state management
- **React Integration**: Custom hooks and components for React + XState (Phases 1-3 production-ready)
- **Error Handling**: Specialized error boundaries with recovery (Phases 1-3 + advanced patterns in Phase 4.5 integration ready)
- **Performance**: Optimized rendering and memory management (Phases 1-3 + advanced monitoring in Phase 4.5 integration ready)
- **Debugging**: Visual state machine inspection and logging (Phases 1-3 + advanced tools in Phase 4.5 integration ready)
- **🎯 Advanced Features**: Enterprise-grade capabilities ready for progressive rollout (Phase 4.5 integration ready)

## File Organization

### Core Application Files
- `src/app/page.tsx` - Main application entry point
- `src/components/page-content.tsx` - Two-tab UI implementation
- `src/contexts/nvda-analysis-context.tsx` - NVDA state management
- `src/contexts/spy-analysis-context.tsx` - SPY state management

### XState Integration Files (Production-Ready: Phases 1-3)
- `src/lib/xstate/react/hooks/` - React hooks for XState integration
- `src/lib/xstate/react/components/` - UI components for state visualization
- `src/lib/xstate/react/contexts/` - React context providers for XState
- `src/lib/xstate/integration/` - StockSage integration layer
- `src/lib/xstate/machines/` - State machine definitions

### XState Advanced Features Files (Integration Ready: Phase 4.5)
- `src/lib/xstate/advanced/` - Advanced XState features (hierarchical machines, composition, parallel execution)
- `src/lib/xstate/performance/` - Performance monitoring and analytics
- `src/lib/xstate/ui/` - Advanced UI components for visualization and debugging
- `src/lib/xstate/error-handling/` - Circuit breaker patterns and error recovery
- `src/lib/xstate/debugging/` - Advanced debugging tools and utilities
- `src/lib/xstate/config/` - Configuration management and feature flags

### AI System Files
- `src/actions/nvda-consolidated-chat-action.ts` - NVDA AI chat server action
- `src/actions/spy-consolidated-chat-action.ts` - SPY AI chat server action
- `src/ai/definitions/` - AI prompt templates and configurations

## Version Information

- **Current Version**: v4.6.5.0
- **Release Date**: August 5, 2025
- **Status**: Phase 4.5 Integration Planning Complete - Comprehensive integration strategy ready for progressive rollout
- **Major Features**: 25,361+ lines of advanced XState infrastructure preserved with systematic integration plan
- **Integration Status**: Progressive rollout ready with feature flags, risk mitigation, and production deployment strategy

## Contributing

1. Follow the existing architecture patterns
2. Maintain backward compatibility with StockSage contexts
3. Use TypeScript with strict type checking
4. Include comprehensive error handling
5. Add tests for new XState integration features
6. Follow React best practices for hooks and components
7. **For Phase 4.5 Integration**: Follow progressive rollout strategy with feature flags

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Documentation

For detailed documentation on XState integration, see:
- `src/lib/xstate/react/PHASE3_COMPLETION_SUMMARY.md` - Phase 3 React integration status (production-ready)
- `docs/macro-re-architecture/` - Architecture decisions and implementation guides
- `CLAUDE.md` - Development guidelines and team configuration
- `CHANGELOG.md` - Complete Phase 4.5 integration planning status and implementation strategy

## 🎯 Phase 4.5 Integration Implementation Requirements

### Integration Strategy Ready:
1. **Progressive Enablement**: Feature flag system for safe rollout of advanced features
2. **Risk Mitigation**: Automated rollback and health monitoring systems
3. **Compatibility Resolution**: Structured approach to XState v5 API alignment
4. **Production Deployment**: Final validation and production rollout strategy

### Implementation Readiness:
- **Integration Plan Complete**: Comprehensive strategy documented for systematic compatibility resolution
- **Advanced Features Preserved**: All 25,361+ lines of code preserved and ready for integration
- **Testing Framework**: Progressive rollout testing utilities ready for validation
- **Documentation Complete**: Full integration planning status documented for implementation

---

**StockSage v4.6.5.0** - Comprehensive financial analysis with AI insights and enterprise-grade XState infrastructure (Phase 4.5 integration planning complete - ready for progressive rollout implementation).