/**
 * @fileOverview Advanced Filters Component
 * 
 * Comprehensive filtering and search component with advanced interaction patterns,
 * keyboard shortcuts, accessibility features, and real-time filtering capabilities.
 * 
 * Features:
 * - Multi-type filter support (text, number, date, select, boolean, range)
 * - Real-time search with debouncing
 * - Keyboard shortcuts and accessibility
 * - Filter persistence and presets
 * - Advanced filter operators and combinations
 * - Export filtered results
 * 
 * @created 2024-08-04
 * @version 1.0.0
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Filter, 
  Search, 
  X, 
  Plus, 
  Download, 
  Save, 
  RotateCcw,
  Settings,
  Keyboard,
  Eye,
  EyeOff
} from 'lucide-react';

// Hooks and utilities
import { useAdvancedFiltering, useKeyboardShortcuts } from '../hooks/use-advanced-interactions';
import { useAccessibility } from '../hooks/use-advanced-interactions';
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';

// Types
import type { 
  AdvancedFilterConfig,
  FilterType,
  AppliedFilter,
  KeyboardShortcut,
  BaseAdvancedUIProps 
} from '../types/ui-types';

// =============================================================================
// Logger Setup
// =============================================================================

const logger = createTickerLogger('ADVANCED_FILTERS', TICKER_PAGES.ADVANCED_UI);

// =============================================================================
// Component Props
// =============================================================================

interface AdvancedFiltersProps<T = any> extends BaseAdvancedUIProps {
  /** Filter configuration */
  config: AdvancedFilterConfig;
  /** Data to filter */
  data: T[];
  /** Component title */
  title?: string;
  /** Component description */
  description?: string;
  /** Enable filter presets */
  enablePresets?: boolean;
  /** Enable export functionality */
  enableExport?: boolean;
  /** Maximum visible filters */
  maxVisibleFilters?: number;
  /** Filtered data callback */
  onFilteredData?: (filteredData: T[]) => void;
  /** Filter change callback */
  onFiltersChange?: (filters: AppliedFilter[]) => void;
}

// =============================================================================
// Filter Operator Options
// =============================================================================

const operatorOptions = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'gt', label: 'Greater than' },
    { value: 'lt', label: 'Less than' },
    { value: 'gte', label: 'Greater or equal' },
    { value: 'lte', label: 'Less or equal' },
    { value: 'between', label: 'Between' },
  ],
  date: [
    { value: 'equals', label: 'On' },
    { value: 'gt', label: 'After' },
    { value: 'lt', label: 'Before' },
    { value: 'between', label: 'Between' },
  ],
  select: [
    { value: 'equals', label: 'Is' },
  ],
  boolean: [
    { value: 'equals', label: 'Is' },
  ],
  range: [
    { value: 'between', label: 'Between' },
  ],
};

// =============================================================================
// Filter Row Component
// =============================================================================

interface FilterRowProps {
  filter: AppliedFilter;
  filterType: FilterType;
  onUpdate: (filter: AppliedFilter) => void;
  onRemove: (filterId: string) => void;
}

function FilterRow({ filter, filterType, onUpdate, onRemove }: FilterRowProps) {
  const operators = operatorOptions[filterType.type] || [];

  const handleValueChange = useCallback((value: any) => {
    onUpdate({ ...filter, value });
  }, [filter, onUpdate]);

  const handleOperatorChange = useCallback((operator: string) => {
    onUpdate({ ...filter, operator: operator as any });
  }, [filter, onUpdate]);

  const handleAdditionalValueChange = useCallback((additionalValue: any) => {
    onUpdate({ ...filter, additionalValue });
  }, [filter, onUpdate]);

  const renderValueInput = () => {
    switch (filterType.type) {
      case 'text':
        return (
          <Input
            value={filter.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={`Enter ${filterType.name.toLowerCase()}`}
            className="text-sm"
          />
        );

      case 'number':
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              value={filter.value || ''}
              onChange={(e) => handleValueChange(parseFloat(e.target.value) || '')}
              placeholder="Value"
              className="text-sm"
            />
            {filter.operator === 'between' && (
              <Input
                type="number"
                value={filter.additionalValue || ''}
                onChange={(e) => handleAdditionalValueChange(parseFloat(e.target.value) || '')}
                placeholder="To"
                className="text-sm"
              />
            )}
          </div>
        );

      case 'date':
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              value={filter.value || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              className="text-sm"
            />
            {filter.operator === 'between' && (
              <Input
                type="date"
                value={filter.additionalValue || ''}
                onChange={(e) => handleAdditionalValueChange(e.target.value)}
                className="text-sm"
              />
            )}
          </div>
        );

      case 'select':
        return (
          <Select value={filter.value || ''} onValueChange={handleValueChange}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {(filterType.options || []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <Select value={filter.value?.toString() || ''} onValueChange={(value) => handleValueChange(value === 'true')}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            value={filter.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Enter value"
            className="text-sm"
          />
        );
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg">
      <Badge variant="outline" className="text-xs shrink-0">
        {filterType.name}
      </Badge>

      <Select value={filter.operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-32 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1">
        {renderValueInput()}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(filter.filterId)}
        aria-label={`Remove ${filterType.name} filter`}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// =============================================================================
// Filter Presets Component
// =============================================================================

interface FilterPresetsProps {
  presets: Array<{ id: string; name: string; filters: AppliedFilter[] }>;
  onApplyPreset: (filters: AppliedFilter[]) => void;
  onSavePreset: (name: string, filters: AppliedFilter[]) => void;
  currentFilters: AppliedFilter[];
}

function FilterPresets({ presets, onApplyPreset, onSavePreset, currentFilters }: FilterPresetsProps) {
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  const handleSavePreset = useCallback(() => {
    if (newPresetName.trim() && currentFilters.length > 0) {
      onSavePreset(newPresetName.trim(), currentFilters);
      setNewPresetName('');
      setShowSavePreset(false);
    }
  }, [newPresetName, currentFilters, onSavePreset]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Filter Presets</Label>
        <Popover open={showSavePreset} onOpenChange={setShowSavePreset}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" disabled={currentFilters.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              Save Preset
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div>
                <Label htmlFor="preset-name" className="text-sm">Preset Name</Label>
                <Input
                  id="preset-name"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Enter preset name"
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSavePreset} disabled={!newPresetName.trim()}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowSavePreset(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {presets.length > 0 ? (
        <ScrollArea className="h-32">
          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50"
                onClick={() => onApplyPreset(preset.filters)}
              >
                <div>
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {preset.filters.length} filter{preset.filters.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {preset.filters.length}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-4 text-muted-foreground text-sm">
          No saved presets
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function AdvancedFilters<T = any>({
  config,
  data,
  title = 'Advanced Filters',
  description = 'Filter and search data with advanced criteria',
  enablePresets = true,
  enableExport = true,
  maxVisibleFilters = 5,
  onFilteredData,
  onFiltersChange,
  className = '',
  accessibility,
  onError,
  loading = false,
  disabled = false,
  ...props
}: AdvancedFiltersProps<T>) {
  // State management
  const [filterPresets, setFilterPresets] = useState<Array<{ id: string; name: string; filters: AppliedFilter[] }>>([]);
  const [showAllFilters, setShowAllFilters] = useState(false);

  // Accessibility setup
  const accessibilityConfig = accessibility || {
    enableScreenReader: true,
    enableKeyboardNavigation: true,
    focusManagement: {
      autoFocus: false,
      focusTrap: false,
      restoreFocus: false,
      skipLinks: []
    },
    ariaLabels: {
      filters: 'Advanced filters',
      search: 'Search input',
      filterList: 'Applied filters list',
      addFilter: 'Add new filter'
    }
  };

  const { announceToScreenReader, ariaLabels } = useAccessibility(accessibilityConfig);

  // Advanced filtering hook
  const {
    filteredData,
    searchQuery,
    updateSearchQuery,
    searchInputRef,
    focusSearch,
    appliedFilters,
    addFilter,
    removeFilter,
    clearAllFilters,
    isLoading,
    statistics,
    hasActiveFilters,
    availableFilterTypes
  } = useAdvancedFiltering(data, config);

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    {
      id: 'focus-search',
      keys: ['ctrl', 'f'],
      description: 'Focus search input',
      action: focusSearch,
      category: 'navigation'
    },
    {
      id: 'clear-filters',
      keys: ['ctrl', 'shift', 'x'],
      description: 'Clear all filters',
      action: clearAllFilters,
      category: 'editing'
    },
    {
      id: 'toggle-filters',
      keys: ['ctrl', 'shift', 'f'],
      description: 'Toggle filter visibility',
      action: () => setShowAllFilters(prev => !prev),
      category: 'view'
    }
  ], [focusSearch, clearAllFilters]);

  useKeyboardShortcuts(shortcuts);

  // Add new filter
  const handleAddFilter = useCallback((filterTypeId: string) => {
    const filterType = availableFilterTypes.find(type => type.id === filterTypeId);
    if (!filterType) return;

    const defaultOperator = operatorOptions[filterType.type]?.[0]?.value || 'equals';
    
    const newFilter: AppliedFilter = {
      filterId: filterTypeId,
      value: filterType.defaultValue || '',
      operator: defaultOperator as any
    };

    addFilter(newFilter);
    announceToScreenReader(`${filterType.name} filter added`);
    logger.debug('Filter added:', { filterTypeId, operator: defaultOperator });
  }, [availableFilterTypes, addFilter, announceToScreenReader]);

  // Update filter
  const handleUpdateFilter = useCallback((updatedFilter: AppliedFilter) => {
    removeFilter(updatedFilter.filterId);
    addFilter(updatedFilter);
    
    const filterType = availableFilterTypes.find(type => type.id === updatedFilter.filterId);
    announceToScreenReader(`${filterType?.name || 'Filter'} updated`);
  }, [removeFilter, addFilter, availableFilterTypes, announceToScreenReader]);

  // Remove filter
  const handleRemoveFilter = useCallback((filterId: string) => {
    const filterType = availableFilterTypes.find(type => type.id === filterId);
    removeFilter(filterId);
    announceToScreenReader(`${filterType?.name || 'Filter'} removed`);
  }, [removeFilter, availableFilterTypes, announceToScreenReader]);

  // Save preset
  const handleSavePreset = useCallback((name: string, filters: AppliedFilter[]) => {
    const preset = {
      id: `preset-${Date.now()}`,
      name,
      filters: [...filters]
    };
    
    setFilterPresets(prev => [...prev, preset]);
    announceToScreenReader(`Filter preset "${name}" saved`);
    logger.info('Filter preset saved:', { presetName: name, filtersCount: filters.length });
  }, [announceToScreenReader]);

  // Apply preset
  const handleApplyPreset = useCallback((filters: AppliedFilter[]) => {
    clearAllFilters();
    filters.forEach(filter => addFilter(filter));
    announceToScreenReader(`Filter preset applied with ${filters.length} filters`);
    logger.info('Filter preset applied:', { filtersCount: filters.length });
  }, [clearAllFilters, addFilter, announceToScreenReader]);

  // Export filtered data
  const handleExportData = useCallback(() => {
    if (!enableExport) return;

    const csvContent = convertToCSV(filteredData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `filtered_data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    announceToScreenReader(`Exported ${filteredData.length} filtered records`);
    logger.info('Filtered data exported:', { recordsCount: filteredData.length });
  }, [enableExport, filteredData, announceToScreenReader]);

  // Update callbacks
  React.useEffect(() => {
    onFilteredData?.(filteredData);
  }, [filteredData, onFilteredData]);

  React.useEffect(() => {
    onFiltersChange?.(appliedFilters);
  }, [appliedFilters, onFiltersChange]);

  // Visible filters
  const visibleFilters = showAllFilters ? appliedFilters : appliedFilters.slice(0, maxVisibleFilters);
  const hiddenFiltersCount = appliedFilters.length - visibleFilters.length;

  return (
    <Card className={`w-full ${className}`} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          
          {/* Header actions */}
          <div className="flex items-center gap-2">
            {enableExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={filteredData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => updateSearchQuery(e.target.value)}
            placeholder={config.searchPlaceholder || 'Search...'}
            className="pl-10"
            aria-label={ariaLabels.search}
          />
        </div>

        {/* Statistics */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{statistics.filteredItems.toLocaleString()} of {statistics.totalItems.toLocaleString()} items</span>
          {statistics.reductionPercentage > 0 && (
            <span>({statistics.reductionPercentage}% filtered)</span>
          )}
          {statistics.activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {statistics.activeFiltersCount} filter{statistics.activeFiltersCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="filters" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="filters">Active Filters</TabsTrigger>
            {enablePresets && <TabsTrigger value="presets">Presets</TabsTrigger>}
            <TabsTrigger value="add">Add Filter</TabsTrigger>
          </TabsList>

          {/* Active Filters Tab */}
          <TabsContent value="filters" className="mt-4">
            <div 
              className="space-y-3"
              role="region"
              aria-label={ariaLabels.filterList}
            >
              {visibleFilters.length > 0 ? (
                <>
                  {visibleFilters.map((filter) => {
                    const filterType = availableFilterTypes.find(type => type.id === filter.filterId);
                    if (!filterType) return null;

                    return (
                      <FilterRow
                        key={`${filter.filterId}-${filter.operator}-${filter.value}`}
                        filter={filter}
                        filterType={filterType}
                        onUpdate={handleUpdateFilter}
                        onRemove={handleRemoveFilter}
                      />
                    );
                  })}
                  
                  {hiddenFiltersCount > 0 && (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">
                        {hiddenFiltersCount} more filter{hiddenFiltersCount !== 1 ? 's' : ''} hidden
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllFilters(!showAllFilters)}
                      >
                        {showAllFilters ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {showAllFilters ? 'Show Less' : 'Show All'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Active Filters</h3>
                  <p>Add filters to narrow down your data.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Presets Tab */}
          {enablePresets && (
            <TabsContent value="presets" className="mt-4">
              <FilterPresets
                presets={filterPresets}
                onApplyPreset={handleApplyPreset}
                onSavePreset={handleSavePreset}
                currentFilters={appliedFilters}
              />
            </TabsContent>
          )}

          {/* Add Filter Tab */}
          <TabsContent value="add" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Available Filters</Label>
                <div className="grid gap-2">
                  {availableFilterTypes.map((filterType) => {
                    const isAlreadyApplied = appliedFilters.some(f => f.filterId === filterType.id);
                    
                    return (
                      <Button
                        key={filterType.id}
                        variant="outline"
                        className="justify-start"
                        onClick={() => handleAddFilter(filterType.id)}
                        disabled={isAlreadyApplied}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{filterType.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {filterType.type} filter
                          </div>
                        </div>
                        {isAlreadyApplied && (
                          <Badge variant="secondary" className="text-xs">
                            Applied
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-3 block">Keyboard Shortcuts</Label>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Focus search</span>
                    <Badge variant="outline" className="text-xs">Ctrl + F</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Clear all filters</span>
                    <Badge variant="outline" className="text-xs">Ctrl + Shift + X</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Toggle filter view</span>
                    <Badge variant="outline" className="text-xs">Ctrl + Shift + F</Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Convert data array to CSV format
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      // Escape quotes and wrap in quotes if contains comma or quote
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value?.toString() || '';
    })
  );

  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
}

// =============================================================================
// Default Export
// =============================================================================

export default AdvancedFilters;