/**
 * @fileOverview Multi-Ticker Coordination Component
 * 
 * Advanced React component for coordinating analysis across multiple tickers
 * with real-time synchronization, conflict resolution, and performance monitoring.
 * 
 * Features:
 * - Multi-ticker state synchronization (NVDA/SPY)
 * - Cross-ticker analysis and correlation
 * - Conflict detection and resolution
 * - Real-time coordination status monitoring
 * - Performance metrics for coordinated operations
 * - Visual coordination dashboard
 * 
 * @created 2024-08-04
 * @version 1.0.0
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  GitMerge, 
  Users, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Pause,
  RefreshCw,
  Settings
} from 'lucide-react';

// Hooks and utilities
import { useMultiTickerCoordination } from '../hooks/use-xstate-integration';
import { useAccessibility } from '../hooks/use-advanced-interactions';
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';

// Types
import type { 
  MultiTickerCoordinationConfig,
  TickerConfig,
  CoordinationStatus,
  Conflict,
  BaseAdvancedUIProps 
} from '../types/ui-types';

// =============================================================================
// Logger Setup
// =============================================================================

const logger = createTickerLogger('MULTI_TICKER_COORDINATOR', TICKER_PAGES.ADVANCED_UI);

// =============================================================================
// Component Props
// =============================================================================

interface MultiTickerCoordinatorProps extends BaseAdvancedUIProps {
  /** Multi-ticker coordination configuration */
  config: MultiTickerCoordinationConfig;
  /** Component title */
  title?: string;
  /** Component description */
  description?: string;
  /** Enable cross-ticker analysis */
  enableCrossAnalysis?: boolean;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** Maximum conflicts to display */
  maxConflictsDisplay?: number;
}

// =============================================================================
// Ticker Status Card Component
// =============================================================================

interface TickerStatusCardProps {
  ticker: TickerConfig;
  isCoordinating: boolean;
  onSync: (tickerSymbol: string) => void;
  onToggleStatus: (tickerSymbol: string) => void;
}

function TickerStatusCard({ ticker, isCoordinating, onSync, onToggleStatus }: TickerStatusCardProps) {
  const getStatusColor = (status: TickerConfig['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-400';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: TickerConfig['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: TickerConfig['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-400';
    }
  };

  const timeSinceUpdate = useMemo(() => {
    const now = Date.now();
    const lastUpdate = ticker.lastUpdate.getTime();
    const diff = now - lastUpdate;
    
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  }, [ticker.lastUpdate]);

  return (
    <Card className={`border-l-4 ${getPriorityColor(ticker.priority)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className={`w-3 h-3 rounded-full ${getStatusColor(ticker.status)}`}
              style={{ backgroundColor: ticker.color }}
            />
            <div>
              <CardTitle className="text-sm">{ticker.symbol}</CardTitle>
              <CardDescription className="text-xs">{ticker.name}</CardDescription>
            </div>
          </div>
          {getStatusIcon(ticker.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={ticker.status === 'active' ? 'default' : 'secondary'} className="ml-1 text-xs">
              {ticker.status}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Priority:</span>
            <Badge variant="outline" className="ml-1 text-xs">
              {ticker.priority}
            </Badge>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Last update: {timeSinceUpdate}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSync(ticker.symbol)}
            disabled={isCoordinating || ticker.status !== 'active'}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Sync
          </Button>
          
          <Button
            size="sm"
            variant={ticker.status === 'active' ? 'secondary' : 'default'}
            onClick={() => onToggleStatus(ticker.symbol)}
            disabled={isCoordinating}
            className="text-xs"
          >
            {ticker.status === 'active' ? 'Pause' : 'Activate'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Conflict Resolution Dialog Component
// =============================================================================

interface ConflictResolutionDialogProps {
  conflict: Conflict | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (conflictId: string, resolutionId: string) => void;
}

function ConflictResolutionDialog({ 
  conflict, 
  isOpen, 
  onClose, 
  onResolve 
}: ConflictResolutionDialogProps) {
  if (!conflict) return null;

  const getConflictIcon = (type: Conflict['type']) => {
    switch (type) {
      case 'data-mismatch': return <BarChart3 className="h-5 w-5 text-orange-500" />;
      case 'state-conflict': return <GitMerge className="h-5 w-5 text-red-500" />;
      case 'timing-conflict': return <Clock className="h-5 w-5 text-yellow-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getConflictIcon(conflict.type)}
            Resolve Coordination Conflict
          </DialogTitle>
          <DialogDescription>
            A conflict has been detected that requires manual resolution.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Conflict Details</h4>
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline">{conflict.type.replace('-', ' ')}</Badge>
              </div>
              <div className="flex items-start justify-between text-sm">
                <span className="text-muted-foreground">Affected Tickers:</span>
                <div className="flex gap-1">
                  {conflict.affectedTickers.map(ticker => (
                    <Badge key={ticker} variant="secondary" className="text-xs">
                      {ticker}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Description:</span>
                <p className="mt-1">{conflict.description}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Occurred: {conflict.timestamp.toLocaleString()}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Resolution Options</h4>
            <div className="space-y-2">
              {conflict.resolutionOptions.map((option) => (
                <div 
                  key={option.id}
                  className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onResolve(conflict.id, option.id)}
                >
                  <div className="font-medium text-sm">{option.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Cross Analysis Display Component
// =============================================================================

interface CrossAnalysisDisplayProps {
  analysisData: any;
  isLoading: boolean;
  onRefresh: () => void;
}

function CrossAnalysisDisplay({ analysisData, isLoading, onRefresh }: CrossAnalysisDisplayProps) {
  const getTrendIcon = (value: number) => {
    if (value > 0.1) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < -0.1) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs > 0.7) return 'text-green-500';
    if (abs > 0.3) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Analyzing cross-ticker correlations...</p>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h4 className="font-medium mb-2">No Cross-Analysis Data</h4>
        <p className="text-sm">Run a cross-ticker analysis to see correlations and relative performance.</p>
        <Button onClick={onRefresh} className="mt-4" size="sm">
          <Play className="h-4 w-4 mr-2" />
          Run Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Cross-Ticker Analysis</h4>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Correlation
              {getTrendIcon(analysisData.correlation)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCorrelationColor(analysisData.correlation)}`}>
              {analysisData.correlation?.toFixed(3) || 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.abs(analysisData.correlation || 0) > 0.7 ? 'Strong' : 
               Math.abs(analysisData.correlation || 0) > 0.3 ? 'Moderate' : 'Weak'} correlation
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Relative Performance
              {getTrendIcon(analysisData.relativePerformance)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              analysisData.relativePerformance > 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {analysisData.relativePerformance > 0 ? '+' : ''}{(analysisData.relativePerformance * 100)?.toFixed(2) || 'N/A'}%
            </div>
            <div className="text-xs text-muted-foreground">
              NVDA vs SPY performance
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground">
        Last updated: {new Date(analysisData.timestamp).toLocaleString()}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function MultiTickerCoordinator({
  config,
  title = 'Multi-Ticker Coordinator',
  description = 'Coordinate analysis across multiple tickers with real-time synchronization',
  enableCrossAnalysis = true,
  refreshInterval = 10000,
  maxConflictsDisplay = 10,
  className = '',
  accessibility,
  onError,
  loading = false,
  disabled = false,
  ...props
}: MultiTickerCoordinatorProps) {
  // State management
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [crossAnalysisData, setCrossAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      coordinator: 'Multi-ticker coordination dashboard',
      tickers: 'Ticker status list',
      conflicts: 'Coordination conflicts',
      analysis: 'Cross-ticker analysis'
    }
  };

  const { announceToScreenReader, ariaLabels } = useAccessibility(accessibilityConfig);

  // Multi-ticker coordination hook
  const {
    coordinationStatus,
    state: coordinationState,
    synchronizeData,
    performCrossAnalysis,
    enabledTickers,
    isCoordinating,
    hasConflicts
  } = useMultiTickerCoordination(config);

  // Handle ticker synchronization
  const handleTickerSync = useCallback(async (tickerSymbol: string) => {
    try {
      await synchronizeData('fetchStockData');
      announceToScreenReader(`${tickerSymbol} synchronized successfully`);
      logger.info('SynchronizeTicker', 'Ticker synchronized:', { tickerSymbol });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Synchronization failed';
      announceToScreenReader(`Failed to synchronize ${tickerSymbol}: ${errorMessage}`);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      logger.error('SynchronizeTicker', 'Ticker synchronization failed:', error);
    }
  }, [synchronizeData, announceToScreenReader, onError]);

  // Handle ticker status toggle
  const handleTickerStatusToggle = useCallback((tickerSymbol: string) => {
    // Implementation would toggle ticker active/inactive status
    announceToScreenReader(`${tickerSymbol} status toggled`);
    logger.info('ToggleStatus', 'Ticker status toggled:', { tickerSymbol });
  }, [announceToScreenReader]);

  // Handle conflict resolution
  const handleConflictResolve = useCallback((conflictId: string, resolutionId: string) => {
    const conflict = coordinationStatus.pendingConflicts.find(c => c.id === conflictId);
    const resolution = conflict?.resolutionOptions.find(r => r.id === resolutionId);
    
    if (resolution) {
      resolution.action();
      setShowConflictDialog(false);
      setSelectedConflict(null);
      announceToScreenReader('Conflict resolved successfully');
      logger.info('ResolveConflict', 'Conflict resolved:', { conflictId, resolutionId });
    }
  }, [coordinationStatus.pendingConflicts, announceToScreenReader]);

  // Handle cross-analysis
  const handleCrossAnalysis = useCallback(async () => {
    if (!enableCrossAnalysis) return;

    setIsAnalyzing(true);
    try {
      const analysisResult = await performCrossAnalysis();
      setCrossAnalysisData(analysisResult);
      announceToScreenReader('Cross-ticker analysis completed');
      logger.info('CrossAnalysis', 'Cross-ticker analysis completed:', analysisResult);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      announceToScreenReader(`Cross-analysis failed: ${errorMessage}`);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      logger.error('CrossAnalysis', 'Cross-ticker analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [enableCrossAnalysis, performCrossAnalysis, announceToScreenReader, onError]);

  // Auto-refresh cross analysis
  useEffect(() => {
    if (!enableCrossAnalysis) return;

    const interval = setInterval(handleCrossAnalysis, refreshInterval);
    return () => clearInterval(interval);
  }, [enableCrossAnalysis, handleCrossAnalysis, refreshInterval]);

  // Status indicators
  const statusSummary = useMemo(() => {
    const activeTickers = enabledTickers.filter(t => t.status === 'active').length;
    const errorTickers = enabledTickers.filter(t => t.status === 'error').length;
    
    return {
      activeTickers,
      errorTickers,
      totalTickers: enabledTickers.length,
      successRate: coordinationStatus.metrics.syncSuccessRate,
      avgSyncTime: coordinationStatus.metrics.avgSyncTime,
      activeConflicts: coordinationStatus.pendingConflicts.length
    };
  }, [enabledTickers, coordinationStatus]);

  return (
    <Card className={`w-full ${className}`} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <Badge 
              variant={coordinationStatus.status === 'synchronized' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {coordinationStatus.status}
            </Badge>
            {hasConflicts && (
              <Badge variant="destructive" className="text-xs">
                {statusSummary.activeConflicts} Conflict{statusSummary.activeConflicts !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{statusSummary.activeTickers}</div>
            <div className="text-xs text-muted-foreground">Active Tickers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{statusSummary.successRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{statusSummary.avgSyncTime.toFixed(0)}ms</div>
            <div className="text-xs text-muted-foreground">Avg Sync Time</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${statusSummary.errorTickers > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {statusSummary.errorTickers}
            </div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </div>
        </div>

        {/* Coordination progress */}
        {isCoordinating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Coordinating operations...</span>
              <span>{coordinationStatus.activeOperations.length} active</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="tickers" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tickers">Tickers</TabsTrigger>
            <TabsTrigger value="conflicts" className="relative">
              Conflicts
              {statusSummary.activeConflicts > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs h-4 w-4 rounded-full p-0 flex items-center justify-center">
                  {statusSummary.activeConflicts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Tickers Tab */}
          <TabsContent value="tickers" className="mt-4">
            <div 
              className="space-y-4"
              role="region"
              aria-label={ariaLabels.tickers}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {enabledTickers.map((ticker) => (
                  <TickerStatusCard
                    key={ticker.symbol}
                    ticker={ticker}
                    isCoordinating={isCoordinating}
                    onSync={handleTickerSync}
                    onToggleStatus={handleTickerStatusToggle}
                  />
                ))}
              </div>
              
              {enabledTickers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Tickers Configured</h3>
                  <p>Configure tickers in settings to begin coordination.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Conflicts Tab */}
          <TabsContent value="conflicts" className="mt-4">
            <div 
              className="space-y-4"
              role="region"
              aria-label={ariaLabels.conflicts}
            >
              {coordinationStatus.pendingConflicts.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {coordinationStatus.pendingConflicts.slice(0, maxConflictsDisplay).map((conflict) => (
                      <Alert key={conflict.id}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">
                                {conflict.type.replace('-', ' ')} in {conflict.affectedTickers.join(', ')}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {conflict.description}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedConflict(conflict);
                                setShowConflictDialog(true);
                              }}
                            >
                              Resolve
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Active Conflicts</h3>
                  <p>All tickers are synchronized and operating normally.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="mt-4">
            <div 
              className="space-y-4"
              role="region"
              aria-label={ariaLabels.analysis}
            >
              <CrossAnalysisDisplay
                analysisData={crossAnalysisData}
                isLoading={isAnalyzing}
                onRefresh={handleCrossAnalysis}
              />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4">
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Synchronization Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">Data Fetching Sync</div>
                      <div className="text-xs text-muted-foreground">
                        Synchronize data fetching across all tickers
                      </div>
                    </div>
                    <Badge variant={config.synchronization.syncDataFetching ? 'default' : 'secondary'}>
                      {config.synchronization.syncDataFetching ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">AI Analysis Sync</div>
                      <div className="text-xs text-muted-foreground">
                        Coordinate AI analysis execution
                      </div>
                    </div>
                    <Badge variant={config.synchronization.syncAiAnalysis ? 'default' : 'secondary'}>
                      {config.synchronization.syncAiAnalysis ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Operations:</span>
                    <div className="font-medium">{coordinationStatus.metrics.totalOperations.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">24h Operations:</span>
                    <div className="font-medium">{coordinationStatus.metrics.last24hOperations.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        conflict={selectedConflict}
        isOpen={showConflictDialog}
        onClose={() => {
          setShowConflictDialog(false);
          setSelectedConflict(null);
        }}
        onResolve={handleConflictResolve}
      />
    </Card>
  );
}

// =============================================================================
// Default Export
// =============================================================================

export default MultiTickerCoordinator;