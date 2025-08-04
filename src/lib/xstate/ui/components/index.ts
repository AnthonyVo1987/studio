/**
 * @fileOverview UI Components Index - Advanced XState UI Components Export
 * 
 * Centralized export for all advanced UI components in the XState integration system.
 * Provides comprehensive components for state visualization, performance monitoring,
 * workflow building, and advanced interactions.
 * 
 * @created 2024-08-04
 * @version 1.0.0
 */

// State Machine Visualizer
export { StateMachineVisualizer } from './state-machine-visualizer';
export { default as StateMachineVisualizerDefault } from './state-machine-visualizer';

// Actor Spawning Dashboard
export { ActorSpawningDashboard } from './actor-spawning-dashboard';
export { default as ActorSpawningDashboardDefault } from './actor-spawning-dashboard';

// Performance Dashboard
export { PerformanceDashboard } from './performance-dashboard';
export { default as PerformanceDashboardDefault } from './performance-dashboard';

// Workflow Builder
export { WorkflowBuilder } from './workflow-builder';
export { default as WorkflowBuilderDefault } from './workflow-builder';

// Multi-Ticker Coordinator
export { MultiTickerCoordinator } from './multi-ticker-coordinator';
export { default as MultiTickerCoordinatorDefault } from './multi-ticker-coordinator';

// Advanced Filters
export { AdvancedFilters } from './advanced-filters';
export { default as AdvancedFiltersDefault } from './advanced-filters';

// Re-export all components as a collection
export const AdvancedUIComponents = {
  StateMachineVisualizer,
  ActorSpawningDashboard,
  PerformanceDashboard,
  WorkflowBuilder,
  MultiTickerCoordinator,
  AdvancedFilters
};