/**
 * @fileOverview UI Hooks Index - Advanced XState UI Hooks Export
 * 
 * Centralized export for all advanced UI hooks used in the XState integration system.
 * Provides comprehensive hooks for state management, performance monitoring,
 * and advanced interaction patterns.
 * 
 * @created 2024-08-04
 * @version 1.0.0
 */

// XState Integration Hooks
export {
  useXStateMachineIntegration,
  useStateMachineVisualizer,
  useActorSpawning,
  useMultiTickerCoordination
} from './use-xstate-integration';

export type {
  StateMachineVisualizerConfig,
  ActorSpawningConfig,
  ActorInstance,
  MultiTickerCoordinationConfig,
  CoordinationStatus
} from './use-xstate-integration';

// Performance Monitoring Hooks
export {
  usePerformanceDashboard,
  useRealTimeMetrics
} from './use-performance-monitor';

export type {
  PerformanceDashboardConfig,
  PerformanceChartType,
  AlertThreshold,
  ChartDataPoint,
  PerformanceAlert
} from './use-performance-monitor';

// Advanced Interaction Hooks
export {
  useDragAndDrop,
  useAdvancedFiltering,
  useKeyboardShortcuts,
  useAccessibility
} from './use-advanced-interactions';

export type {
  AdvancedFilterConfig,
  FilterType,
  AppliedFilter,
  KeyboardShortcut,
  AccessibilityConfig
} from './use-advanced-interactions';