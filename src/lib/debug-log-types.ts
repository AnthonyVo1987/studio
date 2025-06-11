
/**
 * @fileOverview Defines types and enums for debug logging categories.
 */

export enum DebugLogCategory {
  UI_COMPONENT_STATE = 'UI_COMPONENT_STATE',
  UI_DATA_RECEPTION = 'UI_DATA_RECEPTION',
  UI_DATA_PARSING = 'UI_DATA_PARSING',
  CONTEXT_INTERNALS = 'CONTEXT_INTERNALS',
  ACTION_LIFECYCLE = 'ACTION_LIFECYCLE',
  NATIVE_CONSOLE = 'NATIVE_CONSOLE', // New category for generic console logs
  // Add new categories here as needed
}

export type DebugLogConfig = Record<DebugLogCategory, boolean>;

export const defaultDebugLogConfig: DebugLogConfig = {
  [DebugLogCategory.UI_COMPONENT_STATE]: false, // Default to false to start clean
  [DebugLogCategory.UI_DATA_RECEPTION]: false,
  [DebugLogCategory.UI_DATA_PARSING]: false,
  [DebugLogCategory.CONTEXT_INTERNALS]: false,
  [DebugLogCategory.ACTION_LIFECYCLE]: false,
  [DebugLogCategory.NATIVE_CONSOLE]: false, 
};

export const debugLogCategoryLabels: Record<DebugLogCategory, string> = {
  [DebugLogCategory.UI_COMPONENT_STATE]: 'UI Component State',
  [DebugLogCategory.UI_DATA_RECEPTION]: 'UI Data Reception',
  [DebugLogCategory.UI_DATA_PARSING]: 'UI Data Parsing',
  [DebugLogCategory.CONTEXT_INTERNALS]: 'Context Internals',
  [DebugLogCategory.ACTION_LIFECYCLE]: 'Action Lifecycle Events',
  [DebugLogCategory.NATIVE_CONSOLE]: 'Native Console Logs (General)',
};
