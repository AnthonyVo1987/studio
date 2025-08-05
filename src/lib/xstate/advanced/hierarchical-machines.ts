/**
 * @fileoverview Hierarchical State Machines for Nested State Composition
 * 
 * Enables complex nested state machine architectures with event delegation,
 * context sharing, and sophisticated parent-child communication patterns.
 */

import {
  setup,
  createActor,
  assign,
  spawnChild,
  sendTo,
  sendParent,
  type ActorRef,
  type AnyMachineSnapshot,
  type EventObject
} from 'xstate';
import type {
  HierarchicalMachineConfig,
  HierarchicalContext,
  HierarchicalChildConfig,
  ContextInheritanceRule,
  EventDelegationState,
  DelegationMetrics,
  AdvancedEvent
} from './advanced-types';
// Define hierarchical machine event types
interface SpawnChildEvent extends EventObject {
  type: 'SPAWN_CHILD';
  childConfig: any;
  childId: string;
}

interface DestroyChildEvent extends EventObject {
  type: 'DESTROY_CHILD';
  childId: string;
}

type HierarchicalEvent = SpawnChildEvent | DestroyChildEvent | EventObject;

import type { 
  MacroExecutionContext,
  MacroExecutionEvent 
} from '@/lib/xstate/types/macro-types';

// ================================
// HIERARCHICAL MANAGER
// ================================

/**
 * Manager for hierarchical state machine coordination and event delegation
 */
export class HierarchicalManager {
  private hierarchyTree: Map<string, HierarchicalNode> = new Map();
  private eventDelegationTree: Map<string, EventDelegationHandler> = new Map();
  private contextSharingManager: ContextSharingManager;
  private metrics: Map<string, DelegationMetrics> = new Map();

  constructor() {
    this.contextSharingManager = new ContextSharingManager();
  }

  /**
   * Create hierarchical machine with parent-child relationships
   */
  createHierarchicalMachine(
    config: HierarchicalMachineConfig,
    parentContext?: HierarchicalContext
  ): ActorRef<any, any> {
    const hierarchicalContext: HierarchicalContext = {
      hierarchyConfig: config,
      hierarchyLevel: parentContext ? parentContext.hierarchyLevel + 1 : 0,
      parentContext,
      childContexts: new Map(),
      eventDelegation: {
        bubblingEvents: new Set(),
        capturingEvents: new Set(),
        delegationMetrics: {
          totalDelegated: 0,
          bubbledUp: 0,
          capturedDown: 0,
          averageDelegationTime: 0
        }
      },
      sharedContextStore: new Map()
    };

    const machine = this.buildHierarchicalMachine(config, hierarchicalContext);
    const actor = createActor(machine);
    
    // Register in hierarchy tree
    const node: HierarchicalNode = {
      id: config.parentMachine,
      actor,
      config,
      context: hierarchicalContext,
      children: new Map(),
      parent: null
    };
    
    this.hierarchyTree.set(config.parentMachine, node);
    
    return actor;
  }

  /**
   * Build the actual hierarchical state machine
   */
  private buildHierarchicalMachine(
    config: HierarchicalMachineConfig,
    hierarchicalContext: HierarchicalContext
  ): any {
    return setup({
      types: {
        context: {} as HierarchicalContext,
        events: {} as MacroExecutionEvent | AdvancedEvent | EventObject
      },
      actions: {
        initializeHierarchy: assign({
          sharedContextStore: ({ context }) => {
            // Initialize shared context based on configuration
            const sharedStore = new Map();
            
            if (context.hierarchyConfig.contextSharing === 'inherit' && context.parentContext) {
              // Inherit all context from parent
              for (const [key, value] of context.parentContext.sharedContextStore.entries()) {
                sharedStore.set(key, value);
              }
            }
            
            return sharedStore;
          }
        }),
        
        spawnChildMachine: ({ context, event }) => {
          if (event.type === 'SPAWN_CHILD') {
            const spawnEvent = event as SpawnChildEvent;
            this.spawnChildMachine(context, spawnEvent.childConfig, spawnEvent.childId);
          }
        },
        
        destroyChildMachine: ({ context, event }) => {
          if (event.type === 'DESTROY_CHILD') {
            const destroyEvent = event as DestroyChildEvent;
            this.destroyChildMachine(context, destroyEvent.childId);
          }
        },
        
        handleEventDelegation: ({ context, event }) => {
          if (event.type === 'HIERARCHY_EVENT_DELEGATED') {
            // Delegate event handling
            console.log('Handling event delegation:', event);
          }
        },
        
        processEventForDelegation: ({ context, event }) => {
          // Process event for delegation
          console.log('Processing event for delegation:', event);
        },
        
        syncContextWithChildren: ({ context, event }) => {
          if (event.type === 'CONTEXT_UPDATED') {
            // Sync context with children
            console.log('Syncing context with children:', event);
          }
        },
        
        handleChildContextChange: ({ context, event }) => {
          if (event.type === 'CHILD_CONTEXT_CHANGED') {
            // Handle child context change
            console.log('Handling child context change:', event);
          }
        },
        
        cleanupHierarchy: ({ context }) => {
          // Cleanup hierarchy
          console.log('Cleaning up hierarchy:', context);
        }
      }
    }).createMachine({
      id: config.parentMachine,
      context: hierarchicalContext,
      initial: 'initializing',
      states: {
        initializing: {
          entry: 'initializeHierarchy',
          on: {
            HIERARCHY_INITIALIZED: 'active'
          }
        },
        
        active: {
          type: 'parallel',
          states: {
            // Parent state management
            parentState: {
              initial: 'managing',
              states: {
                managing: {
                  on: {
                    SPAWN_CHILD: {
                      actions: 'spawnChildMachine'
                    },
                    DESTROY_CHILD: {
                      actions: 'destroyChildMachine'
                    },
                    HIERARCHY_EVENT_DELEGATED: {
                      actions: 'handleEventDelegation'
                    }
                  }
                }
              }
            },
            
            // Event delegation handling
            eventDelegation: {
              initial: 'listening',
              states: {
                listening: {
                  on: {
                    '*': {
                      actions: 'processEventForDelegation'
                    }
                  }
                }
              }
            },
            
            // Context sharing management
            contextSharing: {
              initial: 'syncing',
              states: {
                syncing: {
                  on: {
                    CONTEXT_UPDATED: {
                      actions: 'syncContextWithChildren'
                    },
                    CHILD_CONTEXT_CHANGED: {
                      actions: 'handleChildContextChange'
                    }
                  }
                }
              }
            }
          }
        },
        
        shutting_down: {
          entry: 'cleanupHierarchy',
          on: {
            CLEANUP_COMPLETE: 'stopped'
          }
        },
        
        stopped: {
          type: 'final'
        }
      }
    });
  }

  /**
   * Spawn child machine within hierarchy
   */
  private spawnChildMachine(
    parentContext: HierarchicalContext,
    childConfig: HierarchicalChildConfig,
    childId: string
  ): void {
    const childHierarchicalContext: HierarchicalContext = {
      hierarchyConfig: {
        ...parentContext.hierarchyConfig,
        parentMachine: childId
      },
      hierarchyLevel: parentContext.hierarchyLevel + 1,
      parentContext,
      childContexts: new Map(),
      eventDelegation: {
        bubblingEvents: new Set(),
        capturingEvents: new Set(),
        delegationMetrics: {
          totalDelegated: 0,
          bubbledUp: 0,
          capturedDown: 0,
          averageDelegationTime: 0
        }
      },
      sharedContextStore: new Map()
    };

    // Apply context inheritance rules
    this.applyContextInheritance(parentContext, childHierarchicalContext, childConfig.contextInheritance);

    // Create child machine
    const childMachine = this.createChildMachine(childConfig, childHierarchicalContext);
    const childActor = createActor(childMachine);
    
    // Add to hierarchy
    parentContext.childContexts.set(childId, childHierarchicalContext);
    
    const childNode: HierarchicalNode = {
      id: childId,
      actor: childActor,
      config: parentContext.hierarchyConfig,
      context: childHierarchicalContext,
      children: new Map(),
      parent: this.hierarchyTree.get(parentContext.hierarchyConfig.parentMachine) || null
    };
    
    this.hierarchyTree.set(childId, childNode);
    
    childActor.start();
  }

  /**
   * Create child machine based on configuration
   */
  private createChildMachine(
    childConfig: HierarchicalChildConfig,
    context: HierarchicalContext
  ): any {
    return setup({
      types: {
        context: {} as HierarchicalContext,
        events: {} as MacroExecutionEvent | AdvancedEvent | EventObject
      },
      actions: {
        initializeChild: () => {
          console.log(`Initializing child machine: ${childConfig.machineType}`);
        },
        
        handleEventBubbling: ({ context, event }) => {
          // Handle event bubbling
          console.log('Handling event bubbling:', event);
        }
      }
    }).createMachine({
      id: `child-${childConfig.machineType}`,
      context,
      initial: 'initializing',
      states: {
        initializing: {
          entry: 'initializeChild',
          on: {
            CHILD_INITIALIZED: 'active'
          }
        },
        
        active: {
          on: {
            // Handle events that should bubble up
            '*': {
              actions: 'handleEventBubbling'
            }
          }
        },
        
        stopped: {
          type: 'final'
        }
      }
    });
  }

  /**
   * Apply context inheritance rules between parent and child
   */
  private applyContextInheritance(
    parentContext: HierarchicalContext,
    childContext: HierarchicalContext,
    inheritanceRules: ContextInheritanceRule[]
  ): void {
    for (const rule of inheritanceRules) {
      if (rule.direction === 'parent-to-child' || rule.direction === 'bidirectional') {
        const sourceValue = this.getValueFromPath(parentContext.sharedContextStore, rule.source);
        if (sourceValue !== undefined) {
          const transformedValue = rule.transform ? rule.transform(sourceValue) : sourceValue;
          this.setValueAtPath(childContext.sharedContextStore, rule.target, transformedValue);
        }
      }
    }
  }

  /**
   * Process event for potential delegation
   */
  private processEventForDelegation(context: HierarchicalContext, event: EventObject): void {
    const startTime = performance.now();
    
    // Check if event should be delegated based on configuration
    if (this.shouldDelegateEvent(context, event)) {
      if (context.hierarchyConfig.eventDelegation === 'bubble' || context.hierarchyConfig.eventDelegation === 'both') {
        this.bubbleEventUp(context, event);
      }
      
      if (context.hierarchyConfig.eventDelegation === 'capture' || context.hierarchyConfig.eventDelegation === 'both') {
        this.captureEventDown(context, event);
      }
      
      // Update metrics
      const delegationTime = performance.now() - startTime;
      this.updateDelegationMetrics(context, delegationTime);
    }
  }

  /**
   * Bubble event up to parent
   */
  private bubbleEventUp(context: HierarchicalContext, event: EventObject): void {
    if (context.parentContext) {
      context.eventDelegation.bubblingEvents.add(event.type);
      context.eventDelegation.delegationMetrics.bubbledUp++;
      
      // Send to parent
      const parentNode = this.findNodeByContext(context.parentContext);
      if (parentNode) {
        parentNode.actor.send({
          type: 'HIERARCHY_EVENT_DELEGATED',
          targetLevel: context.hierarchyLevel - 1,
          event,
          source: 'child'
        });
      }
    }
  }

  /**
   * Capture event down to children
   */
  private captureEventDown(context: HierarchicalContext, event: EventObject): void {
    context.eventDelegation.capturingEvents.add(event.type);
    context.eventDelegation.delegationMetrics.capturedDown++;
    
    // Send to all child contexts
    for (const [childId, childContext] of context.childContexts.entries()) {
      const childNode = this.findNodeByContext(childContext);
      if (childNode) {
        childNode.actor.send({
          type: 'HIERARCHY_EVENT_DELEGATED',
          targetLevel: context.hierarchyLevel + 1,
          event,
          source: 'parent'
        });
      }
    }
  }

  /**
   * Handle event bubbling from child machines
   */
  private handleEventBubbling(context: HierarchicalContext, event: EventObject): void {
    // Check if this event should bubble up further
    if (this.shouldBubbleEvent(context, event)) {
      this.bubbleEventUp(context, event);
    }
  }

  /**
   * Sync context changes with child machines
   */
  private syncContextWithChildren(context: HierarchicalContext, contextChanges: any): void {
    for (const [childId, childContext] of context.childContexts.entries()) {
      // Apply selective context sharing rules
      if (context.hierarchyConfig.contextSharing === 'selective') {
        const sharedProperties = context.hierarchyConfig.sharedContextProperties || [];
        
        for (const property of sharedProperties) {
          if (contextChanges[property] !== undefined) {
            childContext.sharedContextStore.set(property, contextChanges[property]);
          }
        }
      } else if (context.hierarchyConfig.contextSharing === 'inherit') {
        // Share all context changes
        for (const [key, value] of Object.entries(contextChanges)) {
          childContext.sharedContextStore.set(key, value);
        }
      }
    }
  }

  /**
   * Handle context changes from child machines
   */
  private handleChildContextChange(
    parentContext: HierarchicalContext,
    childId: string,
    contextChanges: any
  ): void {
    const childContext = parentContext.childContexts.get(childId);
    if (!childContext) return;

    // Check if changes should propagate back to parent
    const childConfig = parentContext.hierarchyConfig.childMachines[childId];
    if (childConfig?.contextInheritance) {
      for (const rule of childConfig.contextInheritance) {
        if (rule.direction === 'child-to-parent' || rule.direction === 'bidirectional') {
          const sourceValue = contextChanges[rule.source];
          if (sourceValue !== undefined) {
            const transformedValue = rule.transform ? rule.transform(sourceValue) : sourceValue;
            parentContext.sharedContextStore.set(rule.target, transformedValue);
          }
        }
      }
    }
  }

  /**
   * Determine if event should be delegated
   */
  private shouldDelegateEvent(context: HierarchicalContext, event: EventObject): boolean {
    // Check event filters in child configurations
    for (const childConfig of Object.values(context.hierarchyConfig.childMachines)) {
      if (childConfig.eventFilters.includes(event.type)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Determine if event should bubble up
   */
  private shouldBubbleEvent(context: HierarchicalContext, event: EventObject): boolean {
    // Events bubble up unless explicitly filtered
    return !event.type.startsWith('INTERNAL_');
  }

  /**
   * Find hierarchy node by context
   */
  private findNodeByContext(context: HierarchicalContext): HierarchicalNode | null {
    for (const node of this.hierarchyTree.values()) {
      if (node.context === context) {
        return node;
      }
    }
    return null;
  }

  /**
   * Update delegation metrics
   */
  private updateDelegationMetrics(context: HierarchicalContext, delegationTime: number): void {
    const metrics = context.eventDelegation.delegationMetrics;
    metrics.totalDelegated++;
    
    // Update running average
    const oldAverage = metrics.averageDelegationTime;
    const newAverage = (oldAverage * (metrics.totalDelegated - 1) + delegationTime) / metrics.totalDelegated;
    metrics.averageDelegationTime = newAverage;
  }

  /**
   * Destroy child machine and cleanup
   */
  private destroyChildMachine(parentContext: HierarchicalContext, childId: string): void {
    const childContext = parentContext.childContexts.get(childId);
    if (!childContext) return;

    // Recursively destroy child's children
    for (const grandChildId of childContext.childContexts.keys()) {
      this.destroyChildMachine(childContext, grandChildId);
    }

    // Remove from hierarchy tree
    const childNode = this.hierarchyTree.get(childId);
    if (childNode) {
      childNode.actor.stop();
      this.hierarchyTree.delete(childId);
    }

    // Remove from parent's children
    parentContext.childContexts.delete(childId);
  }

  /**
   * Cleanup entire hierarchy
   */
  private cleanupHierarchy(context: HierarchicalContext): void {
    // Stop all child machines
    for (const childId of context.childContexts.keys()) {
      this.destroyChildMachine(context, childId);
    }

    // Clear shared context
    context.sharedContextStore.clear();
  }

  /**
   * Get hierarchy metrics
   */
  getHierarchyMetrics(): Map<string, DelegationMetrics> {
    const metrics = new Map<string, DelegationMetrics>();
    
    for (const [nodeId, node] of this.hierarchyTree.entries()) {
      metrics.set(nodeId, { ...node.context.eventDelegation.delegationMetrics });
    }
    
    return metrics;
  }

  /**
   * Get hierarchy tree structure
   */
  getHierarchyTree(): Map<string, { level: number; children: string[]; parent?: string }> {
    const tree = new Map();
    
    for (const [nodeId, node] of this.hierarchyTree.entries()) {
      tree.set(nodeId, {
        level: node.context.hierarchyLevel,
        children: Array.from(node.children.keys()),
        parent: node.parent?.id
      });
    }
    
    return tree;
  }

  // Utility methods for path-based context access
  private getValueFromPath(store: Map<string, any>, path: string): any {
    return store.get(path);
  }

  private setValueAtPath(store: Map<string, any>, path: string, value: any): void {
    store.set(path, value);
  }

  /**
   * Cleanup manager resources
   */
  destroy(): void {
    // Stop all hierarchy nodes
    for (const node of this.hierarchyTree.values()) {
      node.actor.stop();
    }
    
    this.hierarchyTree.clear();
    this.eventDelegationTree.clear();
    this.metrics.clear();
  }
}

// ================================
// CONTEXT SHARING MANAGER
// ================================

/**
 * Manages context sharing between hierarchical machines
 */
class ContextSharingManager {
  private sharedContexts: Map<string, Map<string, any>> = new Map();
  private subscriptions: Map<string, Set<(changes: any) => void>> = new Map();

  /**
   * Create shared context namespace
   */
  createSharedContext(namespaceId: string): void {
    if (!this.sharedContexts.has(namespaceId)) {
      this.sharedContexts.set(namespaceId, new Map());
      this.subscriptions.set(namespaceId, new Set());
    }
  }

  /**
   * Update shared context value
   */
  updateSharedContext(namespaceId: string, key: string, value: any): void {
    const context = this.sharedContexts.get(namespaceId);
    if (!context) return;

    const oldValue = context.get(key);
    context.set(key, value);

    // Notify subscribers
    const subscribers = this.subscriptions.get(namespaceId);
    if (subscribers) {
      const changes = { [key]: { oldValue, newValue: value } };
      subscribers.forEach(callback => callback(changes));
    }
  }

  /**
   * Get shared context value
   */
  getSharedContext(namespaceId: string, key: string): any {
    const context = this.sharedContexts.get(namespaceId);
    return context?.get(key);
  }

  /**
   * Subscribe to context changes
   */
  subscribe(namespaceId: string, callback: (changes: any) => void): () => void {
    const subscribers = this.subscriptions.get(namespaceId);
    if (!subscribers) return () => {};

    subscribers.add(callback);
    
    return () => {
      subscribers.delete(callback);
    };
  }
}

// ================================
// EVENT DELEGATION HANDLER
// ================================

/**
 * Handles event delegation within hierarchical structures
 */
class EventDelegationHandler {
  private delegationRules: Map<string, (event: EventObject) => boolean> = new Map();
  private eventFilters: Map<string, Set<string>> = new Map();

  /**
   * Add delegation rule
   */
  addDelegationRule(eventType: string, rule: (event: EventObject) => boolean): void {
    this.delegationRules.set(eventType, rule);
  }

  /**
   * Add event filter for specific node
   */
  addEventFilter(nodeId: string, eventTypes: string[]): void {
    if (!this.eventFilters.has(nodeId)) {
      this.eventFilters.set(nodeId, new Set());
    }
    
    const filters = this.eventFilters.get(nodeId)!;
    eventTypes.forEach(type => filters.add(type));
  }

  /**
   * Check if event should be delegated
   */
  shouldDelegate(nodeId: string, event: EventObject): boolean {
    const filters = this.eventFilters.get(nodeId);
    if (filters && !filters.has(event.type)) {
      return false;
    }

    const rule = this.delegationRules.get(event.type);
    return rule ? rule(event) : true;
  }
}

// ================================
// HIERARCHICAL NODE TYPE
// ================================

interface HierarchicalNode {
  id: string;
  actor: ActorRef<any, any>;
  config: HierarchicalMachineConfig;
  context: HierarchicalContext;
  children: Map<string, HierarchicalNode>;
  parent: HierarchicalNode | null;
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Utility functions for hierarchical machine management
 */
export const HierarchicalUtils = {
  /**
   * Create standard parent-child relationship
   */
  createParentChildConfig(
    parentId: string,
    childConfigs: Record<string, HierarchicalChildConfig>
  ): HierarchicalMachineConfig {
    return {
      parentMachine: parentId,
      childMachines: childConfigs,
      eventDelegation: 'bubble',
      contextSharing: 'selective',
      sharedContextProperties: ['ticker', 'executionId'],
      maxDepth: 3
    };
  },

  /**
   * Create context inheritance rule
   */
  createInheritanceRule(
    source: string,
    target: string,
    direction: ContextInheritanceRule['direction'],
    transform?: (value: any) => any
  ): ContextInheritanceRule {
    return {
      source,
      target,
      direction,
      transform
    };
  },

  /**
   * Calculate hierarchy depth
   */
  calculateDepth(context: HierarchicalContext): number {
    let depth = 0;
    let current: HierarchicalContext | undefined = context;
    
    while (current?.parentContext) {
      depth++;
      current = current.parentContext;
    }
    
    return depth;
  },

  /**
   * Find root context
   */
  findRoot(context: HierarchicalContext): HierarchicalContext {
    let current = context;
    while (current.parentContext) {
      current = current.parentContext;
    }
    return current;
  }
};

// ================================
// EXPORTS
// ================================

export {
  type HierarchicalMachineConfig,
  type HierarchicalContext,
  type HierarchicalChildConfig,
  type ContextInheritanceRule,
  type EventDelegationState,
  type DelegationMetrics
};