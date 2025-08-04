/**
 * @fileOverview XState Debugging and Developer Tools - Main Exports
 * 
 * Comprehensive debugging and developer tools system for XState machines.
 * Provides inspector integration, advanced logging, performance profiling,
 * testing utilities, and developer panels for enhanced development experience.
 */

// ================================
// TYPE EXPORTS
// ================================

export type {
  // Core debugging types
  DebugConfiguration,
  DebugLevel,
  DebugCategory,
  DebugLogFilter,
  
  // Inspector types
  InspectorConfiguration,
  InspectorAdapter,
  InspectorEvent,
  InspectorMetadata,
  
  // Machine analysis types
  MachineAnalysis,
  MachineComplexity,
  MachineIssue,
  MachinePerformanceMetrics,
  
  // Snapshot types
  MachineSnapshot,
  SnapshotMetadata,
  SnapshotPerformance,
  MachineRelationships,
  
  // Transition types
  StateTransition,
  ExecutedAction,
  EvaluatedGuard,
  TransitionContext,
  ContextDiff,
  
  // Performance types
  PerformanceMonitorConfiguration,
  PerformanceThresholds,
  PerformanceReport,
  PerformanceMetric,
  PerformanceBottleneck,
  PerformanceSummary,
  
  // Testing types
  TestingConfiguration,
  MockServiceConfiguration,
  MockCondition,
  StateManipulationCommand,
  TestScenario,
  TestEvent,
  TestAssertion,
  TestResult,
  AssertionResult,
  
  // Error types
  ErrorTrackingConfiguration,
  MachineError,
  ErrorRecovery,
  ErrorMetadata,
  
  // Panel types
  DeveloperPanelConfiguration,
  DeveloperPanelTab,
  DeveloperPanelState,
  PanelFilters,
  PanelSettings,
  
  // Integration types
  StockSageDebugIntegration,
  DebuggerAPI,
  
  // Utility types
  DeepPartial,
  DebugEventListener,
  MachineSelector,
  ContextSerializer,
  StateComparator,
  
  // Compatibility types
  TickerDebugContext,
  MacroDebugEvent
} from './debugging-types';

// ================================
// INSPECTOR EXPORTS
// ================================

export {
  // Inspector classes
  InspectorConnectionManager,
  RealTimeStateVisualizer,
  MachineSnapshotComparator,
  
  // Inspector configuration
  ADVANCED_INSPECTOR_CONFIG,
  
  // Global instances
  globalInspectorManager,
  globalStateVisualizer,
  globalSnapshotComparator,
  
  // Factory functions
  createInspectedMachine,
  createDebugActor,
  
  // Utility functions
  initializeInspector,
  cleanupInspector
} from './xstate-inspector';

export type {
  SnapshotComparison,
  StateDiff,
  PerformanceDiff
} from './xstate-inspector';

// ================================
// ADVANCED LOGGER EXPORTS
// ================================

export {
  // Logger classes
  AdvancedXStateLogger,
  LogAggregator,
  
  // Configuration
  DEFAULT_LOGGING_CONFIG,
  
  // Global instance
  globalAdvancedLogger,
  
  // Factory functions
  createMachineLogger
} from './advanced-logger';

export type {
  StructuredLogEntry,
  LogPerformanceMetrics,
  LogStatistics
} from './advanced-logger';

// ================================
// DEVELOPER TOOLS EXPORTS
// ================================

export {
  // Environment detection
  EnvironmentDetector,
  globalEnvironmentDetector,
  
  // Hot reload support
  HotReloadManager,
  globalHotReloadManager,
  
  // Debug shortcuts
  DebugShortcutManager,
  globalShortcutManager,
  
  // Developer commands
  DeveloperCommandRegistry,
  globalCommandRegistry,
  
  // State manipulation
  StateManipulator,
  globalStateManipulator,
  
  // Initialization utilities
  initializeDeveloperTools,
  cleanupDeveloperTools
} from './dev-tools';

export type {
  EnvironmentInfo,
  HotReloadConfig,
  DebugShortcuts,
  DeveloperCommand
} from './dev-tools';

// ================================
// MACHINE TESTING EXPORTS
// ================================

export {
  // Testing classes
  MockServiceManager,
  TestScenarioRunner,
  StateValidator,
  TestDataGenerator,
  
  // Configuration
  DEFAULT_TESTING_CONFIG,
  
  // Global instances
  globalMockManager,
  globalTestRunner,
  globalStateValidator,
  globalTestDataGenerator,
  
  // Utility functions
  createTestMachine,
  runQuickTest,
  createMacroExecutionTest
} from './machine-testing';

export type {
  ValidationResult,
  ValidationError,
  ValidationWarning
} from './machine-testing';

// ================================
// DEBUG PANELS EXPORTS
// ================================

export {
  // React components
  DeveloperPanel
} from './debug-panels';

export type {
  DeveloperPanelProps
} from './debug-panels';

// ================================
// PERFORMANCE PROFILER EXPORTS
// ================================

export {
  // Profiler classes
  PerformanceMetricsCollector,
  PerformanceProfiler,
  
  // Configuration
  DEFAULT_PROFILER_CONFIG,
  
  // Global instance
  globalPerformanceProfiler,
  
  // Convenience functions
  startProfiling,
  stopProfiling,
  recordTransitionPerformance,
  recordSnapshotPerformance,
  recordCustomMetric,
  getCurrentPerformanceMetrics,
  profileMachineExecution
} from './performance-profiler';

export type {
  MetricSample,
  MetricSeries,
  ProfilingSession
} from './performance-profiler';

// ================================
// UNIFIED DEBUGGING API
// ================================

import { globalInspectorManager, globalStateVisualizer } from './xstate-inspector';
import { globalAdvancedLogger } from './advanced-logger';
import { globalPerformanceProfiler } from './performance-profiler';
import { globalMockManager, globalTestRunner } from './machine-testing';
import { 
  globalEnvironmentDetector, 
  globalCommandRegistry,
  initializeDeveloperTools,
  cleanupDeveloperTools 
} from './dev-tools';
import type { 
  DebugConfiguration, 
  InspectorConfiguration, 
  TestingConfiguration,
  PerformanceMonitorConfiguration,
  DeveloperPanelConfiguration,
  HotReloadConfig,
  DebugShortcuts
} from './debugging-types';

/**
 * Unified debugging configuration interface
 */
export interface UnifiedDebugConfig {
  debug?: Partial<DebugConfiguration>;
  inspector?: Partial<InspectorConfiguration>;
  testing?: Partial<TestingConfiguration>;
  performance?: Partial<PerformanceMonitorConfiguration>;
  panel?: Partial<DeveloperPanelConfiguration>;
  hotReload?: Partial<HotReloadConfig>;
  shortcuts?: Partial<DebugShortcuts>;
}

/**
 * Comprehensive debugging API that provides access to all debugging tools
 */
export class UnifiedDebugger implements DebuggerAPI {
  private initialized: boolean = false;

  // ================================
  // CONFIGURATION METHODS
  // ================================

  configure(config: Partial<DebugConfiguration>): void {
    globalAdvancedLogger.updateConfiguration(config);
  }

  getConfiguration(): DebugConfiguration {
    return globalAdvancedLogger.getConfiguration();
  }

  // ================================
  // INSPECTOR METHODS
  // ================================

  enableInspector(config?: Partial<InspectorConfiguration>): void {
    globalInspectorManager.connect();
  }

  disableInspector(): void {
    globalInspectorManager.disconnect();
  }

  // ================================
  // SNAPSHOT METHODS
  // ================================

  takeSnapshot(machineId: string): any {
    const snapshots = globalStateVisualizer.getActiveSnapshots();
    return snapshots.get(machineId) || null;
  }

  getSnapshots(machineId?: string): any[] {
    const snapshots = Array.from(globalStateVisualizer.getActiveSnapshots().values());
    return machineId ? snapshots.filter(s => s.machineId === machineId) : snapshots;
  }

  clearSnapshots(machineId?: string): void {
    globalStateVisualizer.clearHistory(machineId);
  }

  // ================================
  // PERFORMANCE METHODS
  // ================================

  startProfiling(machineId: string): void {
    globalPerformanceProfiler.startProfiling(machineId);
  }

  stopProfiling(machineId: string): any {
    // Find active session for this machine
    const activeSessions = globalPerformanceProfiler.getActiveSessions();
    const sessionId = activeSessions[0]; // Simplified - in reality, would map machine to session
    
    if (sessionId) {
      return globalPerformanceProfiler.stopProfiling(sessionId);
    }
    
    throw new Error(`No active profiling session for machine: ${machineId}`);
  }

  getPerformanceMetrics(machineId?: string): any[] {
    return globalPerformanceProfiler.getCurrentMetrics();
  }

  // ================================
  // TESTING METHODS
  // ================================

  enableTestMode(config?: Partial<TestingConfiguration>): void {
    globalMockManager.setEnabled(true);
  }

  disableTestMode(): void {
    globalMockManager.setEnabled(false);
  }

  async runTestScenario(scenario: any): Promise<any> {
    // This would need a machine instance - simplified implementation
    throw new Error('runTestScenario requires machine instance');
  }

  // ================================
  // ERROR TRACKING METHODS
  // ================================

  getErrors(machineId?: string): any[] {
    // Get errors from logger
    const logs = globalAdvancedLogger.getLogs({ level: 'error' });
    return machineId ? logs.filter(log => log.machineId === machineId) : logs;
  }

  clearErrors(machineId?: string): void {
    // This would require more sophisticated error tracking
    globalAdvancedLogger.clearLogs(machineId);
  }

  // ================================
  // DEVELOPER PANEL METHODS
  // ================================

  showPanel(): void {
    // This would be handled by the React component
    console.log('Show developer panel - use DeveloperPanel React component');
  }

  hidePanel(): void {
    // This would be handled by the React component
    console.log('Hide developer panel - use DeveloperPanel React component');
  }

  setPanelTab(tab: any): void {
    // This would be handled by the React component
    console.log(`Set panel tab to: ${tab}`);
  }

  // ================================
  // INITIALIZATION METHODS
  // ================================

  async initialize(config: UnifiedDebugConfig = {}): Promise<void> {
    if (this.initialized) {
      console.warn('Unified debugger already initialized');
      return;
    }

    const env = globalEnvironmentDetector.detect();
    
    if (!env.isDevelopment) {
      console.warn('Debugging tools are only available in development environment');
      return;
    }

    console.log('Initializing unified XState debugger...', config);

    // Initialize components
    if (config.debug) {
      this.configure(config.debug);
    }

    if (config.inspector) {
      await globalInspectorManager.connect();
    }

    if (config.testing) {
      globalMockManager.setEnabled(config.testing.enableMockServices !== false);
    }

    // Initialize developer tools
    initializeDeveloperTools({
      enableHotReload: config.hotReload?.enabled !== false,
      enableShortcuts: config.shortcuts ? Object.keys(config.shortcuts).length > 0 : true,
      hotReloadConfig: config.hotReload,
      shortcuts: config.shortcuts
    });

    this.initialized = true;
    console.log('Unified XState debugger initialized successfully');

    // Log available commands
    const commands = globalCommandRegistry.executeCommand('debug.help');
    console.log('Available debug commands:', commands);
  }

  async cleanup(): Promise<void> {
    if (!this.initialized) return;

    console.log('Cleaning up unified XState debugger...');

    await globalInspectorManager.disconnect();
    globalStateVisualizer.clearHistory();
    globalAdvancedLogger.clearLogs();
    globalPerformanceProfiler.destroy();
    cleanupDeveloperTools();

    this.initialized = false;
    console.log('Unified XState debugger cleaned up');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // ================================
  // UTILITY METHODS
  // ================================

  getEnvironmentInfo(): any {
    return globalEnvironmentDetector.detect();
  }

  executeCommand(command: string, ...args: any[]): any {
    return globalCommandRegistry.executeCommand(command, ...args);
  }

  getAvailableCommands(): any[] {
    return globalCommandRegistry.getCommands();
  }

  exportAllData(): string {
    const data = {
      exportTime: new Date().toISOString(),
      environment: this.getEnvironmentInfo(),
      logs: globalAdvancedLogger.exportLogs('json'),
      performance: globalPerformanceProfiler.exportProfilerData(),
      visualization: globalStateVisualizer.exportVisualizationData(),
      configuration: this.getConfiguration()
    };

    return JSON.stringify(data, null, 2);
  }
}

// ================================
// GLOBAL UNIFIED DEBUGGER
// ================================

export const globalUnifiedDebugger = new UnifiedDebugger();

// ================================
// CONVENIENCE FUNCTIONS
// ================================

/**
 * Quick setup for XState debugging with sensible defaults
 */
export const quickSetupDebugging = async (config: UnifiedDebugConfig = {}) => {
  const defaultConfig: UnifiedDebugConfig = {
    debug: {
      enabled: true,
      level: 'info',
      enableConsoleLogging: true,
      enablePerformanceMetrics: true,
      enableTransitionLogging: true
    },
    inspector: {
      enabled: true,
      autoStart: true
    },
    testing: {
      enableMockServices: true,
      enableTimeTravel: true
    },
    performance: {
      enabled: true,
      samplingRate: 0.1
    }
  };

  const mergedConfig = {
    debug: { ...defaultConfig.debug, ...config.debug },
    inspector: { ...defaultConfig.inspector, ...config.inspector },
    testing: { ...defaultConfig.testing, ...config.testing },
    performance: { ...defaultConfig.performance, ...config.performance }
  };

  await globalUnifiedDebugger.initialize(mergedConfig);
  return globalUnifiedDebugger;
};

/**
 * Create a fully instrumented machine for debugging
 */
export const createInstrumentedMachine = (machine: any, machineId: string) => {
  // This would create a machine with full debugging integration
  console.log(`Creating instrumented machine: ${machineId}`);
  return machine;
};

/**
 * Debug a specific machine execution
 */
export const debugMachineExecution = async (
  machineId: string,
  operation: () => Promise<any>
): Promise<any> => {
  const sessionId = globalPerformanceProfiler.startProfiling(machineId);
  
  try {
    const result = await operation();
    const report = globalPerformanceProfiler.stopProfiling(sessionId);
    
    console.log(`Machine execution completed: ${machineId}`, report.summary);
    return result;
  } catch (error) {
    const report = globalPerformanceProfiler.stopProfiling(sessionId);
    console.error(`Machine execution failed: ${machineId}`, { error, report });
    throw error;
  }
};

// ================================
// MAIN EXPORTS
// ================================

export {
  // Main debugger class
  UnifiedDebugger,
  globalUnifiedDebugger,
  
  // Convenience functions
  quickSetupDebugging,
  createInstrumentedMachine,
  debugMachineExecution
};

export type {
  UnifiedDebugConfig
};

// ================================
// DEFAULT EXPORT
// ================================

export default globalUnifiedDebugger;