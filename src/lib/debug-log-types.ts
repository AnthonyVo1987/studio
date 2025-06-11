
/**
 * @fileOverview Defines types and enums for debug logging categories.
 */

export enum DebugLogCategory {
  UI_COMPONENT_STATE = 'UI_COMPONENT_STATE',
  UI_DATA_RECEPTION = 'UI_DATA_RECEPTION',
  UI_DATA_PARSING = 'UI_DATA_PARSING',
  CONTEXT_INTERNALS = 'CONTEXT_INTERNALS',
  ACTION_LIFECYCLE = 'ACTION_LIFECYCLE',
  // Add new categories here as needed
}

export type DebugLogConfig = Record<DebugLogCategory, boolean>;

export const defaultDebugLogConfig: DebugLogConfig = {
  [DebugLogCategory.UI_COMPONENT_STATE]: true,
  [DebugLogCategory.UI_DATA_RECEPTION]: true,
  [DebugLogCategory.UI_DATA_PARSING]: true,
  [DebugLogCategory.CONTEXT_INTERNALS]: true,
  [DebugLogCategory.ACTION_LIFECYCLE]: true,
};

export const debugLogCategoryLabels: Record<DebugLogCategory, string> = {
  [DebugLogCategory.UI_COMPONENT_STATE]: 'UI Component State',
  [DebugLogCategory.UI_DATA_RECEPTION]: 'UI Data Reception',
  [DebugLogCategory.UI_DATA_PARSING]: 'UI Data Parsing',
  [DebugLogCategory.CONTEXT_INTERNALS]: 'Context Internals',
  [DebugLogCategory.ACTION_LIFECYCLE]: 'Action Lifecycle Events',
};
