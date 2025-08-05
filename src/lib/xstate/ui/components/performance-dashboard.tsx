/**
 * @fileOverview Performance Dashboard Component
 * 
 * Advanced React component for real-time performance monitoring and visualization
 * using Recharts integration, alert management, and comprehensive metrics display.
 * 
 * Features:
 * - Real-time performance charts with Recharts
 * - Customizable alert thresholds and notifications
 * - Performance metrics aggregation and analysis
 * - Export functionality for performance data
 * - Responsive design with mobile support
 * - Accessibility features and keyboard navigation
 * 
 * @created 2024-08-04
 * @version 1.0.0
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Play, 
  Pause, 
  Download, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';

// Hooks and utilities
import { usePerformanceDashboard } from '../hooks/use-performance-monitor';
import { useAccessibility } from '../hooks/use-advanced-interactions';
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';

// Types
import type { 
  PerformanceDashboardConfig, 
  PerformanceChartType,
  PerformanceAlert,
  ChartDataPoint,
  BaseAdvancedUIProps 
} from '../types/ui-types';

// =============================================================================
// Logger Setup
// =============================================================================

const logger = createTickerLogger('PERFORMANCE_DASHBOARD', TICKER_PAGES.ADVANCED_UI);

// =============================================================================
// Component Props
// =============================================================================

interface PerformanceDashboardProps extends BaseAdvancedUIProps {
  /** Performance dashboard configuration */
  config: PerformanceDashboardConfig;
  /** Component title */
  title?: string;
  /** Component description */
  description?: string;
  /** Chart height */
  chartHeight?: number;
  /** Enable chart animations */
  enableAnimations?: boolean;
  /** Theme for charts */
  chartTheme?: 'light' | 'dark';
}

// =============================================================================
// Chart Theme Configuration
// =============================================================================

const chartThemes = {
  light: {
    background: '#ffffff',
    text: '#374151',
    grid: '#e5e7eb',
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444'
  },
  dark: {
    background: '#1f2937',
    text: '#f9fafb',
    grid: '#374151',
    primary: '#60a5fa',
    secondary: '#34d399',
    accent: '#fbbf24',
    danger: '#f87171'
  }
};

// =============================================================================
// Alert Component
// =============================================================================

interface AlertCardProps {
  alert: PerformanceAlert;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}

function AlertCard({ alert, onAcknowledge, onResolve }: AlertCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50';
      case 'high': return 'text-orange-500 bg-orange-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-full ${getSeverityColor(alert.threshold.severity)}`}>
              {getSeverityIcon(alert.threshold.severity)}
            </div>
            <div>
              <CardTitle className="text-sm capitalize">
                {alert.threshold.metric.replace('-', ' ')} Alert
              </CardTitle>
              <CardDescription className="text-xs">
                Triggered {alert.triggeredAt.toLocaleString()}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant={alert.status === 'active' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {alert.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-sm">
          <p>
            <strong>Current Value:</strong> {alert.currentValue.toFixed(2)}
          </p>
          <p>
            <strong>Threshold:</strong> {alert.threshold.operator} {alert.threshold.threshold}
          </p>
          <p className="text-muted-foreground mt-1">
            {alert.threshold.messageTemplate
              .replace('{metric}', alert.threshold.metric)
              .replace('{value}', alert.currentValue.toString())
              .replace('{threshold}', alert.threshold.threshold.toString())}
          </p>
        </div>

        {alert.status === 'active' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAcknowledge(alert.id)}
            >
              Acknowledge
            </Button>
            <Button
              size="sm"
              onClick={() => onResolve(alert.id)}
            >
              Resolve
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Chart Component
// =============================================================================

interface ChartComponentProps {
  data: ChartDataPoint[];
  chartType: PerformanceChartType;
  height: number;
  theme: typeof chartThemes.light;
  enableAnimations: boolean;
}

function ChartComponent({ data, chartType, height, theme, enableAnimations }: ChartComponentProps) {
  const chartData = useMemo(() => {
    return data.map(point => ({
      timestamp: point.timestamp.toLocaleTimeString(),
      value: point.value,
      label: point.label
    }));
  }, [data]);

  const getChartTitle = (type: PerformanceChartType) => {
    switch (type) {
      case 'execution-time': return 'Execution Time (ms)';
      case 'memory-usage': return 'Memory Usage (MB)';
      case 'event-frequency': return 'Events per Second';
      case 'state-transitions': return 'State Transitions';
      case 'error-rate': return 'Error Rate (%)';
      case 'throughput': return 'Operations per Second';
      default: return 'Performance Metric';
    }
  };

  const getChartColor = (type: PerformanceChartType) => {
    switch (type) {
      case 'execution-time': return theme.primary;
      case 'memory-usage': return theme.secondary;
      case 'event-frequency': return theme.accent;
      case 'state-transitions': return theme.primary;
      case 'error-rate': return theme.danger;
      case 'throughput': return theme.secondary;
      default: return theme.primary;
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No data available</p>
        </div>
      </div>
    );
  }

  // Choose chart type based on metric
  if (['execution-time', 'memory-usage', 'throughput'].includes(chartType)) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
          <XAxis 
            dataKey="timestamp" 
            stroke={theme.text}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke={theme.text}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: theme.background,
              border: `1px solid ${theme.grid}`,
              color: theme.text
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={getChartColor(chartType)}
            fill={getChartColor(chartType)}
            fillOpacity={0.3}
            animationDuration={enableAnimations ? 1000 : 0}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (['event-frequency', 'state-transitions'].includes(chartType)) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
          <XAxis 
            dataKey="timestamp" 
            stroke={theme.text}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke={theme.text}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: theme.background,
              border: `1px solid ${theme.grid}`,
              color: theme.text
            }}
          />
          <Bar
            dataKey="value"
            fill={getChartColor(chartType)}
            animationDuration={enableAnimations ? 1000 : 0}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Default to line chart
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
        <XAxis 
          dataKey="timestamp" 
          stroke={theme.text}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          stroke={theme.text}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: theme.background,
            border: `1px solid ${theme.grid}`,
            color: theme.text
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={getChartColor(chartType)}
          strokeWidth={2}
          dot={{ fill: getChartColor(chartType), strokeWidth: 2 }}
          animationDuration={enableAnimations ? 1000 : 0}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function PerformanceDashboard({
  config,
  title = 'Performance Dashboard',
  description = 'Real-time performance monitoring and analytics',
  chartHeight = 300,
  enableAnimations = true,
  chartTheme = 'light',
  className = '',
  accessibility,
  onError,
  loading = false,
  disabled = false,
  ...props
}: PerformanceDashboardProps) {
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
      dashboard: 'Performance monitoring dashboard',
      charts: 'Performance charts',
      alerts: 'Performance alerts',
      controls: 'Dashboard controls'
    }
  };

  const { announceToScreenReader, ariaLabels } = useAccessibility(accessibilityConfig);

  // Performance dashboard hook
  const {
    chartData,
    alerts,
    currentMetrics,
    isMonitoring,
    lastUpdate,
    performanceSummary,
    startMonitoring,
    stopMonitoring,
    acknowledgeAlert,
    resolveAlert,
    clearResolvedAlerts,
    exportChartData,
    getChartData,
    activeAlerts,
    resolvedAlerts,
    chartTypes,
    hasData
  } = usePerformanceDashboard(config);

  // Toggle monitoring
  const toggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      stopMonitoring();
      announceToScreenReader('Performance monitoring stopped');
    } else {
      startMonitoring();
      announceToScreenReader('Performance monitoring started');
    }
  }, [isMonitoring, startMonitoring, stopMonitoring, announceToScreenReader]);

  // Theme configuration
  const theme = chartThemes[chartTheme];

  // Summary statistics
  const summaryStats = useMemo(() => {
    if (!currentMetrics) return null;

    // XState v5 compatibility: Handle different metric property names
    const responseTime = (currentMetrics as any).averageResponseTime || 
                        (currentMetrics as any).avgResponseTime || 
                        0;
    const memoryUsage = (currentMetrics as any).memoryUsage || 
                       (currentMetrics as any).memory || 
                       0;
    const errorRate = (currentMetrics as any).errorRate || 
                     (currentMetrics as any).errors || 
                     0;
    const throughput = (currentMetrics as any).operationsPerSecond || 
                      (currentMetrics as any).throughput || 
                      (currentMetrics as any).opsPerSec || 
                      0;

    return [
      {
        label: 'Avg Response Time',
        value: `${responseTime}ms`,
        trend: 'stable' as const,
        icon: Clock
      },
      {
        label: 'Memory Usage',
        value: `${Math.round(memoryUsage)}MB`,
        trend: 'improving' as const,
        icon: Activity
      },
      {
        label: 'Error Rate',
        value: `${(errorRate).toFixed(1)}%`,
        trend: 'degrading' as const,
        icon: AlertTriangle
      },
      {
        label: 'Throughput',
        value: `${Math.round(throughput)}/s`,
        trend: 'improving' as const,
        icon: Zap
      }
    ];
  }, [currentMetrics]);

  const getTrendIcon = (trend: 'improving' | 'degrading' | 'stable') => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'degrading': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className={`w-full ${className}`} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          
          {/* Dashboard controls */}
          <div 
            className="flex items-center gap-2"
            role="toolbar"
            aria-label={ariaLabels.controls}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMonitoring}
              disabled={disabled || loading}
              aria-label={isMonitoring ? 'Stop monitoring' : 'Start monitoring'}
            >
              {isMonitoring ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearResolvedAlerts}
              disabled={resolvedAlerts.length === 0}
              aria-label="Clear resolved alerts"
            >
              Clear Alerts
            </Button>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-4 mt-2 text-sm">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-muted-foreground">
              {isMonitoring ? 'Monitoring' : 'Stopped'}
            </span>
          </div>
          {lastUpdate && (
            <div className="text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          {activeAlerts.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {activeAlerts.length} Alert{activeAlerts.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Summary statistics */}
        {summaryStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {summaryStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                  {getTrendIcon(stat.trend)}
                </div>
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="charts">Performance Charts</TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              Alerts
              {activeAlerts.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs h-4 w-4 rounded-full p-0 flex items-center justify-center">
                  {activeAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Charts Tab */}
          <TabsContent value="charts" className="mt-4">
            <div 
              className="space-y-6"
              role="region"
              aria-label={ariaLabels.charts}
            >
              {chartTypes.map((chartType) => (
                <Card key={chartType}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base capitalize">
                        {chartType.replace('-', ' ')}
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportChartData(chartType)}
                        disabled={getChartData(chartType).length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ChartComponent
                      data={getChartData(chartType)}
                      chartType={chartType}
                      height={chartHeight}
                      theme={theme}
                      enableAnimations={enableAnimations}
                    />
                  </CardContent>
                </Card>
              ))}
              
              {!hasData && !isMonitoring && (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Performance Data</h3>
                  <p>Start monitoring to begin collecting performance metrics.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-4">
            <div 
              className="space-y-4"
              role="region"
              aria-label={ariaLabels.alerts}
            >
              {alerts.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onAcknowledge={acknowledgeAlert}
                        onResolve={resolveAlert}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Active Alerts</h3>
                  <p>All performance metrics are within acceptable thresholds.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-4">
            {performanceSummary ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {performanceSummary.totalMetrics}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Data Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {performanceSummary.totalDataPoints.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Active Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-500">
                        {performanceSummary.activeAlerts}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">Trend Analysis</h4>
                  <div className="space-y-2">
                    {Object.entries(performanceSummary.trendsAnalysis || {}).map(([metric, trend]) => (
                      <div key={metric} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{metric.replace('-', ' ')}</span>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(trend as any)}
                          <span className="capitalize">{trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
                <p>Analytics will be available once monitoring has collected sufficient data.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Default Export
// =============================================================================

export default PerformanceDashboard;