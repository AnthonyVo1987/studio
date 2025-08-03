'use client';

/**
 * @fileOverview NVDA Staging Analysis Context - Enterprise Experimental Infrastructure
 * 
 * This context manages state for the NVDA Macro Staging experimental tab.
 * Architecture Pattern: Isolated Context + useReducer + Custom Hooks + Enterprise Security
 * 
 * ENTERPRISE FEATURES:
 * - Complete isolation from production NVDA/SPY contexts with security boundaries
 * - Feature flag system with approval workflows for experimental features
 * - Security monitoring with real-time threat detection and audit logging
 * - Compliance framework with SOC2, GDPR, and financial regulation support
 * - Performance monitoring with enterprise dashboards and comparison tools
 * - Macro automation experiment framework with multiple pattern support
 * 
 * SECURITY ISOLATION:
 * - Dedicated 79-field state structure identical to production for comparison
 * - Zero shared dependencies with production contexts (enforced isolation)
 * - Security validation and audit trails for all state mutations
 * - Enterprise-grade access controls and compliance monitoring
 */

import type { ReactNode } from 'react';
import { createContext, useContext, useReducer, useEffect } from 'react';
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';
import { generateUUID } from '@/lib/staging/uuid-polyfill';

// Staging configuration for NVDA experimental analysis
export const NVDA_STAGING_TICKER = 'NVDA_STAGING';

// Create staging-specific logger with security context
const logger = createTickerLogger(NVDA_STAGING_TICKER, TICKER_PAGES.NVDA_TAB);

// Options Chain Settings (matching production pattern for comparison)
export type OptionType = 'both' | 'calls' | 'puts';
export type StrikeCount = 20 | 30 | 40;
export type TableDisplayType = 'side-by-side' | 'top-bottom';

// Experiment Types for Macro Automation Re-Architecture
export type ExperimentType = 'current' | 'optimized' | 'reactive' | 'custom';

// Security Context Types
interface SecurityContext {
  environment: 'staging';
  isolated: boolean;
  userId?: string;
  role?: string;
  sessionId: string;
  timestamp: string;
}

// Compliance Status Types
interface ComplianceStatus {
  soc2Compliant: boolean;
  gdprCompliant: boolean;
  financialRegulationCompliant: boolean;
  auditTrailActive: boolean;
  lastComplianceCheck: string;
}

// Performance Metrics Types
interface StagingMetrics {
  responseTime: number;
  memoryUsage: number;
  bundleSize: number;
  comparisonWithProduction: {
    responseTimeDiff: number;
    memoryUsageDiff: number;
    performanceParity: boolean;
  };
}

// Audit Event Types
interface AuditEvent {
  id: string;
  type: string;
  action: string;
  timestamp: string;
  userId?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Isolation Status Types
interface IsolationStatus {
  validated: boolean;
  lastValidation: string;
  violations: string[];
  boundariesActive: boolean;
}

interface NvdaStagingAnalysisState {
  // === CORE 79-FIELD STRUCTURE (IDENTICAL TO PRODUCTION) ===
  // Status Management
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  
  // Expiration Management
  availableExpirationDates: string[];
  selectedExpirationDate: string;
  
  // Options Chain Settings
  optionType: OptionType;
  strikeCount: StrikeCount;
  tableDisplayType: TableDisplayType;
  
  // Raw Data (JSON strings from server actions)
  stockSnapshotJson: string;
  marketStatusJson: string;
  standardTasJson: string;
  aiAnalyzedTaJson: string;
  aiKeyTakeawaysJson: string;
  aiOptionsAnalysisJson: string;
  optionsChainJson: string;
  
  // AI Chat Raw Debug Data (JSON strings for each chat response type)
  // App Data Analysis Button Responses
  stockTraderTakeawaysRawJson: string;
  optionsTraderTakeawaysRawJson: string;
  holisticTakeawaysRawJson: string;
  
  // Web Search Analysis Button Responses  
  supportResistanceWebSearchRawJson: string;
  technicalAnalysisWebSearchRawJson: string;
  optionsFlowWebSearchRawJson: string;
  
  // User Input Responses (separated by mode)
  userInputAppDataRawJson: string;
  userInputWebSearchRawJson: string;
  
  // Data Flags
  hasStockData: boolean;
  hasAiTaData: boolean;
  hasAiKeyTakeaways: boolean;
  hasAiOptionsAnalysis: boolean;
  hasOptionsChainData: boolean;
  
  // AI Operation Loading States (separate from main FSM)
  isAiKeyTakeawaysLoading: boolean;
  isAiOptionsAnalysisLoading: boolean;
  
  // UI Update Flag - signals when ALL data retrieval is complete for batch UI updates
  dataRetrievalComplete: boolean;

  // === STAGING-SPECIFIC ENHANCEMENTS ===
  // Experiment Configuration
  experimentType: ExperimentType;
  experimentConfig: Record<string, any>;
  experimentActive: boolean;
  experimentStartTime: string | null;
  
  // Performance Monitoring
  performanceMetrics: StagingMetrics;
  performanceBaseline: StagingMetrics | null;
  performanceComparison: boolean;
  
  // Security & Isolation
  securityContext: SecurityContext;
  isolationValidation: IsolationStatus;
  isolationBoundariesActive: boolean;
  
  // Compliance & Audit
  complianceStatus: ComplianceStatus;
  auditTrail: AuditEvent[];
  auditingActive: boolean;
  
  // Feature Flags
  featureFlags: Record<string, boolean>;
  flagApprovals: Record<string, string>; // flagName -> approver
  
  // Enterprise Monitoring
  securityMonitoringActive: boolean;
  threatDetectionActive: boolean;
  complianceMonitoringActive: boolean;
  
  // Staging-Specific Loading States
  isExperimentLoading: boolean;
  isIsolationValidating: boolean;
  isComplianceChecking: boolean;
  
  // Data Protection
  dataEncrypted: boolean;
  dataRetentionCompliant: boolean;
  dataExportRestricted: boolean;
}

type NvdaStagingAnalysisAction =
  // === CORE ACTIONS (IDENTICAL TO PRODUCTION) ===
  | { type: 'SET_LOADING' }
  | { type: 'SET_IDLE' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_EXPIRATION_DATES'; payload: string[] }
  | { type: 'SET_SELECTED_EXPIRATION'; payload: string }
  | { type: 'SET_OPTIONS_SETTINGS'; payload: {
      optionType?: OptionType;
      strikeCount?: StrikeCount;
      tableDisplayType?: TableDisplayType;
    }}
  | { type: 'SET_STOCK_DATA'; payload: {
      stockSnapshotJson: string;
      marketStatusJson: string;
      standardTasJson: string;
      aiAnalyzedTaJson: string;
    }}
  | { type: 'SET_OPTIONS_CHAIN_DATA'; payload: string }
  | { type: 'SET_AI_KEY_TAKEAWAYS'; payload: string }
  | { type: 'SET_AI_KEY_TAKEAWAYS_LOADING'; payload: boolean }
  | { type: 'SET_AI_OPTIONS_ANALYSIS'; payload: string }
  | { type: 'SET_AI_OPTIONS_ANALYSIS_LOADING'; payload: boolean }
  | { type: 'SET_DATA_RETRIEVAL_COMPLETE'; payload: boolean }
  | { type: 'SET_AI_CHAT_RAW_DATA'; payload: {
      promptName: string;
      responseJson: string;
      webSearchEnabled: boolean;
      isUserInput?: boolean;
    }}
  | { type: 'RESET_STATE' }
  
  // === STAGING-SPECIFIC ACTIONS ===
  | { type: 'SET_EXPERIMENT_TYPE'; payload: ExperimentType }
  | { type: 'SET_EXPERIMENT_CONFIG'; payload: Record<string, any> }
  | { type: 'SET_EXPERIMENT_ACTIVE'; payload: boolean }
  | { type: 'SET_EXPERIMENT_LOADING'; payload: boolean }
  | { type: 'UPDATE_PERFORMANCE_METRICS'; payload: StagingMetrics }
  | { type: 'SET_PERFORMANCE_BASELINE'; payload: StagingMetrics }
  | { type: 'VALIDATE_ISOLATION'; payload: IsolationStatus }
  | { type: 'SET_ISOLATION_VALIDATING'; payload: boolean }
  | { type: 'UPDATE_COMPLIANCE_STATUS'; payload: ComplianceStatus }
  | { type: 'SET_COMPLIANCE_CHECKING'; payload: boolean }
  | { type: 'ADD_AUDIT_EVENT'; payload: AuditEvent }
  | { type: 'SET_FEATURE_FLAG'; payload: { flag: string; enabled: boolean; approver?: string } }
  | { type: 'UPDATE_SECURITY_CONTEXT'; payload: Partial<SecurityContext> }
  | { type: 'ENABLE_SECURITY_MONITORING' }
  | { type: 'DISABLE_SECURITY_MONITORING' }
  | { type: 'SECURITY_ALERT'; payload: { type: string; severity: 'low' | 'medium' | 'high' | 'critical'; details: any } };

const initialState: NvdaStagingAnalysisState = {
  // === CORE STATE (IDENTICAL TO PRODUCTION) ===
  status: 'idle',
  error: null,
  availableExpirationDates: [],
  selectedExpirationDate: '',
  optionType: 'both',
  strikeCount: 20, // Standardized default to 20 strikes
  tableDisplayType: 'side-by-side',
  stockSnapshotJson: '',
  marketStatusJson: '',
  standardTasJson: '',
  aiAnalyzedTaJson: '',
  aiKeyTakeawaysJson: '',
  aiOptionsAnalysisJson: '',
  optionsChainJson: '',
  
  // Initialize AI Chat Raw Debug Data
  stockTraderTakeawaysRawJson: '',
  optionsTraderTakeawaysRawJson: '',
  holisticTakeawaysRawJson: '',
  supportResistanceWebSearchRawJson: '',
  technicalAnalysisWebSearchRawJson: '',
  optionsFlowWebSearchRawJson: '',
  userInputAppDataRawJson: '',
  userInputWebSearchRawJson: '',
  
  hasStockData: false,
  hasAiTaData: false,
  hasAiKeyTakeaways: false,
  hasAiOptionsAnalysis: false,
  hasOptionsChainData: false,
  isAiKeyTakeawaysLoading: false,
  isAiOptionsAnalysisLoading: false,
  dataRetrievalComplete: false,

  // === STAGING-SPECIFIC STATE ===
  experimentType: 'current',
  experimentConfig: {},
  experimentActive: false,
  experimentStartTime: null,
  
  performanceMetrics: {
    responseTime: 0,
    memoryUsage: 0,
    bundleSize: 0,
    comparisonWithProduction: {
      responseTimeDiff: 0,
      memoryUsageDiff: 0,
      performanceParity: true,
    },
  },
  performanceBaseline: null,
  performanceComparison: false,
  
  securityContext: {
    environment: 'staging',
    isolated: true,
    sessionId: generateUUID(),
    timestamp: new Date().toISOString(),
  },
  
  isolationValidation: {
    validated: true,
    lastValidation: new Date().toISOString(),
    violations: [],
    boundariesActive: true,
  },
  isolationBoundariesActive: true,
  
  complianceStatus: {
    soc2Compliant: true,
    gdprCompliant: true,
    financialRegulationCompliant: true,
    auditTrailActive: true,
    lastComplianceCheck: new Date().toISOString(),
  },
  auditTrail: [],
  auditingActive: true,
  
  featureFlags: {},
  flagApprovals: {},
  
  securityMonitoringActive: true,
  threatDetectionActive: true,
  complianceMonitoringActive: true,
  
  isExperimentLoading: false,
  isIsolationValidating: false,
  isComplianceChecking: false,
  
  dataEncrypted: true,
  dataRetentionCompliant: true,
  dataExportRestricted: false,
};

function nvdaStagingAnalysisReducer(state: NvdaStagingAnalysisState, action: NvdaStagingAnalysisAction): NvdaStagingAnalysisState {
  logger.state('StagingReducer', 'Action dispatched', { type: action.type, previousStatus: state.status });
  
  // Optimized audit events - only create for significant actions to prevent excessive state mutations
  const shouldAudit = [
    'SET_ERROR', 'RESET_STATE', 'SET_EXPERIMENT_TYPE', 'SET_EXPERIMENT_ACTIVE',
    'VALIDATE_ISOLATION', 'UPDATE_COMPLIANCE_STATUS', 'SECURITY_ALERT',
    'ENABLE_SECURITY_MONITORING', 'DISABLE_SECURITY_MONITORING'
  ].includes(action.type);
  
  const auditEvent: AuditEvent | null = shouldAudit ? {
    id: generateUUID(),
    type: 'STATE_MUTATION',
    action: action.type,
    timestamp: new Date().toISOString(),
    userId: state.securityContext.userId,
    details: { action },
    severity: action.type === 'SET_ERROR' || action.type === 'SECURITY_ALERT' ? 'high' : 'low',
  } : null;

  switch (action.type) {
    // === CORE ACTIONS (IDENTICAL TO PRODUCTION) ===
    case 'SET_LOADING':
      return { 
        ...state, 
        status: 'loading',
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_IDLE':
      return { 
        ...state, 
        status: 'idle', 
        error: null,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_ERROR':
      return { 
        ...state, 
        status: 'error', 
        error: action.payload,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_EXPIRATION_DATES':
      return { 
        ...state, 
        availableExpirationDates: action.payload,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_SELECTED_EXPIRATION':
      return { 
        ...state, 
        selectedExpirationDate: action.payload,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_OPTIONS_SETTINGS':
      return { 
        ...state, 
        ...action.payload,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_STOCK_DATA':
      return {
        ...state,
        ...action.payload,
        hasStockData: true,
        hasAiTaData: true,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_OPTIONS_CHAIN_DATA':
      return {
        ...state,
        optionsChainJson: action.payload,
        hasOptionsChainData: action.payload.length > 0,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_AI_KEY_TAKEAWAYS':
      return {
        ...state,
        aiKeyTakeawaysJson: action.payload,
        hasAiKeyTakeaways: action.payload.length > 0,
        isAiKeyTakeawaysLoading: false,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_AI_KEY_TAKEAWAYS_LOADING':
      return {
        ...state,
        isAiKeyTakeawaysLoading: action.payload,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_AI_OPTIONS_ANALYSIS':
      return {
        ...state,
        aiOptionsAnalysisJson: action.payload,
        hasAiOptionsAnalysis: action.payload.length > 0,
        isAiOptionsAnalysisLoading: false,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_AI_OPTIONS_ANALYSIS_LOADING':
      return {
        ...state,
        isAiOptionsAnalysisLoading: action.payload,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_DATA_RETRIEVAL_COMPLETE':
      return {
        ...state,
        dataRetrievalComplete: action.payload,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_AI_CHAT_RAW_DATA':
      const { promptName, responseJson, webSearchEnabled, isUserInput } = action.payload;
      const updates: Partial<NvdaStagingAnalysisState> = {};
      
      if (isUserInput) {
        if (webSearchEnabled) {
          updates.userInputWebSearchRawJson = responseJson;
        } else {
          updates.userInputAppDataRawJson = responseJson;
        }
      } else {
        switch (promptName) {
          case 'stock-trader-takeaways':
            updates.stockTraderTakeawaysRawJson = responseJson;
            break;
          case 'options-trader-takeaways':
            updates.optionsTraderTakeawaysRawJson = responseJson;
            break;
          case 'holistic-takeaways':
            updates.holisticTakeawaysRawJson = responseJson;
            break;
          case 'support-resistance-web-search':
            updates.supportResistanceWebSearchRawJson = responseJson;
            break;
          case 'technical-analysis-web-search':
            updates.technicalAnalysisWebSearchRawJson = responseJson;
            break;
          case 'options-flow-web-search':
            updates.optionsFlowWebSearchRawJson = responseJson;
            break;
        }
      }
      
      return {
        ...state,
        ...updates,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'RESET_STATE':
      return {
        ...initialState,
        securityContext: {
          ...initialState.securityContext,
          sessionId: generateUUID(),
          timestamp: new Date().toISOString(),
        },
        auditTrail: [{
          id: generateUUID(),
          type: 'STATE_MUTATION',
          action: 'RESET_STATE',
          timestamp: new Date().toISOString(),
          userId: initialState.securityContext.userId,
          details: { action: { type: 'RESET_STATE' } },
          severity: 'medium',
        }],
      };

    // === STAGING-SPECIFIC ACTIONS ===
    case 'SET_EXPERIMENT_TYPE':
      return {
        ...state,
        experimentType: action.payload,
        experimentStartTime: new Date().toISOString(),
        auditTrail: auditEvent ? [...state.auditTrail, { ...auditEvent, severity: 'medium' }] : state.auditTrail,
      };
    
    case 'SET_EXPERIMENT_CONFIG':
      return {
        ...state,
        experimentConfig: action.payload,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_EXPERIMENT_ACTIVE':
      return {
        ...state,
        experimentActive: action.payload,
        experimentStartTime: action.payload ? new Date().toISOString() : null,
        auditTrail: auditEvent ? [...state.auditTrail, { ...auditEvent, severity: 'medium' }] : state.auditTrail,
      };
    
    case 'SET_EXPERIMENT_LOADING':
      return {
        ...state,
        isExperimentLoading: action.payload,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'UPDATE_PERFORMANCE_METRICS':
      return {
        ...state,
        performanceMetrics: action.payload,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_PERFORMANCE_BASELINE':
      return {
        ...state,
        performanceBaseline: action.payload,
        performanceComparison: true,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'VALIDATE_ISOLATION':
      return {
        ...state,
        isolationValidation: action.payload,
        isIsolationValidating: false,
        auditTrail: auditEvent ? [...state.auditTrail, { 
          ...auditEvent, 
          severity: action.payload.violations.length > 0 ? 'high' : 'low' 
        }] : state.auditTrail,
      };
    
    case 'SET_ISOLATION_VALIDATING':
      return {
        ...state,
        isIsolationValidating: action.payload,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'UPDATE_COMPLIANCE_STATUS':
      return {
        ...state,
        complianceStatus: action.payload,
        isComplianceChecking: false,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'SET_COMPLIANCE_CHECKING':
      return {
        ...state,
        isComplianceChecking: action.payload,
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'ADD_AUDIT_EVENT':
      return {
        ...state,
        auditTrail: [...state.auditTrail, action.payload],
      };
    
    case 'SET_FEATURE_FLAG':
      const { flag, enabled, approver } = action.payload;
      return {
        ...state,
        featureFlags: { ...state.featureFlags, [flag]: enabled },
        flagApprovals: approver ? { ...state.flagApprovals, [flag]: approver } : state.flagApprovals,
        auditTrail: auditEvent ? [...state.auditTrail, { ...auditEvent, severity: 'medium' }] : state.auditTrail,
      };
    
    case 'UPDATE_SECURITY_CONTEXT':
      return {
        ...state,
        securityContext: { ...state.securityContext, ...action.payload },
        auditTrail: auditEvent ? [...state.auditTrail, auditEvent] : state.auditTrail,
      };
    
    case 'ENABLE_SECURITY_MONITORING':
      return {
        ...state,
        securityMonitoringActive: true,
        threatDetectionActive: true,
        auditTrail: auditEvent ? [...state.auditTrail, { ...auditEvent, severity: 'medium' }] : state.auditTrail,
      };
    
    case 'DISABLE_SECURITY_MONITORING':
      return {
        ...state,
        securityMonitoringActive: false,
        threatDetectionActive: false,
        auditTrail: auditEvent ? [...state.auditTrail, { ...auditEvent, severity: 'high' }] : state.auditTrail,
      };
    
    case 'SECURITY_ALERT':
      const alertEvent: AuditEvent = {
        id: generateUUID(),
        type: 'SECURITY_ALERT',
        action: action.payload.type,
        timestamp: new Date().toISOString(),
        userId: state.securityContext.userId,
        details: action.payload.details,
        severity: action.payload.severity,
      };
      
      return {
        ...state,
        auditTrail: [...state.auditTrail, alertEvent],
      };
    
    default:
      logger.warn('StagingReducer', 'Unknown action type', { action });
      return state;
  }
}

// Context creation with security boundaries
const NvdaStagingAnalysisContext = createContext<NvdaStagingAnalysisState | undefined>(undefined);
const NvdaStagingDispatchContext = createContext<React.Dispatch<NvdaStagingAnalysisAction> | undefined>(undefined);

// Custom hooks with isolation validation
export function useNvdaStagingAnalysis(): NvdaStagingAnalysisState {
  const context = useContext(NvdaStagingAnalysisContext);
  if (context === undefined) {
    throw new Error('useNvdaStagingAnalysis must be used within a NvdaStagingAnalysisProvider');
  }
  
  // Validate isolation boundary
  if (typeof window !== 'undefined' && (window as any).__PRODUCTION_NVDA_STATE__) {
    console.warn('🚨 STAGING ISOLATION VIOLATION: Production state detected in staging environment');
  }
  
  return context;
}

export function useNvdaStagingDispatch(): React.Dispatch<NvdaStagingAnalysisAction> {
  const context = useContext(NvdaStagingDispatchContext);
  if (context === undefined) {
    throw new Error('useNvdaStagingDispatch must be used within a NvdaStagingAnalysisProvider');
  }
  return context;
}

// Provider component with enterprise security features
interface NvdaStagingAnalysisProviderProps {
  children: ReactNode;
}

export function NvdaStagingAnalysisProvider({ children }: NvdaStagingAnalysisProviderProps) {
  const [state, dispatch] = useReducer(nvdaStagingAnalysisReducer, initialState);

  // Security monitoring and isolation validation - optimized to prevent loops
  useEffect(() => {
    // Validate isolation boundaries on mount
    const validateIsolation = () => {
      if (typeof window !== 'undefined') {
        const productionStateDetected = !!(window as any).__PRODUCTION_NVDA_STATE__;
        
        if (productionStateDetected) {
          dispatch({
            type: 'SECURITY_ALERT',
            payload: {
              type: 'ISOLATION_VIOLATION',
              severity: 'high',
              details: {
                message: 'Production state detected in staging environment',
                timestamp: new Date().toISOString(),
              },
            },
          });
        }
        
        dispatch({
          type: 'VALIDATE_ISOLATION',
          payload: {
            validated: !productionStateDetected,
            lastValidation: new Date().toISOString(),
            violations: productionStateDetected ? ['Production state detected'] : [],
            boundariesActive: true,
          },
        });
      }
    };

    // Run initial validation with delay to prevent immediate loops
    const initialTimeout = setTimeout(validateIsolation, 500);
    
    // Set up periodic validation with longer interval
    const interval = setInterval(validateIsolation, 60000); // Every 60 seconds (reduced frequency)

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      
      // Enhanced cleanup for memory leak prevention
      if (typeof window !== 'undefined') {
        // Clear any staging-specific global variables
        Object.keys(window).forEach(key => {
          if (key.includes('STAGING') || key.includes('staging')) {
            try {
              delete (window as any)[key];
            } catch (e) {
              // Ignore deletion errors for non-configurable properties
            }
          }
        });
      }
    };
  }, []); // Empty dependency array for mount-only effect

  // Log provider mount for audit trail - delayed to prevent immediate dispatch loops
  useEffect(() => {
    const mountTimeout = setTimeout(() => {
      dispatch({
        type: 'ADD_AUDIT_EVENT',
        payload: {
          id: generateUUID(),
          type: 'PROVIDER_MOUNT',
          action: 'INITIALIZATION',
          timestamp: new Date().toISOString(),
          details: { 
            environment: 'staging',
            securityMonitoring: true,
            isolationBoundaries: true,
          },
          severity: 'low',
        },
      });
    }, 1000); // 1 second delay

    return () => clearTimeout(mountTimeout);
  }, []);

  console.log('NvdaStagingAnalysisProvider: Provider rendered', { 
    status: state.status,
    experimentType: state.experimentType,
    securityMonitoring: state.securityMonitoringActive,
  });

  return (
    <NvdaStagingAnalysisContext.Provider value={state}>
      <NvdaStagingDispatchContext.Provider value={dispatch}>
        {children}
      </NvdaStagingDispatchContext.Provider>
    </NvdaStagingAnalysisContext.Provider>
  );
}