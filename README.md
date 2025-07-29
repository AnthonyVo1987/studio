# StockSage

**A Next.js Financial Analysis Application with AI-Powered Insights**

[![Version](https://img.shields.io/badge/version-v4.4.2.0-blue.svg)](src/config/app-metadata.json)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC.svg)](https://tailwindcss.com/)

StockSage is a sophisticated financial analysis application built with Next.js that provides real-time stock data, options chain analysis, and AI-powered insights. The application features a clean, modern interface with dedicated analysis tabs for specific tickers, powered by Google's Gemini AI and real-time financial data from Polygon.io.

## Features

### Core Functionality
- **Real-Time Financial Data**: Live stock quotes, market status, and comprehensive market data via Polygon.io API
- **Advanced Options Analysis**: Complete options chain data with AI-powered call/put wall analysis
- **AI-Powered Insights**: Intelligent key takeaways covering price action, trends, volatility, momentum, and chart patterns
- **Technical Analysis**: Standard and AI-enhanced technical indicators including pivot points and trend analysis
- **Specialized Chat Systems**: Advanced AI chat interface with trading-focused prompts and web search capabilities

### Application Architecture (v4.4.2.0)
- **Blueprint System Architecture**: Revolutionary configuration-driven ticker addition with 95% code reduction
- **Dynamic Tab System**: Automatic ticker discovery and registration through centralized configuration
- **Template-Based Components**: All ticker UI generated from reusable base component templates
- **Complete Context Isolation**: Each ticker maintains independent state management with zero cross-dependencies
- **Trivial Ticker Addition**: Add new tickers by updating single configuration file
- **On-Demand Analysis**: Manual trigger system for AI analysis to optimize performance and API usage
- **Advanced Export Features**: Comprehensive JSON export functionality for all data components

### AI Integration
- **Google Gemini 2.5-flash-lite**: Latest AI model optimized for financial analysis
- **Specialized Trading Prompts**: Purpose-built prompts for stock traders, options traders, and holistic market analysis
- **Conditional Web Search**: Enhanced AI responses with real-time web search when appropriate
- **Context-Aware Analysis**: AI systems trained on financial data patterns and trading terminology

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
- **Firebase**: Infrastructure support for AI flows

## Getting Started

### Prerequisites
- Node.js (latest LTS version recommended)
- npm or yarn package manager
- API keys for Polygon.io and Google AI

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
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
npm run build        # Production build with blueprint auto-discovery
npm run start        # Production server
```

#### Blueprint System Commands (v4.4.2.0)
```bash
# Ticker addition workflow
npm run build        # Auto-discovery and registration of enabled tickers
npm run dev          # Development server with dynamic tab system

# Configuration debugging
node -e "console.log(require('./src/config/ticker-configs').DevUtils.getConfigSummary())"

# Registry testing  
node -e "require('./src/lib/ticker-registry').tickerRegistry.getRegistryStats().then(console.log)"
```

### Port Usage Guidelines

**USER RESERVED PORTS** (for development and testing):
- **Port 9002**: Next.js development server
- **Port 3400**: Genkit AI development server

**INTERNAL TESTING PORTS** (for code review and internal testing):
```bash
# Use these ports for internal testing to avoid conflicts
next dev --turbopack -p 9003    # Internal dev server testing
next dev --turbopack -p 9004    # Alternative testing port
genkit start -p 3401            # Internal Genkit testing
```

## Application Architecture

### Blueprint System Architecture (v4.4.2.0)

StockSage features a revolutionary blueprint system that enables trivial ticker addition through configuration-driven development:

#### Core Blueprint Components

##### 1. Context Factory System
- **Automatic Context Generation**: Creates ticker-specific React contexts from configuration
- **Type-Safe Hook Generation**: Generates `use{Ticker}Analysis()` and `use{Ticker}Dispatch()` hooks
- **FSM Integration**: Built-in finite state machine management for each ticker
- **Provider Orchestration**: Dynamic provider composition with complete context isolation

##### 2. Template-Based Component Generation
- **95% Code Reduction**: New tickers require minimal custom code implementation
- **Consistent UI Patterns**: Standardized layouts and behaviors across all ticker implementations
- **Template Library**: Base components for tab content, data sections, AI chat, and options chains
- **Display Templates**: Stock snapshots, key metrics, technical analysis, and AI insights

##### 3. Dynamic Tab System  
- **Build-Time Discovery**: Automatic ticker registration from centralized configuration
- **Runtime Management**: Enable/disable tickers without rebuilds through registry system
- **Lazy Loading**: Code splitting and dynamic component loading for optimal performance
- **Context Orchestration**: Multi-provider composition ensuring complete state isolation

#### Trivial Ticker Addition Process

Adding a new ticker (e.g., AAPL) requires only:

1. **Configuration Update** (1 line change):
   ```typescript
   // src/config/ticker-configs.ts
   createTickerConfig('AAPL', 'Apple Inc.', { enabled: true })
   ```

2. **Optional Chat Action** (copy existing template):
   ```typescript
   // src/actions/aapl-consolidated-chat-action.ts
   // Copy nvda-consolidated-chat-action.ts and update ticker references
   ```

3. **Build & Deploy**:
   ```bash
   npm run build  # Automatic discovery and tab generation
   npm run dev    # New AAPL tab appears automatically
   ```

#### Legacy Architecture Integration

During the transition period, the system supports both:
- **Blueprint-Generated Components**: New tickers use template-based generation
- **Legacy Direct Components**: Existing NVDA/SPY components maintained for validation reference
- **Hybrid Architecture**: Seamless integration between legacy and blueprint systems

### State Management Architecture

#### Context Isolation Pattern
```typescript
// NVDA Tab - Independent Context
const nvdaContext = useNvdaAnalysis();  // nvda-analysis-context.tsx

// SPY Tab - Independent Context  
const spyContext = useSpyAnalysis();    // spy-analysis-context.tsx
```

#### Deterministic Handler Pattern
All complex operations use the proven deterministic handler approach:
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

1. **Stock Trader Takeaways** (`stock-trader-takeaways.json`)
   - Trading-focused market analysis
   - Price action and momentum insights
   - Entry/exit strategy guidance

2. **Options Trader Takeaways** (`options-trader-takeaways.json`)
   - Options-specific strategy analysis
   - Call/put wall identification
   - Volatility and gamma insights

3. **Holistic Takeaways** (`holistic-takeaways.json`)
   - Comprehensive market analysis
   - Multi-timeframe perspective
   - Risk assessment and portfolio implications

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

## File Organization

### Blueprint Framework Structure (v4.4.2.0)
```
src/
├── lib/ticker-framework/              # Blueprint system core
│   ├── core/
│   │   ├── context-factory.ts         # Automatic context generation
│   │   ├── base-components/           # Component templates
│   │   │   ├── base-tab-content.tsx   # Main tab orchestrator
│   │   │   ├── base-data-section.tsx  # Data display container
│   │   │   ├── base-consolidated-chat.tsx # AI chat interface
│   │   │   └── displays/              # Display templates
│   │   └── types.ts                   # Blueprint type definitions
│   └── examples/                      # Usage examples and guides
│
├── config/
│   └── ticker-configs.ts              # Centralized ticker configuration
│
├── lib/
│   └── ticker-registry.ts             # Dynamic ticker registration
│
├── components/
│   └── tabs/
│       └── dynamic-tab-system.tsx     # Dynamic tab orchestration
│
├── contexts/                          # Legacy/Generated contexts
│   ├── nvda-analysis-context.tsx      # NVDA state (legacy)
│   └── spy-analysis-context.tsx       # SPY state (legacy)
│
├── actions/                           # Server Actions
├── ai/                                # AI flows and prompts
└── types/                             # TypeScript definitions
```

### AI System Organization
```
src/ai/
├── flows/                             # Genkit AI flows
├── definitions/                       # JSON prompt templates
├── schemas/                           # Zod validation schemas
└── models.ts                          # AI model configurations
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

### Code Review Process
Always follow this process for significant changes:

1. **Implementation Review**: Focus on specific code changes and logic verification
2. **Codebase Audit**: Check for React anti-patterns, unused code, and infinite loops
3. **Quality Gates**: Ensure proper JSON parsing, error handling, and state management
4. **Documentation Updates**: Update relevant documentation when changes affect architecture

## Performance & Optimization

### Recent Achievements
- **Architecture Simplification**: Standard React patterns throughout the application
- **Token-Optimized Codebase**: 27.9% reduction in codebase size while preserving functionality
- **On-Demand AI**: Manual trigger system prevents unnecessary API calls
- **Context Isolation**: Clean separation prevents state pollution between tabs

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
- **Current Version**: v4.4.2.0 (blueprint system architecture with 95% code reduction)
- **Versioning Scheme**: `v4.w.x.y.z` format for clear version tracking
- **Update Policy**: Version and timestamp updates required for all code changes

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

## License

This project is private and proprietary.

## Support

For technical issues or questions about the codebase architecture, refer to the comprehensive documentation in `CLAUDE.md` or contact the development team.

---

**StockSage v4.4.2.0** - A sophisticated financial analysis platform powered by Next.js and AI with revolutionary blueprint system architecture.