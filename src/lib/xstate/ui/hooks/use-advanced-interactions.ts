/**
 * @fileOverview Advanced Interaction Hooks for UI Components
 * 
 * React hooks providing advanced interaction patterns including drag-and-drop,
 * keyboard shortcuts, filtering, accessibility features, and collaborative tools.
 * 
 * Features:
 * - Drag-and-drop functionality with @dnd-kit integration
 * - Advanced filtering and search capabilities
 * - Keyboard shortcuts and accessibility support
 * - Real-time collaboration features
 * - Focus management and ARIA support
 * - Touch and gesture support for mobile devices
 * 
 * @created 2024-08-04
 * @version 1.0.0
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  Active,
  Over
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';

import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';

// Type Imports
import type {
  AdvancedFilterConfig,
  FilterType,
  AppliedFilter,
  KeyboardShortcut,
  AccessibilityConfig,
  WorkflowBuilderConfig,
  WorkflowInstance,
  WorkflowComponentInstance,
  WorkflowConnection
} from '../types/ui-types';

// =============================================================================
// Logger Setup
// =============================================================================

const logger = createTickerLogger('ADVANCED_INTERACTIONS', TICKER_PAGES.ADVANCED_UI);

// =============================================================================
// Drag and Drop Hook
// =============================================================================

/**
 * Advanced drag-and-drop hook with @dnd-kit integration
 */
export function useDragAndDrop<T extends { id: string }>(
  items: T[],
  options: {
    /** Strategy for sorting */
    strategy?: 'vertical' | 'horizontal' | 'grid';
    /** Enable multiple selection */
    multiSelect?: boolean;
    /** Custom collision detection */
    collisionDetection?: any;
    /** Enable keyboard support */
    enableKeyboard?: boolean;
    /** On drag start callback */
    onDragStart?: (event: DragStartEvent) => void;
    /** On drag over callback */
    onDragOver?: (event: DragOverEvent) => void;
    /** On drag end callback */
    onDragEnd?: (event: DragEndEvent) => void;
    /** Restrict movement */
    restrictToContainer?: boolean;
  } = {}
) {
  const {
    strategy = 'vertical',
    multiSelect = false,
    collisionDetection = closestCenter,
    enableKeyboard = true,
    onDragStart,
    onDragOver,
    onDragEnd,
    restrictToContainer = true
  } = options;

  const [activeItem, setActiveItem] = useState<T | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [reorderedItems, setReorderedItems] = useState<T[]>(items);

  // Sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance to start drag
      },
    }),
    ...(enableKeyboard ? [
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    ] : [])
  );

  // Update items when props change
  useEffect(() => {
    setReorderedItems(items);
  }, [items]);

  // Drag start handler
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeItem = items.find(item => item.id === active.id);
    
    if (activeItem) {
      setActiveItem(activeItem);
      
      // Handle multi-selection
      if (multiSelect) {
        if (!selectedItems.has(active.id as string)) {
          setSelectedItems(new Set([active.id as string]));
        }
      }
      
      logger.debug('Drag started:', { activeId: active.id, multiSelect });
    }
    
    onDragStart?.(event);
  }, [items, multiSelect, selectedItems, onDragStart]);

  // Drag over handler
  const handleDragOver = useCallback((event: DragOverEvent) => {
    onDragOver?.(event);
  }, [onDragOver]);

  // Drag end handler
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveItem(null);
    
    if (!over) {
      onDragEnd?.(event);
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = reorderedItems.findIndex(item => item.id === active.id);
      const newIndex = reorderedItems.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(reorderedItems, oldIndex, newIndex);
        setReorderedItems(newItems);
        
        logger.userAction('reorderItems', 'Items reordered', {
          activeId: active.id,
          overId: over.id,
          oldIndex,
          newIndex
        });
      }
    }
    
    onDragEnd?.(event);
  }, [reorderedItems, onDragEnd]);

  // Select item
  const selectItem = useCallback((itemId: string, isMultiSelect = false) => {
    if (!multiSelect && !isMultiSelect) {
      setSelectedItems(new Set([itemId]));
      return;
    }

    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  }, [multiSelect]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Get sorting strategy
  const sortingStrategy = useMemo(() => {
    switch (strategy) {
      case 'horizontal':
        return horizontalListSortingStrategy;
      case 'vertical':
      case 'grid':
      default:
        return verticalListSortingStrategy;
    }
  }, [strategy]);

  return {
    // DndContext props
    sensors,
    collisionDetection,
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
    
    // SortableContext props
    items: reorderedItems.map(item => item.id),
    strategy: sortingStrategy,
    
    // State
    activeItem,
    selectedItems,
    reorderedItems,
    
    // Actions
    selectItem,
    clearSelection,
    
    // Utils
    isSelected: (itemId: string) => selectedItems.has(itemId),
    selectedCount: selectedItems.size
  };
}

// =============================================================================
// Advanced Filtering Hook
// =============================================================================

/**
 * Advanced filtering and search hook
 */
export function useAdvancedFiltering<T>(
  data: T[],
  config: AdvancedFilterConfig
) {
  const {
    filterTypes,
    enableSearch = true,
    searchPlaceholder = 'Search...',
    enableKeyboardShortcuts = true,
    persistFilters = false
  } = config;

  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<T[]>(data);
  const [isLoading, setIsLoading] = useState(false);

  // Search input ref for focus management
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Apply filters and search
  const applyFiltersAndSearch = useCallback(() => {
    setIsLoading(true);
    
    try {
      let result = [...data];

      // Apply search query
      if (enableSearch && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        result = result.filter(item => {
          const searchableText = JSON.stringify(item).toLowerCase();
          return searchableText.includes(query);
        });
      }

      // Apply filters
      appliedFilters.forEach(filter => {
        const filterType = filterTypes.find(type => type.id === filter.filterId);
        if (!filterType) return;

        result = result.filter(item => {
          const itemValue = getNestedValue(item, filterType.id);
          return evaluateFilter(itemValue, filter);
        });
      });

      setFilteredData(result);
      
      logger.debug('Filters applied:', {
        originalCount: data.length,
        filteredCount: result.length,
        filtersCount: appliedFilters.length,
        searchQuery: searchQuery.trim()
      });
      
    } catch (error) {
      logger.error('Error applying filters:', error);
      setFilteredData(data);
    } finally {
      setIsLoading(false);
    }
  }, [data, appliedFilters, searchQuery, enableSearch, filterTypes]);

  // Update filtered data when dependencies change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [applyFiltersAndSearch]);

  // Add filter
  const addFilter = useCallback((filter: AppliedFilter) => {
    setAppliedFilters(prev => {
      // Remove existing filter for the same field
      const filtered = prev.filter(f => f.filterId !== filter.filterId);
      return [...filtered, filter];
    });
    
    logger.debug('Filter added:', filter);
  }, []);

  // Remove filter
  const removeFilter = useCallback((filterId: string) => {
    setAppliedFilters(prev => prev.filter(f => f.filterId !== filterId));
    logger.debug('Filter removed:', { filterId });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setAppliedFilters([]);
    setSearchQuery('');
    logger.debug('All filters cleared');
  }, []);

  // Update search query
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Focus search input
  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + F to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        focusSearch();
      }
      
      // Escape to clear search
      if (event.key === 'Escape' && searchInputRef.current === document.activeElement) {
        setSearchQuery('');
        searchInputRef.current.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, focusSearch]);

  // Persist filters to localStorage
  useEffect(() => {
    if (!persistFilters) return;

    const key = 'advanced_filters';
    const filterData = {
      appliedFilters,
      searchQuery
    };
    
    localStorage.setItem(key, JSON.stringify(filterData));
  }, [appliedFilters, searchQuery, persistFilters]);

  // Load persisted filters
  useEffect(() => {
    if (!persistFilters) return;

    const key = 'advanced_filters';
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        const { appliedFilters: storedFilters, searchQuery: storedQuery } = JSON.parse(stored);
        setAppliedFilters(storedFilters || []);
        setSearchQuery(storedQuery || '');
      } catch (error) {
        logger.warn('Failed to load persisted filters:', error);
      }
    }
  }, [persistFilters]);

  // Filter statistics
  const statistics = useMemo(() => {
    return {
      totalItems: data.length,
      filteredItems: filteredData.length,
      activeFiltersCount: appliedFilters.length,
      hasSearch: Boolean(searchQuery.trim()),
      reductionPercentage: data.length > 0 
        ? Math.round((1 - filteredData.length / data.length) * 100)
        : 0
    };
  }, [data.length, filteredData.length, appliedFilters.length, searchQuery]);

  return {
    // Data
    filteredData,
    originalData: data,
    
    // Search
    searchQuery,
    updateSearchQuery,
    searchInputRef,
    focusSearch,
    
    // Filters
    appliedFilters,
    addFilter,
    removeFilter,
    clearAllFilters,
    
    // State
    isLoading,
    statistics,
    
    // Utils
    hasActiveFilters: appliedFilters.length > 0 || Boolean(searchQuery.trim()),
    availableFilterTypes: filterTypes
  };
}

// =============================================================================
// Keyboard Shortcuts Hook
// =============================================================================

/**
 * Comprehensive keyboard shortcuts management hook
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [isEnabled, setIsEnabled] = useState(true);

  // Track pressed keys
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      
      setPressedKeys(prev => new Set([...prev, key]));
      
      // Check for matching shortcuts
      for (const shortcut of shortcuts) {
        const shortcutKeys = shortcut.keys.map(k => k.toLowerCase());
        const modifierKeys = ['ctrl', 'alt', 'shift', 'meta'];
        
        // Check if all required keys are pressed
        const allKeysPressed = shortcutKeys.every(key => {
          if (modifierKeys.includes(key)) {
            switch (key) {
              case 'ctrl':
                return event.ctrlKey;
              case 'alt':
                return event.altKey;
              case 'shift':
                return event.shiftKey;
              case 'meta':
                return event.metaKey;
              default:
                return false;
            }
          } else {
            return pressedKeys.has(key) || event.key.toLowerCase() === key;
          }
        });

        if (allKeysPressed) {
          event.preventDefault();
          shortcut.action();
          
          logger.debug('Keyboard shortcut executed:', {
            shortcutId: shortcut.id,
            keys: shortcut.keys,
            description: shortcut.description
          });
          
          break;
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    };

    // Clear pressed keys when window loses focus
    const handleBlur = () => {
      setPressedKeys(new Set());
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [shortcuts, pressedKeys, isEnabled]);

  return {
    pressedKeys,
    isEnabled,
    enableShortcuts: () => setIsEnabled(true),
    disableShortcuts: () => setIsEnabled(false),
    shortcuts
  };
}

// =============================================================================
// Accessibility Hook
// =============================================================================

/**
 * Comprehensive accessibility management hook
 */
export function useAccessibility(config: AccessibilityConfig) {
  const {
    enableScreenReader,
    enableKeyboardNavigation,
    enableHighContrast,
    focusManagement,
    ariaLabels
  } = config;

  const [focusVisible, setFocusVisible] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const focusHistoryRef = useRef<HTMLElement[]>([]);

  // Focus management
  const manageFocus = useCallback((element: HTMLElement | null, options?: {
    preventScroll?: boolean;
    restoreOnUnmount?: boolean;
  }) => {
    if (!element || !enableKeyboardNavigation) return;

    const { preventScroll = false, restoreOnUnmount = false } = options || {};

    // Store current focus for restoration
    if (restoreOnUnmount && document.activeElement instanceof HTMLElement) {
      focusHistoryRef.current.push(document.activeElement);
    }

    // Focus the element
    element.focus({ preventScroll });
    
    logger.debug('Focus managed:', {
      elementTag: element.tagName,
      elementId: element.id,
      preventScroll,
      restoreOnUnmount
    });
  }, [enableKeyboardNavigation]);

  // Restore previous focus
  const restoreFocus = useCallback(() => {
    if (!focusManagement.restoreFocus) return;

    const previousElement = focusHistoryRef.current.pop();
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus();
      logger.debug('Focus restored to previous element');
    }
  }, [focusManagement.restoreFocus]);

  // Announce to screen reader
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!enableScreenReader) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);

    logger.debug('Screen reader announcement:', { message, priority });
  }, [enableScreenReader]);

  // Toggle high contrast mode
  const toggleHighContrast = useCallback(() => {
    if (!enableHighContrast) return;

    setHighContrastMode(prev => {
      const newMode = !prev;
      
      // Apply high contrast styles
      if (newMode) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
      
      announceToScreenReader(
        newMode ? 'High contrast mode enabled' : 'High contrast mode disabled'
      );
      
      return newMode;
    });
  }, [enableHighContrast, announceToScreenReader]);

  // Keyboard navigation handler
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Show focus indicators when using keyboard
      if (event.key === 'Tab') {
        setFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      // Hide focus indicators when using mouse
      setFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [enableKeyboardNavigation]);

  // Apply focus visible class
  useEffect(() => {
    if (focusVisible) {
      document.body.classList.add('focus-visible');
    } else {
      document.body.classList.remove('focus-visible');
    }
  }, [focusVisible]);

  return {
    // State
    focusVisible,
    highContrastMode,
    
    // Actions
    manageFocus,
    restoreFocus,
    announceToScreenReader,
    toggleHighContrast,
    
    // Utilities
    ariaLabels,
    isScreenReaderEnabled: enableScreenReader,
    isKeyboardNavigationEnabled: enableKeyboardNavigation
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Evaluate filter condition
 */
function evaluateFilter(value: any, filter: AppliedFilter): boolean {
  const { operator, value: filterValue, additionalValue } = filter;

  switch (operator) {
    case 'equals':
      return value === filterValue;
    case 'contains':
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    case 'gt':
      return Number(value) > Number(filterValue);
    case 'lt':
      return Number(value) < Number(filterValue);
    case 'gte':
      return Number(value) >= Number(filterValue);
    case 'lte':
      return Number(value) <= Number(filterValue);
    case 'between':
      const numValue = Number(value);
      const min = Number(filterValue);
      const max = Number(additionalValue);
      return numValue >= min && numValue <= max;
    default:
      return true;
  }
}

// =============================================================================
// Exports
// =============================================================================

export type {
  AdvancedFilterConfig,
  FilterType,
  AppliedFilter,
  KeyboardShortcut,
  AccessibilityConfig
};