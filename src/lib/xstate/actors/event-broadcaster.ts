/**
 * @fileoverview Event Broadcaster for XState-StockSage Integration
 * 
 * Provides pub/sub event system for communication between actors,
 * UI components, and integration layer. Enables loose coupling.
 */

import type {
  EventBroadcaster,
  ActorEvent,
} from './actor-types';
import type { IntegrationEvent } from '@/lib/xstate/integration';
import { createTickerLogger } from '@/lib/ticker-logger';

/**
 * Event types for the broadcaster
 */
type BroadcastEvent = ActorEvent | IntegrationEvent;
type EventType = BroadcastEvent['type'];
type EventCallback = (event: BroadcastEvent) => void;

/**
 * Subscription management
 */
interface Subscription {
  id: string;
  eventType: EventType | 'ALL';
  callback: EventCallback;
  createdAt: number;
  callCount: number;
  lastCalled?: number;
}

/**
 * Event Broadcaster Implementation
 * Provides centralized event distribution with filtering and metrics
 */
export class StockSageEventBroadcaster implements EventBroadcaster {
  private subscriptions: Map<string, Subscription>;
  private eventHistory: Array<{ event: BroadcastEvent; timestamp: number }>;
  private logger;
  private maxHistorySize = 1000;
  private subscriptionCounter = 0;

  constructor() {
    this.subscriptions = new Map();
    this.eventHistory = [];
    this.logger = createTickerLogger('SYSTEM', 'EVENT_BROADCASTER');
    
    this.logger.info('EventBroadcaster', 'Broadcaster initialized');
  }

  /**
   * Broadcast event to all subscribers
   */
  broadcast(event: BroadcastEvent): void {
    try {
      const timestamp = Date.now();
      
      this.logger.debug('Broadcast', `Broadcasting event: ${event.type}`, {
        eventType: event.type,
        hasSubscribers: this.subscriptions.size > 0,
      });

      // Add to history
      this.addToHistory(event, timestamp);

      // Get all matching subscriptions
      const matchingSubscriptions = this.getMatchingSubscriptions(event.type);
      
      if (matchingSubscriptions.length === 0) {
        this.logger.debug('Broadcast', `No subscribers for event: ${event.type}`);
        return;
      }

      // Call all matching callbacks
      let successCount = 0;
      let errorCount = 0;

      for (const subscription of matchingSubscriptions) {
        try {
          subscription.callback(event);
          subscription.callCount++;
          subscription.lastCalled = timestamp;
          successCount++;
          
        } catch (error) {
          errorCount++;
          this.logger.error('Broadcast', 'Subscription callback error', {
            subscriptionId: subscription.id,
            eventType: event.type,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      this.logger.debug('Broadcast', `Event broadcast completed: ${event.type}`, {
        totalSubscriptions: matchingSubscriptions.length,
        successCount,
        errorCount,
      });

    } catch (error) {
      this.logger.error('Broadcast', 'Failed to broadcast event', {
        eventType: event.type,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(
    eventType: EventType,
    callback: EventCallback
  ): () => void {
    try {
      const subscriptionId = `sub_${++this.subscriptionCounter}_${Date.now()}`;
      
      const subscription: Subscription = {
        id: subscriptionId,
        eventType,
        callback,
        createdAt: Date.now(),
        callCount: 0,
      };

      this.subscriptions.set(subscriptionId, subscription);

      this.logger.debug('Subscribe', 'New subscription created', {
        subscriptionId,
        eventType,
        totalSubscriptions: this.subscriptions.size,
      });

      // Return unsubscribe function
      return () => {
        const removed = this.subscriptions.delete(subscriptionId);
        if (removed) {
          this.logger.debug('Unsubscribe', 'Subscription removed', {
            subscriptionId,
            eventType,
            callCount: subscription.callCount,
            lifetime: Date.now() - subscription.createdAt,
          });
        }
      };

    } catch (error) {
      this.logger.error('Subscribe', 'Failed to create subscription', {
        eventType,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return no-op unsubscribe function
      return () => {};
    }
  }

  /**
   * Subscribe to all events
   */
  subscribeAll(callback: EventCallback): () => void {
    return this.subscribe('ALL' as EventType, callback);
  }

  /**
   * Get subscriber count
   */
  getSubscriberCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Clear all subscriptions
   */
  clearSubscriptions(): void {
    const subscriptionCount = this.subscriptions.size;
    this.subscriptions.clear();
    
    this.logger.info('ClearSubscriptions', 'All subscriptions cleared', {
      clearedSubscriptions: subscriptionCount,
    });
  }

  /**
   * Get event statistics
   */
  getEventStatistics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: Array<{ type: string; timestamp: number }>;
    subscriptionStats: {
      totalSubscriptions: number;
      subscriptionsByType: Record<string, number>;
      averageCallCount: number;
    };
  } {
    // Calculate events by type
    const eventsByType: Record<string, number> = {};
    this.eventHistory.forEach(({ event }) => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    // Get recent events (last 10)
    const recentEvents = this.eventHistory
      .slice(-10)
      .map(({ event, timestamp }) => ({
        type: event.type,
        timestamp,
      }));

    // Calculate subscription statistics
    const subscriptionsByType: Record<string, number> = {};
    let totalCalls = 0;
    
    this.subscriptions.forEach(subscription => {
      const type = subscription.eventType;
      subscriptionsByType[type] = (subscriptionsByType[type] || 0) + 1;
      totalCalls += subscription.callCount;
    });

    const averageCallCount = this.subscriptions.size > 0 ? 
      totalCalls / this.subscriptions.size : 0;

    return {
      totalEvents: this.eventHistory.length,
      eventsByType,
      recentEvents,
      subscriptionStats: {
        totalSubscriptions: this.subscriptions.size,
        subscriptionsByType,
        averageCallCount,
      },
    };
  }

  /**
   * Get subscription details
   */
  getSubscriptionDetails(): Array<{
    id: string;
    eventType: EventType | 'ALL';
    createdAt: number;
    callCount: number;
    lastCalled?: number;
    age: number;
  }> {
    const now = Date.now();
    
    return Array.from(this.subscriptions.values()).map(subscription => ({
      id: subscription.id,
      eventType: subscription.eventType,
      createdAt: subscription.createdAt,
      callCount: subscription.callCount,
      lastCalled: subscription.lastCalled,
      age: now - subscription.createdAt,
    }));
  }

  /**
   * Clear event history
   */
  clearEventHistory(): void {
    const historySize = this.eventHistory.length;
    this.eventHistory = [];
    
    this.logger.info('ClearEventHistory', 'Event history cleared', {
      clearedEvents: historySize,
    });
  }

  /**
   * Get matching subscriptions for event type
   */
  private getMatchingSubscriptions(eventType: EventType): Subscription[] {
    const matching: Subscription[] = [];
    
    this.subscriptions.forEach(subscription => {
      if (subscription.eventType === 'ALL' || subscription.eventType === eventType) {
        matching.push(subscription);
      }
    });
    
    return matching;
  }

  /**
   * Add event to history
   */
  private addToHistory(event: BroadcastEvent, timestamp: number): void {
    this.eventHistory.push({ event, timestamp });
    
    // Trim history if it exceeds max size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }
}

/**
 * Factory function to create event broadcaster
 */
export function createEventBroadcaster(): EventBroadcaster {
  return new StockSageEventBroadcaster();
}

/**
 * Singleton broadcaster instance for global use
 */
let globalBroadcaster: EventBroadcaster | null = null;

/**
 * Get global event broadcaster instance
 */
export function getGlobalEventBroadcaster(): EventBroadcaster {
  if (!globalBroadcaster) {
    globalBroadcaster = createEventBroadcaster();
  }
  return globalBroadcaster;
}

/**
 * Reset global broadcaster (for testing)
 */
export function resetGlobalEventBroadcaster(): void {
  if (globalBroadcaster) {
    globalBroadcaster.clearSubscriptions();
    globalBroadcaster = null;
  }
}

/**
 * Utility function to create typed event subscription
 */
export function createTypedSubscription<T extends BroadcastEvent>(
  broadcaster: EventBroadcaster,
  eventType: T['type'],
  callback: (event: T) => void
): () => void {
  return broadcaster.subscribe(eventType, callback as EventCallback);
}

/**
 * Utility function to broadcast multiple events
 */
export function broadcastMultiple(
  broadcaster: EventBroadcaster,
  events: BroadcastEvent[]
): void {
  events.forEach(event => broadcaster.broadcast(event));
}

/**
 * Utility function to create event filter
 */
export function createEventFilter<T extends BroadcastEvent>(
  predicate: (event: BroadcastEvent) => event is T
): (callback: (event: T) => void) => EventCallback {
  return (callback: (event: T) => void) => {
    return (event: BroadcastEvent) => {
      if (predicate(event)) {
        callback(event);
      }
    };
  };
}

/**
 * Pre-defined event filters
 */
export const EventFilters = {
  // Actor events only
  actorEvents: createEventFilter<ActorEvent>((event): event is ActorEvent => 
    'actorId' in event
  ),
  
  // Integration events only
  integrationEvents: createEventFilter<IntegrationEvent>((event): event is IntegrationEvent => 
    'ticker' in event && event.type.includes('CONTEXT_') || event.type.includes('SERVICE_') || event.type.includes('WORKFLOW_')
  ),
  
  // Error events only
  errorEvents: createEventFilter<ActorEvent | IntegrationEvent>((event): event is any => 
    event.type.includes('ERROR')
  ),
  
  // Completion events only
  completionEvents: createEventFilter<ActorEvent | IntegrationEvent>((event): event is any => 
    event.type.includes('COMPLETED') || event.type.includes('COMPLETE')
  ),
};