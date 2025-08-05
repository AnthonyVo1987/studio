/**
 * @fileOverview XState Debugging and Developer Tools - Type Definitions
 * 
 * Comprehensive type definitions for XState debugging infrastructure,
 * including inspector types, logging interfaces, and development utilities.
 * Integrates with existing StockSage debugging patterns and ticker-logger system.
 */

import type { ActorRef, StateFrom, EventFrom, Snapshot } from 'xstate';
import type { MacroExecutionContext, MacroExecutionEvent } from '../types/macro-types';
import type { LogLevel, LogContext, TickerLogOptions } from '../../ticker-logger';

// ================================
// CORE DEBUGGING TYPES
// ================================

export type DebugLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface DebugConfiguration {
  enabled: boolean;
  level: DebugLevel;
  enableInspector: boolean;
  enableConsoleLogging: boolean;
  enablePerformanceMetrics: boolean;
  enableStateSnapshots: boolean;
  enableTransitionLogging: boolean;
  enableActionLogging: boolean;
  enableGuardLogging: boolean;
  enableServiceLogging: boolean;
  enableErrorTracking: boolean;
  maxSnapshots: number;
  snapshotInterval: number;
  performanceSamplingRate: number;
  logFilters: DebugLogFilter[];
}

export interface DebugLogFilter {
  type: 'include' | 'exclude';
  pattern: string | RegExp;
  categories: DebugCategory[];
}

export type DebugCategory = 
  | 'state-transition'
  | 'action-execution' 
  | 'guard-evaluation'
  | 'service-invocation'
  | 'error-occurrence'
  | 'performance-metric'
  | 'machine-lifecycle'
  | 'actor-communication'
  | 'context-mutation'
  | 'event-emission';

// ================================
// INSPECTOR INTEGRATION TYPES
// ================================

export interface InspectorConfiguration {
  enabled: boolean;
  url: string;
  autoStart: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  enableRemoteInspection: boolean;
  customInspectorAdapter?: InspectorAdapter;
}

export interface InspectorAdapter {
  connect(config: InspectorConfiguration): Promise<void>;
  disconnect(): Promise<void>;
  sendSnapshot(snapshot: MachineSnapshot): void;
  sendTransition(transition: StateTransition): void;
  sendEvent(event: InspectorEvent): void;
  isConnected(): boolean;
}

export interface InspectorEvent {
  id: string;
  timestamp: number;
  machineId: string;
  type: 'snapshot' | 'transition' | 'action' | 'guard' | 'service' | 'error';
  data: any;
  metadata?: InspectorMetadata;
}

export interface InspectorMetadata {
  ticker?: string;
  executionId?: string;
  stepId?: string;
  userAgent?: string;
  sessionId?: string;
  buildVersion?: string;
}

// ================================
// MACHINE ANALYSIS TYPES
// ================================

export interface MachineAnalysis {
  machineId: string;
  totalStates: number;
  totalTransitions: number;
  totalActions: number;
  totalGuards: number;
  totalServices: number;
  complexity: MachineComplexity;
  potentialIssues: MachineIssue[];
  performance: MachinePerformanceMetrics;
  recommendations: string[];
}

export interface MachineComplexity {
  cyclomatic: number;
  stateDepth: number;
  transitionCount: number;
  branchingFactor: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface MachineIssue {
  id: string;
  type: 'performance' | 'logic' | 'design' | 'maintainability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  suggestion: string;
  detectedAt: number;
}

export interface MachinePerformanceMetrics {
  averageTransitionTime: number;
  slowestTransition: {
    from: string;
    to: string;
    duration: number;
  };
  memoryUsage: {
    current: number;
    peak: number;
    average: number;
  };
  cpuUsage: {
    average: number;
    peak: number;
  };
  gcPressure: number;
}

// ================================
// STATE SNAPSHOT TYPES
// ================================

export interface MachineSnapshot {
  id: string;
  timestamp: number;
  machineId: string;
  state: string | object;
  context: any;
  event?: any;
  metadata: SnapshotMetadata;
  performance: SnapshotPerformance;
  relationships: MachineRelationships;
}

export interface SnapshotMetadata {
  ticker?: string;
  executionId?: string;
  stepId?: string;
  userAction?: string;
  sessionId: string;
  sequenceNumber: number;
  parentSnapshot?: string;
  childSnapshots: string[];
}

export interface SnapshotPerformance {
  captureTime: number;
  serializationTime: number;
  memoryFootprint: number;
  contextSize: number;
  machineUptime: number;
}

export interface MachineRelationships {
  parentMachine?: string;
  childMachines: string[];
  spawningMachines: string[];
  communicatingMachines: string[];
}

// ================================
// TRANSITION LOGGING TYPES
// ================================

export interface StateTransition {
  id: string;
  timestamp: number;
  machineId: string;
  from: string | object;
  to: string | object;
  event: any;
  actions: ExecutedAction[];
  guards: EvaluatedGuard[];
  duration: number;
  success: boolean;
  error?: Error;
  context: TransitionContext;
}

export interface ExecutedAction {
  name: string;
  type: 'entry' | 'exit' | 'transition';
  executionTime: number;
  success: boolean;
  error?: Error;
  parameters?: any;
  result?: any;
}

export interface EvaluatedGuard {
  name: string;
  result: boolean;
  evaluationTime: number;
  parameters?: any;
  conditions?: any;
}

export interface TransitionContext {
  ticker?: string;
  executionId?: string;
  stepId?: string;
  previousContext: any;
  nextContext: any;
  contextDiff: ContextDiff;
}

export interface ContextDiff {
  added: Record<string, any>;
  modified: Record<string, { from: any; to: any }>;
  removed: Record<string, any>;
}

// ================================
// PERFORMANCE MONITORING TYPES
// ================================

export interface PerformanceMonitorConfiguration {
  enabled: boolean;
  samplingRate: number;
  metricsInterval: number;
  enableMemoryTracking: boolean;
  enableCpuTracking: boolean;
  enableNetworkTracking: boolean;
  enableCustomMetrics: boolean;
  thresholds: PerformanceThresholds;
}

export interface PerformanceThresholds {
  transitionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  gcFrequency: number;
  networkLatency: number;
}

export interface PerformanceReport {
  id: string;
  timestamp: number;
  machineId: string;
  duration: number;
  metrics: PerformanceMetric[];
  bottlenecks: PerformanceBottleneck[];
  recommendations: string[];
  summary: PerformanceSummary;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  category: 'memory' | 'cpu' | 'network' | 'custom';
  threshold?: number;
  exceeded: boolean;
}

export interface PerformanceBottleneck {
  location: string;
  type: 'memory' | 'cpu' | 'network' | 'logic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: number;
  suggestion: string;
}

export interface PerformanceSummary {
  totalExecutionTime: number;
  averageTransitionTime: number;
  peakMemoryUsage: number;
  averageCpuUsage: number;
  bottleneckCount: number;
  overallRating: 'excellent' | 'good' | 'fair' | 'poor';
}

// ================================
// TESTING AND MOCK TYPES
// ================================

export interface TestingConfiguration {
  enableMockServices: boolean;
  enableTimeTravel: boolean;
  enableStateManipulation: boolean;
  mockServiceDelay: number;
  automaticStateValidation: boolean;
  testDataGeneration: boolean;
}

export interface MockServiceConfiguration {
  serviceName: string;
  mockType: 'success' | 'error' | 'delayed' | 'conditional';
  delay?: number;
  errorRate?: number;
  responseData?: any;
  conditions?: MockCondition[];
}

export interface MockCondition {
  when: (context: any, event: any) => boolean;
  then: 'success' | 'error' | 'delayed';
  value?: any;
}

export interface StateManipulationCommand {
  type: 'setState' | 'updateContext' | 'sendEvent' | 'resetMachine';
  machineId: string;
  state?: string | object;
  context?: any;
  event?: any;
  timestamp: number;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  initialState: string | object;
  initialContext: any;
  events: TestEvent[];
  expectedFinalState: string | object;
  expectedFinalContext: any;
  assertions: TestAssertion[];
}

export interface TestEvent {
  type: string;
  data?: any;
  delay?: number;
  condition?: (context: any) => boolean;
}

export interface TestAssertion {
  type: 'state' | 'context' | 'event' | 'action' | 'guard' | 'service';
  target: string;
  condition: 'equals' | 'contains' | 'matches' | 'custom';
  expected: any;
  customValidator?: (actual: any, expected: any) => boolean;
}

// ================================
// ERROR TRACKING TYPES
// ================================

export interface ErrorTrackingConfiguration {
  enabled: boolean;
  captureStackTraces: boolean;
  enableErrorRecovery: boolean;
  maxErrorHistory: number;
  errorSamplingRate: number;
  enableErrorReporting: boolean;
  reportingEndpoint?: string;
}

export interface MachineError {
  id: string;
  timestamp: number;
  machineId: string;
  error: Error;
  context: any;
  state: string | object;
  event?: any;
  stackTrace?: string;
  recovery?: ErrorRecovery;
  metadata: ErrorMetadata;
}

export interface ErrorRecovery {
  attempted: boolean;
  successful: boolean;
  strategy: string;
  attempts: number;
  finalState?: string | object;
  finalContext?: any;
}

export interface ErrorMetadata {
  ticker?: string;
  executionId?: string;
  stepId?: string;
  userAgent?: string;
  sessionId?: string;
  buildVersion?: string;
  environment?: string;
}

// ================================
// DEVELOPER PANEL TYPES
// ================================

export interface DeveloperPanelConfiguration {
  enabled: boolean;
  position: 'top' | 'bottom' | 'left' | 'right' | 'floating';
  theme: 'light' | 'dark' | 'auto';
  defaultTab: DeveloperPanelTab;
  enabledTabs: DeveloperPanelTab[];
  hotkeys: Record<string, string>;
}

export type DeveloperPanelTab = 
  | 'machines'
  | 'inspector' 
  | 'performance'
  | 'logs'
  | 'testing'
  | 'errors'
  | 'network'
  | 'profiler';

export interface DeveloperPanelState {
  isOpen: boolean;
  activeTab: DeveloperPanelTab;
  selectedMachine?: string;
  filters: PanelFilters;
  settings: PanelSettings;
}

export interface PanelFilters {
  machineId?: string;
  ticker?: string;
  executionId?: string;
  logLevel?: DebugLevel;
  timeRange?: {
    start: number;
    end: number;
  };
  searchQuery?: string;
}

export interface PanelSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  enableNotifications: boolean;
  maxDisplayItems: number;
  enableAutoScroll: boolean;
}

// ================================
// INTEGRATION TYPES
// ================================

export interface StockSageDebugIntegration {
  tickerLoggerCompatible: boolean;
  macroExecutionTracking: boolean;
  aiFlowDebugging: boolean;
  performanceIntegration: boolean;
  errorBoundaryIntegration: boolean;
}

export interface DebuggerAPI {
  // Configuration
  configure(config: Partial<DebugConfiguration>): void;
  getConfiguration(): DebugConfiguration;
  
  // Inspector
  enableInspector(config?: Partial<InspectorConfiguration>): void;
  disableInspector(): void;
  
  // Snapshots
  takeSnapshot(machineId: string): MachineSnapshot;
  getSnapshots(machineId?: string): MachineSnapshot[];
  clearSnapshots(machineId?: string): void;
  
  // Performance
  startProfiling(machineId: string): void;
  stopProfiling(machineId: string): PerformanceReport;
  getPerformanceMetrics(machineId?: string): PerformanceMetric[];
  
  // Testing
  enableTestMode(config?: Partial<TestingConfiguration>): void;
  disableTestMode(): void;
  runTestScenario(scenario: TestScenario): Promise<TestResult>;
  
  // Error Tracking
  getErrors(machineId?: string): MachineError[];
  clearErrors(machineId?: string): void;
  
  // Developer Panel
  showPanel(): void;
  hidePanel(): void;
  setPanelTab(tab: DeveloperPanelTab): void;
}

export interface TestResult {
  scenarioId: string;
  success: boolean;
  duration: number;
  assertions: AssertionResult[];
  error?: Error;
  finalState: string | object;
  finalContext: any;
}

export interface AssertionResult {
  assertion: TestAssertion;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

// ================================
// UTILITY TYPES
// ================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DebugEventListener<T = any> = (event: T) => void;

export type MachineSelector = string | RegExp | ((machineId: string) => boolean);

export type ContextSerializer = (context: any) => string;

export type StateComparator = (stateA: any, stateB: any) => boolean;

// ================================
// COMPATIBILITY TYPES
// ================================

/**
 * Bridge types for integration with existing StockSage debugging infrastructure
 */
export interface TickerDebugContext extends TickerLogOptions {
  machineId?: string;
  snapshotId?: string;
  transitionId?: string;
  performanceMetrics?: Record<string, number>;
}

export interface MacroDebugEvent {
  type: 'debug' | 'info' | 'warn' | 'error';
  category: DebugCategory;
  message: string;
  data?: any;
  context?: TickerDebugContext;
}

// ================================
// STRUCTURED LOGGING TYPES
// ================================

export interface StructuredLogEntry {
  id: string;
  timestamp: number;
  level: DebugLevel;
  category: DebugCategory;
  machineId?: string;
  message: string;
  data?: any;
  context?: TickerDebugContext;
  performance?: LogPerformanceMetrics;
  stackTrace?: string;
  sessionId?: string;
  environment?: string;
}

export interface LogPerformanceMetrics {
  duration?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

// ================================
// MISSING TYPE DEFINITIONS
// ================================

export interface HotReloadConfig {
  enabled: boolean;
  watchPaths: string[];
  excludePaths: string[];
  reloadDelay: number;
  autoRestart: boolean;
}

export interface DebugShortcuts {
  toggleInspector: string;
  clearLogs: string;
  exportLogs: string;
  togglePerformance: string;
  resetState: string;
}

