/**
 * @fileOverview Chat Action Resolver
 * 
 * Dynamically resolves chat action imports for ticker tabs.
 * Handles both static imports and lazy loading of chat actions
 * based on ticker configuration.
 */

// Import all available chat actions
import { spyConsolidatedChatAction } from '@/actions/spy-consolidated-chat-action';
import { nvdaConsolidatedChatAction } from '@/actions/nvda-consolidated-chat-action';

/**
 * Chat action function type
 */
export type ChatActionFunction = (prevState: any, payload: any) => Promise<any>;

/**
 * Map of action paths to actual functions
 */
const CHAT_ACTION_MAP: Record<string, ChatActionFunction> = {
  '@/actions/spy-consolidated-chat-action': spyConsolidatedChatAction,
  '@/actions/nvda-consolidated-chat-action': nvdaConsolidatedChatAction,
  // Add more chat actions as they're implemented
  // '@/actions/qqq-consolidated-chat-action': qqqConsolidatedChatAction,
  // '@/actions/aapl-consolidated-chat-action': aaplConsolidatedChatAction,
};

/**
 * Resolve a chat action by path
 */
export function resolveChatAction(actionPath: string): ChatActionFunction | undefined {
  return CHAT_ACTION_MAP[actionPath];
}

/**
 * Get all available chat action paths
 */
export function getAvailableChatActionPaths(): string[] {
  return Object.keys(CHAT_ACTION_MAP);
}

/**
 * Check if a chat action path is supported
 */
export function isChatActionSupported(actionPath: string): boolean {
  return actionPath in CHAT_ACTION_MAP;
}

/**
 * Lazy loading support for chat actions
 * This can be extended to support dynamic imports in the future
 */
export async function loadChatAction(actionPath: string): Promise<ChatActionFunction | undefined> {
  // For now, just return the statically imported action
  // In the future, this could support dynamic imports:
  
  // try {
  //   const module = await import(actionPath);
  //   return module.default || module[getActionFunctionName(actionPath)];
  // } catch (error) {
  //   console.error(`Failed to load chat action: ${actionPath}`, error);
  //   return undefined;
  // }
  
  return resolveChatAction(actionPath);
}

/**
 * Get the expected function name from action path
 */
function getActionFunctionName(actionPath: string): string {
  // Extract filename and convert to camelCase
  // e.g., '@/actions/spy-consolidated-chat-action' -> 'spyConsolidatedChatAction'
  const filename = actionPath.split('/').pop()?.replace('.ts', '') || '';
  return filename.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Development utilities
 */
export const ChatActionResolverUtils = {
  /**
   * Get resolver statistics
   */
  getStats: () => ({
    totalActions: Object.keys(CHAT_ACTION_MAP).length,
    availableActions: getAvailableChatActionPaths(),
  }),
  
  /**
   * Test action resolution
   */
  testResolve: (actionPath: string) => {
    const action = resolveChatAction(actionPath);
    return {
      path: actionPath,
      resolved: !!action,
      functionName: action?.name || 'anonymous',
    };
  },
  
  /**
   * Validate all registered actions
   */
  validateAll: () => {
    const results = getAvailableChatActionPaths().map(path => {
      const action = resolveChatAction(path);
      return {
        path,
        valid: typeof action === 'function',
        functionName: action?.name || 'anonymous',
      };
    });
    
    return {
      allValid: results.every(r => r.valid),
      results,
    };
  },
};