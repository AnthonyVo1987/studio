/**
 * @fileOverview Development Tools and Utilities for XState
 * 
 * Comprehensive development utilities including hot reload support,
 * environment detection, debugging shortcuts, and developer commands.
 * Integrates with CLAUDE.md debugging patterns and StockSage development workflow.
 */

import type { ActorRef, StateFrom, EventFrom } from 'xstate';
import type {
  DebugConfiguration,
  TestingConfiguration,
  DeveloperPanelConfiguration,
  StateManipulationCommand,
  MachineSnapshot,
  StateTransition
} from './debugging-types';
import type { MacroExecutionContext, MacroExecutionEvent } from '../types/macro-types';
import { createTickerLogger, generateExecutionId } from '../../ticker-logger';
import { globalAdvancedLogger } from './advanced-logger';

// ================================
// ENVIRONMENT DETECTION
// ================================

export interface EnvironmentInfo {
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  isBrowser: boolean;
  isNode: boolean;
  buildVersion?: string;
  reactVersion?: string;
  xstateVersion?: string;
  userAgent?: string;
  supportedFeatures: string[];
}

export class EnvironmentDetector {
  private static info: EnvironmentInfo | null = null;

  static detect(): EnvironmentInfo {
    if (this.info) return this.info;

    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';
    const isBrowser = typeof window !== 'undefined';
    const isNode = typeof process !== 'undefined';

    const supportedFeatures: string[] = [];

    // Feature detection
    if (typeof PerformanceObserver !== 'undefined') supportedFeatures.push('performance-observer');
    if (typeof MessageChannel !== 'undefined') supportedFeatures.push('message-channel');
    if (typeof WebSocket !== 'undefined') supportedFeatures.push('websocket');
    if (typeof localStorage !== 'undefined') supportedFeatures.push('local-storage');
    if (typeof sessionStorage !== 'undefined') supportedFeatures.push('session-storage');
    if (typeof BroadcastChannel !== 'undefined') supportedFeatures.push('broadcast-channel');
    if (typeof SharedWorker !== 'undefined') supportedFeatures.push('shared-worker');
    if (typeof ServiceWorker !== 'undefined') supportedFeatures.push('service-worker');
    
    // Node.js features
    if (isNode) {
      if (process.memoryUsage) supportedFeatures.push('memory-usage');
      if (process.cpuUsage) supportedFeatures.push('cpu-usage');
      if (process.hrtime) supportedFeatures.push('high-resolution-time');
    }

    // Browser features
    if (isBrowser) {
      if (performance.mark) supportedFeatures.push('performance-mark');
      if (performance.measure) supportedFeatures.push('performance-measure');
      if (navigator.serviceWorker) supportedFeatures.push('service-worker-registration');
    }

    this.info = {
      isDevelopment,
      isProduction,
      isTest,
      isBrowser,
      isNode,
      buildVersion: process.env.BUILD_VERSION,
      reactVersion: this.getPackageVersion('react'),
      xstateVersion: this.getPackageVersion('xstate'),
      userAgent: isBrowser ? navigator.userAgent : undefined,
      supportedFeatures
    };

    return this.info;
  }

  private static getPackageVersion(packageName: string): string | undefined {
    try {
      // In a real implementation, this would read from package.json
      return 'unknown';
    } catch {
      return undefined;
    }
  }

  static clearCache(): void {
    this.info = null;
  }
}

// ================================
// HOT RELOAD SUPPORT
// ================================

export interface HotReloadConfig {
  enabled: boolean;
  watchFiles: string[];
  reloadDelay: number;
  preserveState: boolean;
  enableAutoRefresh: boolean;
  notifyOnReload: boolean;
}

export class HotReloadManager {
  private config: HotReloadConfig;
  private logger = createTickerLogger('SYSTEM', 'HotReload', generateExecutionId('hotreload'));
  private watchers: Map<string, any> = new Map();
  private machineStates: Map<string, any> = new Map();
  private reloadTimer?: NodeJS.Timeout;

  constructor(config: Partial<HotReloadConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      watchFiles: ['**/*.machine.ts', '**/*.machine.js'],
      reloadDelay: 300,
      preserveState: true,
      enableAutoRefresh: true,
      notifyOnReload: true,
      ...config
    };
  }

  initialize(): void {
    if (!this.config.enabled || !EnvironmentDetector.detect().isDevelopment) {
      return;
    }

    this.logger.info('Initialize', 'Starting hot reload manager', { config: this.config });

    // In a real implementation, this would use file system watchers
    this.setupFileWatchers();
    this.setupBrowserRefresh();
  }

  registerMachine(machineId: string, actor: ActorRef<any>): void {
    if (!this.config.enabled) return;

    this.logger.debug('RegisterMachine', `Registering machine for hot reload: ${machineId}`);

    if (this.config.preserveState) {
      // Store current state for preservation
      const currentState = actor.getSnapshot();
      this.machineStates.set(machineId, {
        state: currentState.value,
        context: currentState.context,
        timestamp: Date.now()
      });
    }

    // Subscribe to state changes for monitoring
    actor.subscribe({
      next: (state) => {
        if (this.config.preserveState) {
          this.machineStates.set(machineId, {
            state: state.value,
            context: state.context,
            timestamp: Date.now()
          });
        }
      }
    });
  }

  unregisterMachine(machineId: string): void {
    if (!this.config.enabled) return;

    this.logger.debug('UnregisterMachine', `Unregistering machine: ${machineId}`);
    this.machineStates.delete(machineId);
  }

  triggerReload(reason: string = 'Manual trigger'): void {
    if (!this.config.enabled) return;

    this.logger.info('TriggerReload', `Hot reload triggered: ${reason}`);

    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
    }

    this.reloadTimer = setTimeout(() => {
      this.performReload(reason);
    }, this.config.reloadDelay);
  }

  private setupFileWatchers(): void {
    // In a real implementation, this would use fs.watch or chokidar
    this.logger.debug('SetupFileWatchers', 'Setting up file watchers', { 
      patterns: this.config.watchFiles 
    });

    // Simulate file watching with browser-based detection
    if (EnvironmentDetector.detect().isBrowser && this.config.enableAutoRefresh) {
      // Use visibility API to detect when user returns to tab
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.shouldCheckForUpdates()) {
          this.triggerReload('Visibility change detected');
        }
      });
    }
  }

  private setupBrowserRefresh(): void {
    if (!EnvironmentDetector.detect().isBrowser) return;

    // Listen for broadcast messages from development server
    if (EnvironmentDetector.detect().supportedFeatures.includes('broadcast-channel')) {
      const channel = new BroadcastChannel('dev-server');
      channel.addEventListener('message', (event) => {
        if (event.data.type === 'file-changed') {
          this.triggerReload(`File changed: ${event.data.file}`);
        }
      });
    }

    // Setup WebSocket connection for live reload
    if (EnvironmentDetector.detect().supportedFeatures.includes('websocket')) {
      this.setupWebSocketReload();
    }
  }

  private setupWebSocketReload(): void {
    try {
      const ws = new WebSocket('ws://localhost:3001/hot-reload');
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'reload') {
          this.triggerReload(`Server reload: ${data.reason}`);
        }
      };

      ws.onopen = () => {
        this.logger.debug('WebSocket', 'Hot reload WebSocket connected');
      };

      ws.onerror = () => {
        this.logger.warn('WebSocket', 'Hot reload WebSocket connection failed');
      };
    } catch (error) {
      this.logger.warn('WebSocket', 'Could not establish hot reload WebSocket', error);
    }
  }

  private shouldCheckForUpdates(): boolean {
    // Simple heuristic - check if it's been more than 5 minutes
    return Date.now() - (this.getLastUpdateTime() || 0) > 5 * 60 * 1000;
  }

  private getLastUpdateTime(): number {
    const stored = localStorage.getItem('xstate-dev-last-update');
    return stored ? parseInt(stored, 10) : 0;
  }

  private performReload(reason: string): void {
    this.logger.info('PerformReload', `Performing hot reload: ${reason}`);

    if (this.config.notifyOnReload && EnvironmentDetector.detect().isBrowser) {
      this.showReloadNotification(reason);
    }

    // Store current timestamp
    localStorage.setItem('xstate-dev-last-update', Date.now().toString());

    // In a real implementation, this would trigger module reloading
    // For now, we just emit an event that components can listen to
    if (EnvironmentDetector.detect().isBrowser) {
      window.dispatchEvent(new CustomEvent('xstate-hot-reload', {
        detail: { reason, preservedStates: this.getPreservedStates() }
      }));
    }
  }

  private showReloadNotification(reason: string): void {
    // Simple notification - in production, use a proper toast library
    const notification = document.createElement('div');
    notification.textContent = `XState Hot Reload: ${reason}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4a90e2;
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 10000;
      font-family: monospace;
      font-size: 12px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }

  private getPreservedStates(): Record<string, any> {
    const states: Record<string, any> = {};
    this.machineStates.forEach((state, machineId) => {
      states[machineId] = state;
    });
    return states;
  }

  destroy(): void {
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
    }

    this.watchers.forEach((watcher) => {
      if (watcher && typeof watcher.close === 'function') {
        watcher.close();
      }
    });

    this.watchers.clear();
    this.machineStates.clear();
  }
}

// ================================
// DEBUGGING SHORTCUTS
// ================================

export interface DebugShortcuts {
  toggleInspector: string;
  takeSnapshot: string;
  exportLogs: string;
  clearLogs: string;
  showPanel: string;
  hidePanel: string;
  resetMachine: string;
  pauseExecution: string;
  resumeExecution: string;
}

export class DebugShortcutManager {
  private shortcuts: DebugShortcuts;
  private logger = createTickerLogger('SYSTEM', 'Shortcuts', generateExecutionId('shortcuts'));
  private keyHandlers: Map<string, () => void> = new Map();
  private isEnabled: boolean = false;

  constructor(shortcuts: Partial<DebugShortcuts> = {}) {
    this.shortcuts = {
      toggleInspector: 'ctrl+shift+i',
      takeSnapshot: 'ctrl+shift+s',
      exportLogs: 'ctrl+shift+e',
      clearLogs: 'ctrl+shift+c',
      showPanel: 'ctrl+shift+p',
      hidePanel: 'escape',
      resetMachine: 'ctrl+shift+r',
      pauseExecution: 'ctrl+shift+space',
      resumeExecution: 'ctrl+shift+enter',
      ...shortcuts
    };
  }

  enable(): void {
    if (this.isEnabled || !EnvironmentDetector.detect().isBrowser) return;

    this.logger.info('Enable', 'Enabling debug shortcuts', { shortcuts: this.shortcuts });

    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.isEnabled = true;
  }

  disable(): void {
    if (!this.isEnabled) return;

    this.logger.info('Disable', 'Disabling debug shortcuts');

    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.isEnabled = false;
  }

  registerHandler(shortcut: keyof DebugShortcuts, handler: () => void): void {
    this.keyHandlers.set(this.shortcuts[shortcut], handler);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = this.formatKeyCombo(event);
    const handler = this.keyHandlers.get(key);

    if (handler) {
      event.preventDefault();
      event.stopPropagation();
      
      this.logger.debug('HandleKeyDown', `Executing shortcut: ${key}`);
      handler();
    }
  }

  private formatKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    
    parts.push(event.key.toLowerCase());
    
    return parts.join('+');
  }

  getShortcuts(): DebugShortcuts {
    return { ...this.shortcuts };
  }

  updateShortcuts(updates: Partial<DebugShortcuts>): void {
    this.shortcuts = { ...this.shortcuts, ...updates };
    this.logger.debug('UpdateShortcuts', 'Updated shortcuts', { shortcuts: this.shortcuts });
  }
}

// ================================
// DEVELOPER COMMANDS
// ================================

export interface DeveloperCommand {
  name: string;
  description: string;
  category: 'machine' | 'logging' | 'testing' | 'performance' | 'debug';
  handler: (...args: any[]) => any;
  parameters?: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object';
    required: boolean;
    description: string;
  }[];
}

export class DeveloperCommandRegistry {
  private commands: Map<string, DeveloperCommand> = new Map();
  private logger = createTickerLogger('SYSTEM', 'Commands', generateExecutionId('commands'));
  private commandHistory: string[] = [];
  private maxHistorySize: number = 100;

  constructor() {
    this.registerBuiltInCommands();
  }

  registerCommand(command: DeveloperCommand): void {
    this.commands.set(command.name, command);
    this.logger.debug('RegisterCommand', `Registered command: ${command.name}`, { 
      category: command.category,
      parameters: command.parameters?.length || 0
    });
  }

  unregisterCommand(name: string): void {
    if (this.commands.delete(name)) {
      this.logger.debug('UnregisterCommand', `Unregistered command: ${name}`);
    }
  }

  executeCommand(name: string, ...args: any[]): any {
    const command = this.commands.get(name);
    if (!command) {
      throw new Error(`Unknown command: ${name}`);
    }

    this.logger.info('ExecuteCommand', `Executing command: ${name}`, { args });

    // Add to history
    this.commandHistory.push(`${name} ${args.join(' ')}`);
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory = this.commandHistory.slice(-this.maxHistorySize);
    }

    try {
      const result = command.handler(...args);
      this.logger.debug('ExecuteCommand', `Command completed: ${name}`, { result });
      return result;
    } catch (error) {
      this.logger.error('ExecuteCommand', `Command failed: ${name}`, error);
      throw error;
    }
  }

  getCommands(category?: DeveloperCommand['category']): DeveloperCommand[] {
    const commands = Array.from(this.commands.values());
    return category ? commands.filter(cmd => cmd.category === category) : commands;
  }

  getCommandHistory(): string[] {
    return [...this.commandHistory];
  }

  clearHistory(): void {
    this.commandHistory = [];
    this.logger.debug('ClearHistory', 'Command history cleared');
  }

  private registerBuiltInCommands(): void {
    // Machine commands
    this.registerCommand({
      name: 'machine.list',
      description: 'List all active machines',
      category: 'machine',
      handler: () => {
        // In a real implementation, this would list active machines
        return ['macro-execution-machine', 'data-fetch-machine'];
      }
    });

    this.registerCommand({
      name: 'machine.snapshot',
      description: 'Take a snapshot of a machine',
      category: 'machine',
      parameters: [
        { name: 'machineId', type: 'string', required: true, description: 'ID of the machine' }
      ],
      handler: (machineId: string) => {
        this.logger.info('MachineSnapshot', `Taking snapshot of machine: ${machineId}`);
        // In a real implementation, this would create a snapshot
        return { machineId, timestamp: Date.now(), state: 'unknown' };
      }
    });

    this.registerCommand({
      name: 'machine.reset',
      description: 'Reset a machine to its initial state',
      category: 'machine',
      parameters: [
        { name: 'machineId', type: 'string', required: true, description: 'ID of the machine' }
      ],
      handler: (machineId: string) => {
        this.logger.info('MachineReset', `Resetting machine: ${machineId}`);
        // In a real implementation, this would reset the machine
        return { machineId, reset: true, timestamp: Date.now() };
      }
    });

    // Logging commands
    this.registerCommand({
      name: 'logs.export',
      description: 'Export logs in specified format',
      category: 'logging',
      parameters: [
        { name: 'format', type: 'string', required: false, description: 'Export format (json, csv, text)' }
      ],
      handler: (format: string = 'json') => {
        const logs = globalAdvancedLogger.exportLogs(format as any);
        this.logger.info('LogsExport', `Exported logs in ${format} format`);
        return logs;
      }
    });

    this.registerCommand({
      name: 'logs.clear',
      description: 'Clear logs for a specific machine or all logs',
      category: 'logging',
      parameters: [
        { name: 'machineId', type: 'string', required: false, description: 'ID of the machine (optional)' }
      ],
      handler: (machineId?: string) => {
        globalAdvancedLogger.clearLogs(machineId);
        this.logger.info('LogsClear', machineId ? `Cleared logs for ${machineId}` : 'Cleared all logs');
        return { cleared: true, machineId };
      }
    });

    this.registerCommand({
      name: 'logs.stats',
      description: 'Get logging statistics',
      category: 'logging',
      handler: () => {
        const stats = globalAdvancedLogger.getStatistics();
        this.logger.info('LogsStats', 'Retrieved logging statistics', stats);
        return stats;
      }
    });

    // Performance commands
    this.registerCommand({
      name: 'perf.gc',
      description: 'Trigger garbage collection (Node.js only)',
      category: 'performance',
      handler: () => {
        if (typeof global !== 'undefined' && global.gc) {
          global.gc();
          this.logger.info('PerfGC', 'Garbage collection triggered');
          return { gc: true, timestamp: Date.now() };
        } else {
          throw new Error('Garbage collection is not available');
        }
      }
    });

    this.registerCommand({
      name: 'perf.memory',
      description: 'Get current memory usage',
      category: 'performance',
      handler: () => {
        if (typeof process !== 'undefined' && process.memoryUsage) {
          const usage = process.memoryUsage();
          this.logger.info('PerfMemory', 'Retrieved memory usage', usage);
          return usage;
        } else {
          throw new Error('Memory usage information is not available');
        }
      }
    });

    // Debug commands
    this.registerCommand({
      name: 'debug.env',
      description: 'Get environment information',
      category: 'debug',
      handler: () => {
        const env = EnvironmentDetector.detect();
        this.logger.info('DebugEnv', 'Retrieved environment information', env);
        return env;
      }
    });

    this.registerCommand({
      name: 'debug.help',
      description: 'Show all available commands',
      category: 'debug',
      handler: () => {
        const commands = this.getCommands().map(cmd => ({
          name: cmd.name,
          category: cmd.category,
          description: cmd.description,
          parameters: cmd.parameters?.map(p => `${p.name}${p.required ? '*' : ''}`)
        }));
        this.logger.info('DebugHelp', 'Listed all available commands');
        return commands;
      }
    });
  }
}

// ================================
// STATE MANIPULATION UTILITIES
// ================================

export class StateManipulator {
  private logger = createTickerLogger('SYSTEM', 'StateManipulator', generateExecutionId('manipulator'));
  private commandQueue: StateManipulationCommand[] = [];
  private executionTimer?: NodeJS.Timeout;

  queueCommand(command: StateManipulationCommand): void {
    this.commandQueue.push(command);
    this.logger.debug('QueueCommand', `Queued state manipulation command: ${command.type}`, { 
      machineId: command.machineId,
      queueSize: this.commandQueue.length 
    });

    // Execute commands with a small delay to batch them
    if (this.executionTimer) {
      clearTimeout(this.executionTimer);
    }

    this.executionTimer = setTimeout(() => {
      this.executeQueuedCommands();
    }, 100);
  }

  private executeQueuedCommands(): void {
    if (this.commandQueue.length === 0) return;

    this.logger.info('ExecuteQueuedCommands', `Executing ${this.commandQueue.length} queued commands`);

    const commands = [...this.commandQueue];
    this.commandQueue = [];

    commands.forEach(command => {
      try {
        this.executeCommand(command);
      } catch (error) {
        this.logger.error('ExecuteCommand', `Failed to execute command: ${command.type}`, error);
      }
    });
  }

  private executeCommand(command: StateManipulationCommand): void {
    this.logger.debug('ExecuteCommand', `Executing state manipulation: ${command.type}`, {
      machineId: command.machineId
    });

    switch (command.type) {
      case 'setState':
        this.setState(command.machineId, command.state);
        break;
      case 'updateContext':
        this.updateContext(command.machineId, command.context);
        break;
      case 'sendEvent':
        this.sendEvent(command.machineId, command.event);
        break;
      case 'resetMachine':
        this.resetMachine(command.machineId);
        break;
      default:
        throw new Error(`Unknown command type: ${(command as any).type}`);
    }
  }

  private setState(machineId: string, state: any): void {
    // In a real implementation, this would find and update the machine
    this.logger.info('SetState', `Setting state for machine: ${machineId}`, { state });
  }

  private updateContext(machineId: string, context: any): void {
    // In a real implementation, this would update the machine context
    this.logger.info('UpdateContext', `Updating context for machine: ${machineId}`, { context });
  }

  private sendEvent(machineId: string, event: any): void {
    // In a real implementation, this would send an event to the machine
    this.logger.info('SendEvent', `Sending event to machine: ${machineId}`, { event });
  }

  private resetMachine(machineId: string): void {
    // In a real implementation, this would reset the machine
    this.logger.info('ResetMachine', `Resetting machine: ${machineId}`);
  }

  clearQueue(): void {
    this.commandQueue = [];
    if (this.executionTimer) {
      clearTimeout(this.executionTimer);
    }
    this.logger.debug('ClearQueue', 'Cleared command queue');
  }

  getQueueSize(): number {
    return this.commandQueue.length;
  }
}

// ================================
// GLOBAL INSTANCES
// ================================

export const globalEnvironmentDetector = EnvironmentDetector;
export const globalHotReloadManager = new HotReloadManager();
export const globalShortcutManager = new DebugShortcutManager();
export const globalCommandRegistry = new DeveloperCommandRegistry();
export const globalStateManipulator = new StateManipulator();

// ================================
// INITIALIZATION UTILITIES
// ================================

export const initializeDeveloperTools = (config: {
  enableHotReload?: boolean;
  enableShortcuts?: boolean;
  enableCommands?: boolean;
  hotReloadConfig?: Partial<HotReloadConfig>;
  shortcuts?: Partial<DebugShortcuts>;
} = {}) => {
  const env = EnvironmentDetector.detect();
  
  if (!env.isDevelopment) {
    console.warn('Developer tools are only available in development environment');
    return;
  }

  console.log('Initializing XState developer tools...', config);

  // Initialize hot reload
  if (config.enableHotReload !== false) {
    globalHotReloadManager.initialize();
  }

  // Initialize shortcuts
  if (config.enableShortcuts !== false && env.isBrowser) {
    if (config.shortcuts) {
      globalShortcutManager.updateShortcuts(config.shortcuts);
    }
    globalShortcutManager.enable();
  }

  // Commands are always available
  console.log('Developer tools initialized successfully');
  console.log('Available commands:', globalCommandRegistry.executeCommand('debug.help'));
};

export const cleanupDeveloperTools = () => {
  globalHotReloadManager.destroy();
  globalShortcutManager.disable();
  globalCommandRegistry.clearHistory();
  globalStateManipulator.clearQueue();
};

// ================================
// EXPORTS
// ================================

export {
  EnvironmentDetector,
  HotReloadManager,
  DebugShortcutManager,
  DeveloperCommandRegistry,
  StateManipulator
};

export type {
  EnvironmentInfo,
  HotReloadConfig,
  DebugShortcuts,
  DeveloperCommand
};