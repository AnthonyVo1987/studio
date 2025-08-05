/**
 * @fileOverview Advanced XState Inspector Integration
 * 
 * Enhanced XState inspector integration with real-time state visualization,
 * transition logging, and comprehensive debugging capabilities.
 * Builds upon existing dev-tools/xstate-inspector.ts with advanced features.
 */

import { createActor, type ActorRef, type StateFrom, type EventFrom } from 'xstate';
import type { 
  InspectorConfiguration, 
  InspectorAdapter, 
  InspectorEvent, 
  InspectorMetadata,
  MachineSnapshot,
  StateTransition,
  DebugConfiguration
} from './debugging-types';
import type { MacroExecutionContext, MacroExecutionEvent } from '../types/macro-types';
import { createTickerLogger, generateExecutionId } from '../../ticker-logger';

// ================================
// ENHANCED INSPECTOR CONFIGURATION
// ================================

export const ADVANCED_INSPECTOR_CONFIG: InspectorConfiguration = {
  enabled: process.env.NODE_ENV === 'development',
  url: 'https://stately.ai/viz?inspect',
  autoStart: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 3,
  enableRemoteInspection: false
};

// ================================
// INSPECTOR CONNECTION MANAGER
// ================================

export class InspectorConnectionManager {
  private config: InspectorConfiguration;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private adapter?: InspectorAdapter;
  private logger = createTickerLogger('SYSTEM', 'Inspector', generateExecutionId('inspector'));

  constructor(config: Partial<InspectorConfiguration> = {}) {
    this.config = { ...ADVANCED_INSPECTOR_CONFIG, ...config };
  }

  async connect(): Promise<boolean> {
    if (!this.config.enabled || this.isConnected) {
      return this.isConnected;
    }

    try {
      this.logger.info('Connect', 'Attempting to connect to XState inspector', {
        url: this.config.url,
        autoStart: this.config.autoStart
      });

      if (this.config.customInspectorAdapter) {
        this.adapter = this.config.customInspectorAdapter;
        await this.adapter.connect(this.config);
      } else {
        // Use built-in XState inspector
        await this.connectToBuiltInInspector();
      }

      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      this.logger.info('Connect', 'Successfully connected to XState inspector');
      return true;
    } catch (error) {
      this.logger.error('Connect', 'Failed to connect to XState inspector', error);
      this.scheduleReconnect();
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      if (this.adapter) {
        await this.adapter.disconnect();
      }
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }

      this.isConnected = false;
      this.logger.info('Disconnect', 'Disconnected from XState inspector');
    } catch (error) {
      this.logger.error('Disconnect', 'Error during inspector disconnection', error);
    }
  }

  private async connectToBuiltInInspector(): Promise<void> {
    // In a real implementation, this would integrate with @xstate/inspector
    // For now, we simulate the connection
    if (typeof window !== 'undefined' && this.config.url) {
      // Browser environment - open inspector window
      const inspectorWindow = window.open(this.config.url, '_blank');
      if (inspectorWindow) {
        this.setupMessageChannel(inspectorWindow);
      }
    }
  }

  private setupMessageChannel(inspectorWindow: Window): void {
    const channel = new MessageChannel();
    
    channel.port1.onmessage = (event) => {
      this.handleInspectorMessage(event.data);
    };

    // Send port to inspector window
    inspectorWindow.postMessage({ type: 'XSTATE_INIT', port: channel.port2 }, '*', [channel.port2]);
  }

  private handleInspectorMessage(message: any): void {
    this.logger.debug('Message', 'Received message from inspector', { message });
    
    switch (message.type) {
      case 'INSPECTOR_READY':
        this.isConnected = true;
        break;
      case 'INSPECTOR_DISCONNECTED':
        this.isConnected = false;
        this.scheduleReconnect();
        break;
      default:
        // Handle other inspector messages
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.logger.warn('Reconnect', 'Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    this.logger.info('Reconnect', `Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  sendEvent(event: InspectorEvent): void {
    if (!this.isConnected || !this.adapter) return;

    try {
      this.adapter.sendEvent(event);
    } catch (error) {
      this.logger.error('SendEvent', 'Failed to send event to inspector', { event, error });
    }
  }

  sendSnapshot(snapshot: MachineSnapshot): void {
    if (!this.isConnected || !this.adapter) return;

    try {
      this.adapter.sendSnapshot(snapshot);
    } catch (error) {
      this.logger.error('SendSnapshot', 'Failed to send snapshot to inspector', { snapshot, error });
    }
  }

  sendTransition(transition: StateTransition): void {
    if (!this.isConnected || !this.adapter) return;

    try {
      this.adapter.sendTransition(transition);
    } catch (error) {
      this.logger.error('SendTransition', 'Failed to send transition to inspector', { transition, error });
    }
  }

  getConnectionStatus(): { connected: boolean; attempts: number; config: InspectorConfiguration } {
    return {
      connected: this.isConnected,
      attempts: this.reconnectAttempts,
      config: this.config
    };
  }
}

// ================================
// REAL-TIME STATE VISUALIZER
// ================================

export class RealTimeStateVisualizer {
  private connectionManager: InspectorConnectionManager;
  private logger = createTickerLogger('SYSTEM', 'Visualizer', generateExecutionId('visualizer'));
  private activeSnapshots = new Map<string, MachineSnapshot>();
  private transitionHistory: StateTransition[] = [];
  private maxHistorySize: number = 1000;

  constructor(connectionManager: InspectorConnectionManager) {
    this.connectionManager = connectionManager;
  }

  visualizeMachine(machineId: string, actor: ActorRef<any, any>, metadata?: InspectorMetadata): void {
    this.logger.info('VisualizeMachine', `Starting visualization for machine: ${machineId}`, { metadata });

    // Subscribe to state changes
    actor.subscribe({
      next: (state) => {
        this.handleStateChange(machineId, state, metadata);
      },
      error: (error) => {
        this.handleMachineError(machineId, error, metadata);
      },
      complete: () => {
        this.handleMachineComplete(machineId, metadata);
      }
    });

    // Send initial snapshot
    const initialSnapshot = this.createSnapshot(machineId, actor.getSnapshot(), metadata);
    this.activeSnapshots.set(machineId, initialSnapshot);
    this.connectionManager.sendSnapshot(initialSnapshot);
  }

  private handleStateChange(machineId: string, state: any, metadata?: InspectorMetadata): void {
    const snapshot = this.createSnapshot(machineId, state, metadata);
    const previousSnapshot = this.activeSnapshots.get(machineId);

    // Create transition record
    if (previousSnapshot) {
      const transition = this.createTransition(previousSnapshot, snapshot, metadata);
      this.transitionHistory.push(transition);
      this.connectionManager.sendTransition(transition);

      // Trim history if needed
      if (this.transitionHistory.length > this.maxHistorySize) {
        this.transitionHistory = this.transitionHistory.slice(-this.maxHistorySize);
      }
    }

    // Update current snapshot
    this.activeSnapshots.set(machineId, snapshot);
    this.connectionManager.sendSnapshot(snapshot);

    this.logger.debug('StateChange', `State changed for machine: ${machineId}`, {
      from: previousSnapshot?.state,
      to: snapshot.state,
      event: state.event?.type
    });
  }

  private handleMachineError(machineId: string, error: Error, metadata?: InspectorMetadata): void {
    this.logger.error('MachineError', `Error in machine: ${machineId}`, { error, metadata });

    const errorEvent: InspectorEvent = {
      id: generateExecutionId('error'),
      timestamp: Date.now(),
      machineId,
      type: 'error',
      data: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      },
      metadata
    };

    this.connectionManager.sendEvent(errorEvent);
  }

  private handleMachineComplete(machineId: string, metadata?: InspectorMetadata): void {
    this.logger.info('MachineComplete', `Machine completed: ${machineId}`, { metadata });

    // Clean up
    this.activeSnapshots.delete(machineId);

    const completeEvent: InspectorEvent = {
      id: generateExecutionId('complete'),
      timestamp: Date.now(),
      machineId,
      type: 'snapshot',
      data: { status: 'completed' },
      metadata
    };

    this.connectionManager.sendEvent(completeEvent);
  }

  private createSnapshot(machineId: string, state: any, metadata?: InspectorMetadata): MachineSnapshot {
    return {
      id: generateExecutionId('snapshot'),
      timestamp: Date.now(),
      machineId,
      state: typeof state.value === 'object' ? state.value : String(state.value),
      context: state.context,
      event: state.event,
      metadata: {
        ticker: metadata?.ticker,
        executionId: metadata?.executionId,
        stepId: metadata?.stepId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        sessionId: metadata?.sessionId || generateExecutionId('session'),
        sequenceNumber: this.getNextSequenceNumber(machineId),
        parentSnapshot: undefined,
        childSnapshots: []
      },
      performance: {
        captureTime: performance.now(),
        serializationTime: 0, // Would be calculated in real implementation
        memoryFootprint: this.estimateMemoryFootprint(state),
        contextSize: JSON.stringify(state.context).length,
        machineUptime: Date.now() - (state._startTime || Date.now())
      },
      relationships: {
        parentMachine: undefined,
        childMachines: [],
        spawningMachines: [],
        communicatingMachines: []
      }
    };
  }

  private createTransition(
    fromSnapshot: MachineSnapshot, 
    toSnapshot: MachineSnapshot, 
    metadata?: InspectorMetadata
  ): StateTransition {
    return {
      id: generateExecutionId('transition'),
      timestamp: Date.now(),
      machineId: fromSnapshot.machineId,
      from: fromSnapshot.state,
      to: toSnapshot.state,
      event: toSnapshot.event,
      actions: [], // Would be populated from machine definition
      guards: [], // Would be populated from machine definition
      duration: toSnapshot.timestamp - fromSnapshot.timestamp,
      success: true,
      context: {
        ticker: metadata?.ticker,
        executionId: metadata?.executionId,
        stepId: metadata?.stepId,
        previousContext: fromSnapshot.context,
        nextContext: toSnapshot.context,
        contextDiff: this.calculateContextDiff(fromSnapshot.context, toSnapshot.context)
      }
    };
  }

  private calculateContextDiff(previousContext: any, nextContext: any): any {
    const diff = {
      added: {},
      modified: {},
      removed: {}
    };

    // Simple diff implementation - in production, use a proper diff library
    const prevKeys = Object.keys(previousContext || {});
    const nextKeys = Object.keys(nextContext || {});

    // Find added keys
    nextKeys.forEach(key => {
      if (!(key in (previousContext || {}))) {
        (diff.added as any)[key] = nextContext[key];
      } else if (previousContext[key] !== nextContext[key]) {
        (diff.modified as any)[key] = {
          from: previousContext[key],
          to: nextContext[key]
        };
      }
    });

    // Find removed keys
    prevKeys.forEach(key => {
      if (!(key in (nextContext || {}))) {
        (diff.removed as any)[key] = previousContext[key];
      }
    });

    return diff;
  }

  private getNextSequenceNumber(machineId: string): number {
    const currentSnapshot = this.activeSnapshots.get(machineId);
    return currentSnapshot ? currentSnapshot.metadata.sequenceNumber + 1 : 1;
  }

  private estimateMemoryFootprint(state: any): number {
    // Simple estimation - in production, use more sophisticated memory analysis
    try {
      return JSON.stringify(state).length * 2; // Rough estimate
    } catch {
      return 0;
    }
  }

  getActiveSnapshots(): Map<string, MachineSnapshot> {
    return new Map(this.activeSnapshots);
  }

  getTransitionHistory(machineId?: string): StateTransition[] {
    if (machineId) {
      return this.transitionHistory.filter(t => t.machineId === machineId);
    }
    return [...this.transitionHistory];
  }

  clearHistory(machineId?: string): void {
    if (machineId) {
      this.transitionHistory = this.transitionHistory.filter(t => t.machineId !== machineId);
    } else {
      this.transitionHistory = [];
    }
  }

  exportVisualizationData(machineId?: string): string {
    const snapshots = machineId 
      ? [this.activeSnapshots.get(machineId)].filter(Boolean)
      : Array.from(this.activeSnapshots.values());
    
    const transitions = this.getTransitionHistory(machineId);

    return JSON.stringify({
      exportTime: new Date().toISOString(),
      machineId,
      snapshots,
      transitions,
      summary: {
        snapshotCount: snapshots.length,
        transitionCount: transitions.length,
        timeRange: transitions.length > 0 ? {
          start: Math.min(...transitions.map(t => t.timestamp)),
          end: Math.max(...transitions.map(t => t.timestamp))
        } : null
      }
    }, null, 2);
  }
}

// ================================
// MACHINE DIFF UTILITIES
// ================================

export class MachineSnapshotComparator {
  private logger = createTickerLogger('SYSTEM', 'Comparator', generateExecutionId('comparator'));

  compareSnapshots(snapshotA: MachineSnapshot, snapshotB: MachineSnapshot): SnapshotComparison {
    this.logger.debug('CompareSnapshots', 'Comparing machine snapshots', {
      snapshotA: snapshotA.id,
      snapshotB: snapshotB.id
    });

    return {
      id: generateExecutionId('comparison'),
      timestamp: Date.now(),
      snapshotA: snapshotA.id,
      snapshotB: snapshotB.id,
      stateDiff: this.compareStates(snapshotA.state, snapshotB.state),
      contextDiff: this.calculateContextDiff(snapshotA.context, snapshotB.context),
      performanceDiff: this.comparePerformance(snapshotA.performance, snapshotB.performance),
      timeDiff: snapshotB.timestamp - snapshotA.timestamp,
      similarity: this.calculateSimilarity(snapshotA, snapshotB)
    };
  }

  private compareStates(stateA: any, stateB: any): StateDiff {
    const aStr = typeof stateA === 'object' ? JSON.stringify(stateA) : String(stateA);
    const bStr = typeof stateB === 'object' ? JSON.stringify(stateB) : String(stateB);

    return {
      identical: aStr === bStr,
      changes: aStr !== bStr ? [`State changed from ${aStr} to ${bStr}`] : [],
      complexity: this.calculateStateComplexity(stateA, stateB)
    };
  }

  private comparePerformance(perfA: any, perfB: any): PerformanceDiff {
    return {
      captureTimeDiff: perfB.captureTime - perfA.captureTime,
      memoryFootprintDiff: perfB.memoryFootprint - perfA.memoryFootprint,
      contextSizeDiff: perfB.contextSize - perfA.contextSize,
      uptimeDiff: perfB.machineUptime - perfA.machineUptime
    };
  }

  private calculateSimilarity(snapshotA: MachineSnapshot, snapshotB: MachineSnapshot): number {
    let similarityScore = 0;
    let totalFactors = 0;

    // State similarity
    if (JSON.stringify(snapshotA.state) === JSON.stringify(snapshotB.state)) {
      similarityScore += 0.4;
    }
    totalFactors += 0.4;

    // Context similarity (simplified)
    const contextSimilarity = this.calculateObjectSimilarity(snapshotA.context, snapshotB.context);
    similarityScore += contextSimilarity * 0.6;
    totalFactors += 0.6;

    return totalFactors > 0 ? similarityScore / totalFactors : 0;
  }

  private calculateObjectSimilarity(objA: any, objB: any): number {
    if (objA === objB) return 1;
    if (!objA || !objB) return 0;

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    const allKeys = new Set([...keysA, ...keysB]);

    let matches = 0;
    for (const key of allKeys) {
      if (objA[key] === objB[key]) {
        matches++;
      }
    }

    return allKeys.size > 0 ? matches / allKeys.size : 0;
  }

  private calculateStateComplexity(stateA: any, stateB: any): number {
    const aComplexity = typeof stateA === 'object' ? Object.keys(stateA).length : 1;
    const bComplexity = typeof stateB === 'object' ? Object.keys(stateB).length : 1;
    return Math.max(aComplexity, bComplexity);
  }

  private calculateContextDiff(contextA: any, contextB: any): any {
    // Reuse the diff calculation from visualizer
    const diff = {
      added: {},
      modified: {},
      removed: {}
    };

    const keysA = Object.keys(contextA || {});
    const keysB = Object.keys(contextB || {});

    keysB.forEach(key => {
      if (!(key in (contextA || {}))) {
        (diff.added as any)[key] = contextB[key];
      } else if (contextA[key] !== contextB[key]) {
        (diff.modified as any)[key] = {
          from: contextA[key],
          to: contextB[key]
        };
      }
    });

    keysA.forEach(key => {
      if (!(key in (contextB || {}))) {
        (diff.removed as any)[key] = contextA[key];
      }
    });

    return diff;
  }
}

// ================================
// SUPPORTING TYPES
// ================================

export interface SnapshotComparison {
  id: string;
  timestamp: number;
  snapshotA: string;
  snapshotB: string;
  stateDiff: StateDiff;
  contextDiff: any;
  performanceDiff: PerformanceDiff;
  timeDiff: number;
  similarity: number;
}

export interface StateDiff {
  identical: boolean;
  changes: string[];
  complexity: number;
}

export interface PerformanceDiff {
  captureTimeDiff: number;
  memoryFootprintDiff: number;
  contextSizeDiff: number;
  uptimeDiff: number;
}

// ================================
// GLOBAL INSTANCES AND UTILITIES
// ================================

export const globalInspectorManager = new InspectorConnectionManager();
export const globalStateVisualizer = new RealTimeStateVisualizer(globalInspectorManager);
export const globalSnapshotComparator = new MachineSnapshotComparator();

/**
 * Enhanced machine creation with automatic inspector integration
 */
export const createInspectedMachine = (machine: any, config: Partial<InspectorConfiguration> = {}) => {
  if (process.env.NODE_ENV !== 'development') {
    return machine;
  }

  const inspectorConfig = { ...ADVANCED_INSPECTOR_CONFIG, ...config };
  
  if (!inspectorConfig.enabled) {
    return machine;
  }

  // Provide inspection configuration to XState v5 machine
  return machine.provide({
    inspect: {
      url: inspectorConfig.url,
      autoStart: inspectorConfig.autoStart
    }
  });
};

/**
 * Create actor with full debugging integration
 */
export const createDebugActor = (
  machine: any, 
  options: {
    inspectorConfig?: Partial<InspectorConfiguration>;
    metadata?: InspectorMetadata;
    enableVisualization?: boolean;
  } = {}
) => {
  const { inspectorConfig = {}, metadata, enableVisualization = true } = options;
  
  const inspectedMachine = createInspectedMachine(machine, inspectorConfig);
  const actor = createActor(inspectedMachine);
  
  if (enableVisualization && process.env.NODE_ENV === 'development') {
    const machineId = metadata?.executionId || generateExecutionId('machine');
    globalStateVisualizer.visualizeMachine(machineId, actor, metadata);
  }
  
  return {
    actor,
    machineId: metadata?.executionId || generateExecutionId('machine'),
    visualizer: globalStateVisualizer,
    comparator: globalSnapshotComparator
  };
};

/**
 * Initialize inspector for development environment
 */
export const initializeInspector = async (config: Partial<InspectorConfiguration> = {}) => {
  if (process.env.NODE_ENV !== 'development') return false;
  
  return await globalInspectorManager.connect();
};

/**
 * Cleanup inspector resources
 */
export const cleanupInspector = async () => {
  await globalInspectorManager.disconnect();
  globalStateVisualizer.clearHistory();
};

// ================================
// EXPORTS
// ================================

// Type interfaces are now exported inline above