/**
 * @fileOverview Advanced XState UI System - Main Export
 * 
 * Complete advanced UI component system for XState integration with StockSage.
 * Provides state visualization, performance monitoring, workflow building,
 * and advanced interaction patterns.
 * 
 * Features:
 * - XState Integration Components (state visualizer, actor management)
 * - Performance Dashboard with real-time monitoring
 * - Drag-and-drop workflow builder
 * - Multi-ticker coordination interface
 * - Advanced filtering and search capabilities
 * - Comprehensive accessibility support
 * 
 * @created 2024-08-04
 * @version 1.0.0
 */

// === COMPONENTS ===
export * from './components';

// === HOOKS ===
export * from './hooks';

// === TYPES ===
export * from './types/ui-types';

// === MAIN SYSTEM EXPORT ===
export { AdvancedUIComponents } from './components';

// === DEFAULT SYSTEM CONFIGURATION ===
import type {
  StateMachineVisualizerConfig,
  ActorSpawningConfig,
  PerformanceDashboardConfig,
  WorkflowBuilderConfig,
  MultiTickerCoordinationConfig,
  AdvancedFilterConfig,
  UIThemeConfig
} from './types/ui-types';

/**
 * Default configuration for the complete advanced UI system
 */
export const defaultAdvancedUIConfig = {
  /**
   * State Machine Visualizer Configuration
   */
  stateMachineVisualizer: {
    mode: 'full' as const,
    panel: 'state' as const,
    readOnly: false,
    showControls: true,
    enablePan: true,
    enableZoom: true,
    height: 600,
    width: undefined
  } satisfies Partial<StateMachineVisualizerConfig>,

  /**
   * Actor Spawning Configuration
   */
  actorSpawning: {
    availableActorTypes: [],
    maxConcurrentActors: 10,
    autoCleanup: true,
    cleanupThreshold: 300000, // 5 minutes
    enablePerformanceMonitoring: true
  } satisfies Partial<ActorSpawningConfig>,

  /**
   * Performance Dashboard Configuration
   */
  performanceDashboard: {
    refreshInterval: 1000,
    maxDataPoints: 100,
    chartTypes: [
      'execution-time',
      'memory-usage',
      'event-frequency',
      'state-transitions',
      'error-rate',
      'throughput'
    ] as const,
    alertThresholds: [
      {
        metric: 'execution-time' as const,
        threshold: 1000,
        operator: 'gt' as const,
        severity: 'medium' as const,
        messageTemplate: 'Execution time exceeded {threshold}ms (current: {value}ms)',
        enableNotifications: true
      },
      {
        metric: 'error-rate' as const,
        threshold: 5,
        operator: 'gt' as const,
        severity: 'high' as const,
        messageTemplate: 'Error rate too high: {value}% (threshold: {threshold}%)',
        enableNotifications: true
      }
    ],
    autoResize: true,
    realTimeUpdates: true
  } satisfies Partial<PerformanceDashboardConfig>,

  /**
   * Workflow Builder Configuration
   */
  workflowBuilder: {
    availableComponents: [],
    canvasDimensions: { width: 1200, height: 800 },
    gridSettings: {
      size: 20,
      visible: true,
      color: '#e5e7eb',
      opacity: 0.5
    },
    snapToGrid: true,
    enableValidation: true,
    autoSaveInterval: 30000
  } satisfies Partial<WorkflowBuilderConfig>,

  /**
   * Multi-Ticker Coordination Configuration
   */
  multiTickerCoordination: {
    enabledTickers: [],
    synchronization: {
      syncDataFetching: true,
      syncAiAnalysis: true,
      syncUiUpdates: true,
      batchOperations: true,
      conflictResolution: 'user-prompt' as const
    },
    mode: 'synchronized' as const,
    updateFrequency: 5000,
    enableCrossAnalysis: true
  } satisfies Partial<MultiTickerCoordinationConfig>,

  /**
   * Advanced Filtering Configuration
   */
  advancedFiltering: {
    filterTypes: [],
    enableSearch: true,
    searchPlaceholder: 'Search...',
    enableKeyboardShortcuts: true,
    keyboardShortcuts: [],
    persistFilters: true
  } satisfies Partial<AdvancedFilterConfig>,

  /**
   * UI Theme Configuration
   */
  theme: {
    colorScheme: 'light' as const,
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    accentColors: ['#f59e0b', '#ef4444', '#8b5cf6'],
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSizes: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem'
      },
      fontWeights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeights: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75
      }
    },
    spacing: {
      baseUnit: 4,
      scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96]
    }
  } satisfies UIThemeConfig
};

/**
 * System version information
 */
export const ADVANCED_UI_SYSTEM_VERSION = '1.0.0';

/**
 * System information
 */
export const ADVANCED_UI_SYSTEM_INFO = {
  name: 'StockSage Advanced UI System',
  version: ADVANCED_UI_SYSTEM_VERSION,
  description: 'Advanced UI components for XState integration with React',
  features: [
    'XState machine visualization and debugging',
    'Actor spawning and lifecycle management',
    'Real-time performance monitoring with Recharts',
    'Drag-and-drop workflow builder',
    'Multi-ticker coordination interface',
    'Advanced filtering and search capabilities',
    'Comprehensive accessibility support',
    'Mobile-responsive design',
    'TypeScript type safety',
    'Integration with StockSage contexts'
  ],
  dependencies: {
    react: '^18.0.0',
    '@xstate/react': '^4.0.0',
    '@dnd-kit/core': '^6.0.0',
    'recharts': '^2.0.0',
    'lucide-react': '^0.400.0'
  },
  components: {
    StateMachineVisualizer: 'Interactive XState machine visualization',
    ActorSpawningDashboard: 'Actor lifecycle management interface',
    PerformanceDashboard: 'Real-time performance monitoring',
    WorkflowBuilder: 'Drag-and-drop workflow creation',
    MultiTickerCoordinator: 'Multi-ticker synchronization',
    AdvancedFilters: 'Advanced filtering and search'
  },
  hooks: {
    useXStateMachineIntegration: 'XState machine integration with StockSage',
    useStateMachineVisualizer: 'State machine visualization management',
    useActorSpawning: 'Actor spawning and lifecycle',
    useMultiTickerCoordination: 'Multi-ticker coordination',
    usePerformanceDashboard: 'Performance monitoring dashboard',
    useDragAndDrop: 'Drag-and-drop functionality',
    useAdvancedFiltering: 'Advanced filtering and search',
    useKeyboardShortcuts: 'Keyboard shortcuts management',
    useAccessibility: 'Accessibility features'
  }
} as const;

/**
 * Export system information for development and debugging
 */
export { ADVANCED_UI_SYSTEM_INFO as SystemInfo };

/**
 * Main system validation
 */
export function validateAdvancedUISystem(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required dependencies
  try {
    require('react');
  } catch {
    errors.push('React is required but not found');
  }

  try {
    require('@xstate/react');
  } catch {
    warnings.push('@xstate/react not found - XState integration features will be limited');
  }

  try {
    require('@dnd-kit/core');
  } catch {
    warnings.push('@dnd-kit/core not found - drag-and-drop features will be limited');
  }

  try {
    require('recharts');
  } catch {
    warnings.push('recharts not found - performance charts will be limited');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * System initialization hook
 */
export function useAdvancedUISystem() {
  const validation = validateAdvancedUISystem();
  
  React.useEffect(() => {
    if (!validation.isValid) {
      console.error('Advanced UI System validation failed:', validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('Advanced UI System warnings:', validation.warnings);
    }
  }, [validation]);

  return {
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
    version: ADVANCED_UI_SYSTEM_VERSION,
    systemInfo: ADVANCED_UI_SYSTEM_INFO
  };
}

// Import React for the hook
import * as React from 'react';