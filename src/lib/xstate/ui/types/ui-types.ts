/**
 * @fileOverview UI Types for Advanced XState Components
 * 
 * Comprehensive type definitions for the advanced UI component system,
 * integrating XState machines with React components, performance monitoring,
 * drag-and-drop workflows, and multi-ticker coordination.
 * 
 * Features:
 * - XState integration types for state visualization and debugging
 * - Performance monitoring interfaces for real-time metrics display
 * - Drag-and-drop workflow builder types with @dnd-kit integration
 * - Multi-ticker coordination types for NVDA/SPY synchronization
 * - Advanced interaction patterns with accessibility support
 * 
 * @created 2024-08-04
 * @version 1.0.0
 */

import type { ReactNode, ComponentType } from 'react';
import type { ActorRef, StateFrom, EventFrom } from 'xstate';
import type { MacroExecutionMachine } from '../machines/macro-execution-machine';
import type { PerformanceMetrics, MetricsSnapshot } from '../performance/performance-types';
import type { NvdaAnalysisState } from '@/contexts/nvda-analysis-context';
import type { SpyAnalysisState } from '@/contexts/spy-analysis-context';

// =============================================================================
// XState Integration Types
// =============================================================================

/**
 * State machine visualization configuration
 */
export interface StateMachineVisualizerConfig {
  /** Machine to visualize */
  machine: any;
  /** Actor reference for the machine */
  actorRef?: ActorRef<any>;
  /** Display mode for the visualizer */
  mode: 'full' | 'viz' | 'panels';
  /** Active panel in the visualizer */
  panel?: 'state' | 'code' | 'events' | 'actors';
  /** Whether the visualizer is read-only */
  readOnly?: boolean;
  /** Show control buttons (pan, zoom) */
  showControls?: boolean;
  /** Enable panning */
  enablePan?: boolean;
  /** Enable zooming */
  enableZoom?: boolean;
  /** Custom height for the visualizer */
  height?: number;
  /** Custom width for the visualizer */
  width?: number;
}

/**
 * Actor spawning dashboard configuration
 */
export interface ActorSpawningConfig {
  /** Available actor types for spawning */
  availableActorTypes: ActorTypeDefinition[];
  /** Maximum number of concurrent actors */
  maxConcurrentActors?: number;
  /** Auto-cleanup inactive actors */
  autoCleanup?: boolean;
  /** Cleanup threshold in milliseconds */
  cleanupThreshold?: number;
  /** Enable actor performance monitoring */
  enablePerformanceMonitoring?: boolean;
}

/**
 * Actor type definition for spawning
 */
export interface ActorTypeDefinition {
  /** Unique identifier for the actor type */
  id: string;
  /** Display name */
  name: string;
  /** Description of the actor's purpose */
  description: string;
  /** Machine factory function */
  machineFactory: () => any;
  /** Initial context for the actor */
  initialContext?: Record<string, any>;
  /** Actor category */
  category: 'macro' | 'analysis' | 'monitoring' | 'utility';
  /** Required permissions */
  permissions?: string[];
  /** Icon for the actor type */
  icon?: ReactNode;
}

/**
 * Active actor instance information
 */
export interface ActorInstance {
  /** Unique instance ID */
  id: string;
  /** Actor type ID */
  typeId: string;
  /** Display name for the instance */
  name: string;
  /** Actor reference */
  actorRef: ActorRef<any>;
  /** Creation timestamp */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivity: Date;
  /** Current state */
  currentState: string;
  /** Performance metrics */
  metrics?: PerformanceMetrics;
  /** Instance status */
  status: 'active' | 'idle' | 'error' | 'terminated';
  /** Error information if status is 'error' */
  error?: Error;
}

// =============================================================================
// Performance Dashboard Types
// =============================================================================

/**
 * Performance dashboard configuration
 */
export interface PerformanceDashboardConfig {
  /** Refresh interval in milliseconds */
  refreshInterval: number;
  /** Maximum data points to display */
  maxDataPoints: number;
  /** Chart types to display */
  chartTypes: PerformanceChartType[];
  /** Alert thresholds */
  alertThresholds: AlertThreshold[];
  /** Auto-resize charts */
  autoResize?: boolean;
  /** Enable real-time updates */
  realTimeUpdates?: boolean;
}

/**
 * Performance chart types
 */
export type PerformanceChartType = 
  | 'execution-time'
  | 'memory-usage'
  | 'event-frequency'
  | 'state-transitions'
  | 'error-rate'
  | 'throughput';

/**
 * Alert threshold configuration
 */
export interface AlertThreshold {
  /** Metric to monitor */
  metric: PerformanceChartType;
  /** Threshold value */
  threshold: number;
  /** Comparison operator */
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  /** Alert severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Alert message template */
  messageTemplate: string;
  /** Enable notifications */
  enableNotifications?: boolean;
}

/**
 * Chart data point for performance metrics
 */
export interface ChartDataPoint {
  /** Timestamp */
  timestamp: Date;
  /** Metric value */
  value: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Data point label */
  label?: string;
}

/**
 * Performance alert instance
 */
export interface PerformanceAlert {
  /** Alert ID */
  id: string;
  /** Alert threshold that triggered */
  threshold: AlertThreshold;
  /** Current value that triggered the alert */
  currentValue: number;
  /** Timestamp when alert was triggered */
  triggeredAt: Date;
  /** Alert status */
  status: 'active' | 'acknowledged' | 'resolved';
  /** Additional context */
  context?: Record<string, any>;
}

// =============================================================================
// Drag-and-Drop Workflow Types
// =============================================================================

/**
 * Workflow builder configuration
 */
export interface WorkflowBuilderConfig {
  /** Available workflow components */
  availableComponents: WorkflowComponentType[];
  /** Canvas dimensions */
  canvasDimensions: { width: number; height: number };
  /** Grid settings */
  gridSettings: GridSettings;
  /** Snap to grid */
  snapToGrid?: boolean;
  /** Enable component validation */
  enableValidation?: boolean;
  /** Auto-save interval */
  autoSaveInterval?: number;
}

/**
 * Workflow component type definition
 */
export interface WorkflowComponentType {
  /** Component type ID */
  id: string;
  /** Display name */
  name: string;
  /** Component category */
  category: 'input' | 'processing' | 'output' | 'control' | 'macro';
  /** Component icon */
  icon: ReactNode;
  /** Input ports */
  inputPorts: WorkflowPort[];
  /** Output ports */
  outputPorts: WorkflowPort[];
  /** Configurable properties */
  properties: WorkflowProperty[];
  /** Component implementation */
  component: ComponentType<any>;
}

/**
 * Workflow port definition
 */
export interface WorkflowPort {
  /** Port ID */
  id: string;
  /** Port name */
  name: string;
  /** Data type */
  dataType: string;
  /** Whether port is required */
  required?: boolean;
  /** Port description */
  description?: string;
}

/**
 * Workflow property definition
 */
export interface WorkflowProperty {
  /** Property key */
  key: string;
  /** Property name */
  name: string;
  /** Property type */
  type: 'string' | 'number' | 'boolean' | 'select' | 'json';
  /** Default value */
  defaultValue?: any;
  /** Available options (for select type) */
  options?: { label: string; value: any }[];
  /** Validation rules */
  validation?: PropertyValidation;
}

/**
 * Property validation rules
 */
export interface PropertyValidation {
  /** Required property */
  required?: boolean;
  /** Minimum value (for numbers) */
  min?: number;
  /** Maximum value (for numbers) */
  max?: number;
  /** Pattern (for strings) */
  pattern?: string;
  /** Custom validation function */
  customValidator?: (value: any) => boolean | string;
}

/**
 * Workflow instance
 */
export interface WorkflowInstance {
  /** Workflow ID */
  id: string;
  /** Workflow name */
  name: string;
  /** Workflow components */
  components: WorkflowComponentInstance[];
  /** Connections between components */
  connections: WorkflowConnection[];
  /** Workflow metadata */
  metadata: WorkflowMetadata;
  /** Execution status */
  status: 'draft' | 'ready' | 'running' | 'completed' | 'error';
}

/**
 * Workflow component instance
 */
export interface WorkflowComponentInstance {
  /** Instance ID */
  id: string;
  /** Component type ID */
  typeId: string;
  /** Instance name */
  name: string;
  /** Position on canvas */
  position: { x: number; y: number };
  /** Component properties */
  properties: Record<string, any>;
  /** Execution status */
  status: 'idle' | 'running' | 'completed' | 'error';
}

/**
 * Workflow connection
 */
export interface WorkflowConnection {
  /** Connection ID */
  id: string;
  /** Source component ID */
  sourceComponentId: string;
  /** Source port ID */
  sourcePortId: string;
  /** Target component ID */
  targetComponentId: string;
  /** Target port ID */
  targetPortId: string;
  /** Connection metadata */
  metadata?: Record<string, any>;
}

/**
 * Workflow metadata
 */
export interface WorkflowMetadata {
  /** Creation timestamp */
  createdAt: Date;
  /** Last modified timestamp */
  modifiedAt: Date;
  /** Workflow version */
  version: string;
  /** Tags */
  tags: string[];
  /** Description */
  description?: string;
  /** Author */
  author?: string;
}

/**
 * Grid settings for workflow canvas
 */
export interface GridSettings {
  /** Grid size */
  size: number;
  /** Grid visibility */
  visible: boolean;
  /** Grid color */
  color: string;
  /** Grid opacity */
  opacity: number;
}

// =============================================================================
// Multi-Ticker Coordination Types
// =============================================================================

/**
 * Multi-ticker coordination configuration
 */
export interface MultiTickerCoordinationConfig {
  /** Enabled tickers */
  enabledTickers: TickerConfig[];
  /** Synchronization settings */
  synchronization: SynchronizationSettings;
  /** Coordination mode */
  mode: 'independent' | 'synchronized' | 'master-slave';
  /** Update frequency */
  updateFrequency: number;
  /** Enable cross-ticker analysis */
  enableCrossAnalysis?: boolean;
}

/**
 * Ticker configuration
 */
export interface TickerConfig {
  /** Ticker symbol */
  symbol: string;
  /** Display name */
  name: string;
  /** Ticker status */
  status: 'active' | 'inactive' | 'error';
  /** Context reference */
  contextRef: NvdaAnalysisState | SpyAnalysisState;
  /** Last update timestamp */
  lastUpdate: Date;
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
  /** Color for UI identification */
  color: string;
}

/**
 * Synchronization settings
 */
export interface SynchronizationSettings {
  /** Synchronize data fetching */
  syncDataFetching: boolean;
  /** Synchronize AI analysis */
  syncAiAnalysis: boolean;
  /** Synchronize UI updates */
  syncUiUpdates: boolean;
  /** Batch operations */
  batchOperations: boolean;
  /** Conflict resolution strategy */
  conflictResolution: 'first-wins' | 'last-wins' | 'merge' | 'user-prompt';
}

/**
 * Coordination status
 */
export interface CoordinationStatus {
  /** Overall status */
  status: 'idle' | 'coordinating' | 'synchronized' | 'conflict' | 'error';
  /** Active operations */
  activeOperations: string[];
  /** Last synchronization timestamp */
  lastSync: Date;
  /** Pending conflicts */
  pendingConflicts: Conflict[];
  /** Performance metrics */
  metrics: CoordinationMetrics;
}

/**
 * Coordination conflict
 */
export interface Conflict {
  /** Conflict ID */
  id: string;
  /** Affected tickers */
  affectedTickers: string[];
  /** Conflict type */
  type: 'data-mismatch' | 'state-conflict' | 'timing-conflict';
  /** Conflict description */
  description: string;
  /** Resolution options */
  resolutionOptions: ConflictResolutionOption[];
  /** Timestamp */
  timestamp: Date;
}

/**
 * Conflict resolution option
 */
export interface ConflictResolutionOption {
  /** Option ID */
  id: string;
  /** Option name */
  name: string;
  /** Option description */
  description: string;
  /** Resolution action */
  action: () => void;
}

/**
 * Coordination metrics
 */
export interface CoordinationMetrics {
  /** Synchronization success rate */
  syncSuccessRate: number;
  /** Average synchronization time */
  avgSyncTime: number;
  /** Total operations coordinated */
  totalOperations: number;
  /** Active conflicts count */
  activeConflictsCount: number;
  /** Last 24h operations */
  last24hOperations: number;
}

// =============================================================================
// Advanced Interaction Types
// =============================================================================

/**
 * Advanced filter configuration
 */
export interface AdvancedFilterConfig {
  /** Available filter types */
  filterTypes: FilterType[];
  /** Enable search functionality */
  enableSearch: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;
  /** Custom keyboard shortcuts */
  keyboardShortcuts?: KeyboardShortcut[];
  /** Enable filter persistence */
  persistFilters?: boolean;
}

/**
 * Filter type definition
 */
export interface FilterType {
  /** Filter ID */
  id: string;
  /** Filter name */
  name: string;
  /** Filter type */
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'range';
  /** Filter options (for select type) */
  options?: FilterOption[];
  /** Validation rules */
  validation?: PropertyValidation;
  /** Default value */
  defaultValue?: any;
}

/**
 * Filter option
 */
export interface FilterOption {
  /** Option value */
  value: any;
  /** Option label */
  label: string;
  /** Option description */
  description?: string;
  /** Option icon */
  icon?: ReactNode;
}

/**
 * Applied filter
 */
export interface AppliedFilter {
  /** Filter ID */
  filterId: string;
  /** Filter value */
  value: any;
  /** Filter operator */
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
  /** Additional value (for range filters) */
  additionalValue?: any;
}

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Shortcut ID */
  id: string;
  /** Key combination */
  keys: string[];
  /** Shortcut description */
  description: string;
  /** Action to execute */
  action: () => void;
  /** Shortcut category */
  category: 'navigation' | 'editing' | 'view' | 'analysis';
  /** Whether shortcut is global */
  global?: boolean;
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  /** Enable screen reader support */
  enableScreenReader: boolean;
  /** Enable keyboard navigation */
  enableKeyboardNavigation: boolean;
  /** Enable high contrast mode */
  enableHighContrast?: boolean;
  /** Focus management */
  focusManagement: FocusManagementConfig;
  /** ARIA labels */
  ariaLabels: Record<string, string>;
}

/**
 * Focus management configuration
 */
export interface FocusManagementConfig {
  /** Auto-focus on component mount */
  autoFocus: boolean;
  /** Focus trap for modals */
  focusTrap: boolean;
  /** Focus restoration */
  restoreFocus: boolean;
  /** Skip links */
  skipLinks: SkipLink[];
}

/**
 * Skip link definition
 */
export interface SkipLink {
  /** Link ID */
  id: string;
  /** Link text */
  text: string;
  /** Target element selector */
  target: string;
}

// =============================================================================
// Common Component Props
// =============================================================================

/**
 * Base props for all advanced UI components
 */
export interface BaseAdvancedUIProps {
  /** Component ID */
  id?: string;
  /** Component class name */
  className?: string;
  /** Accessibility configuration */
  accessibility?: AccessibilityConfig;
  /** Error handling */
  onError?: (error: Error) => void;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Theme configuration for UI components
 */
export interface UIThemeConfig {
  /** Color scheme */
  colorScheme: 'light' | 'dark' | 'auto';
  /** Primary color */
  primaryColor: string;
  /** Secondary color */
  secondaryColor: string;
  /** Accent colors */
  accentColors: string[];
  /** Typography settings */
  typography: TypographyConfig;
  /** Spacing settings */
  spacing: SpacingConfig;
}

/**
 * Typography configuration
 */
export interface TypographyConfig {
  /** Font family */
  fontFamily: string;
  /** Font sizes */
  fontSizes: Record<string, string>;
  /** Font weights */
  fontWeights: Record<string, number>;
  /** Line heights */
  lineHeights: Record<string, number>;
}

/**
 * Spacing configuration
 */
export interface SpacingConfig {
  /** Base spacing unit */
  baseUnit: number;
  /** Spacing scale */
  scale: number[];
}

// =============================================================================
// Export Types
// =============================================================================

/**
 * Complete UI types export
 */
export type AdvancedUITypes = {
  // XState Integration
  StateMachineVisualizerConfig: StateMachineVisualizerConfig;
  ActorSpawningConfig: ActorSpawningConfig;
  ActorTypeDefinition: ActorTypeDefinition;
  ActorInstance: ActorInstance;
  
  // Performance Dashboard
  PerformanceDashboardConfig: PerformanceDashboardConfig;
  PerformanceChartType: PerformanceChartType;
  AlertThreshold: AlertThreshold;
  ChartDataPoint: ChartDataPoint;
  PerformanceAlert: PerformanceAlert;
  
  // Workflow Builder
  WorkflowBuilderConfig: WorkflowBuilderConfig;
  WorkflowComponentType: WorkflowComponentType;
  WorkflowInstance: WorkflowInstance;
  WorkflowComponentInstance: WorkflowComponentInstance;
  WorkflowConnection: WorkflowConnection;
  
  // Multi-Ticker Coordination
  MultiTickerCoordinationConfig: MultiTickerCoordinationConfig;
  TickerConfig: TickerConfig;
  CoordinationStatus: CoordinationStatus;
  Conflict: Conflict;
  
  // Advanced Interactions
  AdvancedFilterConfig: AdvancedFilterConfig;
  FilterType: FilterType;
  AppliedFilter: AppliedFilter;
  KeyboardShortcut: KeyboardShortcut;
  AccessibilityConfig: AccessibilityConfig;
  
  // Common
  BaseAdvancedUIProps: BaseAdvancedUIProps;
  UIThemeConfig: UIThemeConfig;
};