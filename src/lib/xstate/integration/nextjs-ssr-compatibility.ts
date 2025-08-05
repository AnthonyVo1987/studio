/**
 * @fileoverview Next.js SSR Compatibility for XState v5 Snapshots
 * 
 * Provides utilities for proper snapshot serialization/deserialization
 * across the client-server boundary in Next.js applications with XState v5.
 */

import type { AnyMachineSnapshot } from 'xstate';

/**
 * Serializable snapshot format for Next.js SSR
 */
export interface SerializableSnapshot {
  value: any;
  context: any;
  status?: string;
  output?: any;
  error?: any;
  _version: 'v5';
  _timestamp: number;
  _isSSRCompatible: true;
}

/**
 * SSR hydration metadata
 */
export interface SSRHydrationMetadata {
  isServerSide: boolean;
  hydrationTimestamp: number;
  clientTimestamp?: number;
  version: string;
}

/**
 * Convert XState v5 snapshot to SSR-compatible format
 */
export function serializeSnapshotForSSR(
  snapshot: AnyMachineSnapshot
): SerializableSnapshot {
  return {
    value: snapshot.value,
    context: snapshot.context,
    status: (snapshot as any).status || 'active',
    output: (snapshot as any).output,
    error: (snapshot as any).error,
    _version: 'v5',
    _timestamp: Date.now(),
    _isSSRCompatible: true,
  };
}

/**
 * Restore XState v5 snapshot from SSR-compatible format
 */
export function deserializeSnapshotFromSSR(
  serialized: SerializableSnapshot | string
): AnyMachineSnapshot {
  let parsed: SerializableSnapshot;
  
  if (typeof serialized === 'string') {
    try {
      parsed = JSON.parse(serialized);
    } catch (error) {
      throw new Error('Failed to parse serialized snapshot from SSR');
    }
  } else {
    parsed = serialized;
  }

  // Validate SSR compatibility
  if (!parsed._isSSRCompatible || parsed._version !== 'v5') {
    throw new Error('Invalid or incompatible SSR snapshot format');
  }

  return {
    value: parsed.value,
    context: parsed.context,
    status: parsed.status || 'active',
    output: parsed.output,
    error: parsed.error,
  } as AnyMachineSnapshot;
}

/**
 * Check if code is running on server side
 */
export function isServerSide(): boolean {
  return typeof window === 'undefined';
}

/**
 * Create hydration metadata for tracking SSR -> Client transitions
 */
export function createHydrationMetadata(): SSRHydrationMetadata {
  return {
    isServerSide: isServerSide(),
    hydrationTimestamp: Date.now(),
    clientTimestamp: isServerSide() ? undefined : Date.now(),
    version: 'v5',
  };
}

/**
 * Next.js compatible snapshot persistence
 */
export class NextJSSnapshotPersistence {
  private static readonly SSR_SNAPSHOT_KEY = '__xstate_ssr_snapshot__';
  
  /**
   * Store snapshot in a way that survives SSR hydration
   */
  static storeForHydration(
    key: string, 
    snapshot: AnyMachineSnapshot
  ): void {
    if (isServerSide()) {
      // On server, we can't use localStorage, but we can prepare for hydration
      return;
    }

    try {
      const serialized = serializeSnapshotForSSR(snapshot);
      const storageKey = `${this.SSR_SNAPSHOT_KEY}_${key}`;
      sessionStorage.setItem(storageKey, JSON.stringify(serialized));
    } catch (error) {
      console.warn('Failed to store snapshot for hydration:', error);
    }
  }

  /**
   * Retrieve snapshot after hydration
   */
  static retrieveFromHydration(
    key: string
  ): AnyMachineSnapshot | null {
    if (isServerSide()) {
      return null;
    }

    try {
      const storageKey = `${this.SSR_SNAPSHOT_KEY}_${key}`;
      const stored = sessionStorage.getItem(storageKey);
      
      if (!stored) {
        return null;
      }

      return deserializeSnapshotFromSSR(stored);
    } catch (error) {
      console.warn('Failed to retrieve snapshot from hydration:', error);
      return null;
    }
  }

  /**
   * Clear hydration storage
   */
  static clearHydrationStorage(key?: string): void {
    if (isServerSide()) {
      return;
    }

    try {
      if (key) {
        const storageKey = `${this.SSR_SNAPSHOT_KEY}_${key}`;
        sessionStorage.removeItem(storageKey);
      } else {
        // Clear all hydration snapshots
        const keys = Object.keys(sessionStorage);
        keys.forEach(storageKey => {
          if (storageKey.startsWith(this.SSR_SNAPSHOT_KEY)) {
            sessionStorage.removeItem(storageKey);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to clear hydration storage:', error);
    }
  }
}

/**
 * React hook for SSR-compatible snapshot management
 */
export function useSSRSnapshot(
  key: string,
  initialSnapshot?: AnyMachineSnapshot
) {
  // Check for hydrated snapshot first
  const hydratedSnapshot = NextJSSnapshotPersistence.retrieveFromHydration(key);
  
  if (hydratedSnapshot) {
    // Clear the hydration storage since we've retrieved it
    NextJSSnapshotPersistence.clearHydrationStorage(key);
    return hydratedSnapshot;
  }

  return initialSnapshot || null;
}

/**
 * Utility for preparing snapshots for Next.js getServerSideProps
 */
export function prepareSnapshotForProps(
  snapshot: AnyMachineSnapshot
): { serializedSnapshot: string } {
  const serialized = serializeSnapshotForSSR(snapshot);
  return {
    serializedSnapshot: JSON.stringify(serialized),
  };
}

/**
 * Utility for restoring snapshots from Next.js props
 */
export function restoreSnapshotFromProps(
  serializedSnapshot: string
): AnyMachineSnapshot {
  return deserializeSnapshotFromSSR(serializedSnapshot);
}

/**
 * Validate snapshot compatibility with Next.js SSR
 */
export function validateSSRCompatibility(
  snapshot: any
): { isCompatible: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for non-serializable functions
  if (hasNonSerializableProperties(snapshot)) {
    issues.push('Snapshot contains non-serializable properties (functions, symbols, etc.)');
  }

  // Check for circular references
  try {
    JSON.stringify(snapshot);
  } catch (error) {
    if (error instanceof Error && error.message.includes('circular')) {
      issues.push('Snapshot contains circular references');
    }
  }

  // Check for XState v5 compatibility
  if (!snapshot._version || snapshot._version !== 'v5') {
    issues.push('Snapshot is not marked as XState v5 compatible');
  }

  return {
    isCompatible: issues.length === 0,
    issues,
  };
}

/**
 * Helper to detect non-serializable properties
 */
function hasNonSerializableProperties(obj: any, visited = new Set()): boolean {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  if (visited.has(obj)) {
    return false; // Avoid infinite recursion
  }
  visited.add(obj);

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const type = typeof value;

      if (type === 'function' || type === 'symbol' || type === 'undefined') {
        return true;
      }

      if (type === 'object' && value !== null) {
        if (hasNonSerializableProperties(value, visited)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Development helper for debugging SSR snapshot issues
 */
export function debugSSRSnapshot(
  snapshot: AnyMachineSnapshot,
  label?: string
): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const prefix = label ? `[${label}] ` : '';
  const compatibility = validateSSRCompatibility(snapshot);
  
  console.group(`${prefix}XState SSR Snapshot Debug`);
  console.log('Snapshot:', snapshot);
  console.log('Server Side:', isServerSide());
  console.log('SSR Compatible:', compatibility.isCompatible);
  
  if (!compatibility.isCompatible) {
    console.warn('Compatibility Issues:', compatibility.issues);
  }
  
  console.log('Hydration Metadata:', createHydrationMetadata());
  console.groupEnd();
}