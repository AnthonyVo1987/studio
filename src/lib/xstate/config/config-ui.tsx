/**
 * Configuration Management System - React UI Components
 * 
 * Comprehensive React UI for configuration management with
 * real-time updates, validation, and user-friendly interfaces.
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Flag,
  Server,
  Gauge,
  Database,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Plus
} from 'lucide-react';

import type {
  AppConfig,
  ConfigEnvironment,
  ConfigManagerState,
  FeatureFlagConfig,
  XStateMachineConfig,
  PerformanceConfig,
  StockSageConfig,
  ConfigHealthCheck
} from './config-types';

// Props interfaces
interface ConfigManagerUIProps {
  config: AppConfig | null;
  state: ConfigManagerState;
  onConfigUpdate: (updates: Partial<AppConfig>) => Promise<void>;
  onEnvironmentSwitch: (environment: ConfigEnvironment) => Promise<void>;
  onFeatureFlagUpdate: (key: string, updates: Partial<FeatureFlagConfig>) => Promise<void>;
  onExportConfig: () => Promise<string | null>;
  onImportConfig: (data: string) => Promise<boolean>;
  onHealthCheck: () => Promise<ConfigHealthCheck>;
}

interface FeatureFlagCardProps {
  flagKey: string;
  flag: FeatureFlagConfig;
  onUpdate: (updates: Partial<FeatureFlagConfig>) => void;
  onDelete: () => void;
}

interface XStateMachineCardProps {
  machineId: string;
  machine: XStateMachineConfig;
  onUpdate: (updates: Partial<XStateMachineConfig>) => void;
  onDelete: () => void;
}

// Main configuration management UI
export const ConfigManagerUI: React.FC<ConfigManagerUIProps> = ({
  config,
  state,
  onConfigUpdate,
  onEnvironmentSwitch,
  onFeatureFlagUpdate,
  onExportConfig,
  onImportConfig,
  onHealthCheck
}) => {
  const [healthStatus, setHealthStatus] = useState<ConfigHealthCheck | null>(null);
  const [importData, setImportData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load health status
  useEffect(() => {
    const loadHealthStatus = async () => {
      try {
        const health = await onHealthCheck();
        setHealthStatus(health);
      } catch (error) {
        console.error('Failed to load health status:', error);
      }
    };

    loadHealthStatus();
    const interval = setInterval(loadHealthStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [onHealthCheck]);

  const handleExport = async () => {
    try {
      setLoading(true);
      const exported = await onExportConfig();
      if (exported) {
        // Download as file
        const blob = new Blob([exported], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `config-${config?.environmentConfig.environment || 'unknown'}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      const success = await onImportConfig(importData);
      if (success) {
        setImportData('');
        setShowImportDialog(false);
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!config) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Configuration not loaded</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuration Management</h2>
          <p className="text-muted-foreground">
            Manage application configuration and feature flags
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onHealthCheck}
            disabled={loading}
          >
            <Activity className="h-4 w-4 mr-2" />
            Health Check
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
            disabled={loading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <StatusOverview state={state} healthStatus={healthStatus} />

      {/* Environment Selector */}
      <EnvironmentSelector
        currentEnvironment={config.environmentConfig.environment}
        onEnvironmentSwitch={onEnvironmentSwitch}
        loading={state.loading}
      />

      {/* Configuration Tabs */}
      <Tabs defaultValue="feature-flags" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="feature-flags">
            <Flag className="h-4 w-4 mr-2" />
            Feature Flags
          </TabsTrigger>
          <TabsTrigger value="xstate-machines">
            <Server className="h-4 w-4 mr-2" />
            XState Machines
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Gauge className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="stocksage">
            <Database className="h-4 w-4 mr-2" />
            StockSage
          </TabsTrigger>
          <TabsTrigger value="environment">
            <Settings className="h-4 w-4 mr-2" />
            Environment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feature-flags">
          <FeatureFlagsPanel
            flags={config.featureFlags}
            onUpdate={onFeatureFlagUpdate}
            onConfigUpdate={onConfigUpdate}
          />
        </TabsContent>

        <TabsContent value="xstate-machines">
          <XStateMachinesPanel
            machines={config.xstateMachines}
            onConfigUpdate={onConfigUpdate}
          />
        </TabsContent>

        <TabsContent value="performance">
          <PerformancePanel
            performance={config.performance}
            onConfigUpdate={onConfigUpdate}
          />
        </TabsContent>

        <TabsContent value="stocksage">
          <StockSagePanel
            stocksage={config.stocksage}
            onConfigUpdate={onConfigUpdate}
          />
        </TabsContent>

        <TabsContent value="environment">
          <EnvironmentPanel
            environment={config.environmentConfig}
            onConfigUpdate={onConfigUpdate}
          />
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Import Configuration</CardTitle>
              <CardDescription>
                Paste your configuration JSON below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste configuration JSON here..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={10}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowImportDialog(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={loading || !importData.trim()}
                >
                  {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Import
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Status overview component
const StatusOverview: React.FC<{
  state: ConfigManagerState;
  healthStatus: ConfigHealthCheck | null;
}> = ({ state, healthStatus }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            {state.initialized ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">
              {state.initialized ? 'Initialized' : 'Not Initialized'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Badge variant={state.activeEnvironment === 'production' ? 'destructive' : 'secondary'}>
              {state.activeEnvironment}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Version:</span>
            <span className="font-mono text-sm">{state.configVersion}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            {healthStatus?.healthy ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            <span className="font-medium">
              {healthStatus?.healthy ? 'Healthy' : 'Issues Detected'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Environment selector component
const EnvironmentSelector: React.FC<{
  currentEnvironment: ConfigEnvironment;
  onEnvironmentSwitch: (env: ConfigEnvironment) => Promise<void>;
  loading: boolean;
}> = ({ currentEnvironment, onEnvironmentSwitch, loading }) => {
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (environment: ConfigEnvironment) => {
    if (environment === currentEnvironment) return;
    
    try {
      setSwitching(true);
      await onEnvironmentSwitch(environment);
    } catch (error) {
      console.error('Environment switch failed:', error);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Environment
        </CardTitle>
        <CardDescription>
          Switch between different configuration environments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Label>Current Environment:</Label>
          <Select
            value={currentEnvironment}
            onValueChange={handleSwitch}
            disabled={loading || switching}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="test">Test</SelectItem>
            </SelectContent>
          </Select>
          {(loading || switching) && (
            <RefreshCw className="h-4 w-4 animate-spin" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Feature flags panel
const FeatureFlagsPanel: React.FC<{
  flags: Record<string, FeatureFlagConfig>;
  onUpdate: (key: string, updates: Partial<FeatureFlagConfig>) => Promise<void>;
  onConfigUpdate: (updates: Partial<AppConfig>) => Promise<void>;
}> = ({ flags, onUpdate, onConfigUpdate }) => {
  const [newFlagKey, setNewFlagKey] = useState('');
  const [showNewFlag, setShowNewFlag] = useState(false);

  const handleAddFlag = async () => {
    if (!newFlagKey.trim()) return;

    const newFlag: FeatureFlagConfig = {
      key: newFlagKey,
      state: 'disabled',
      description: 'New feature flag',
      dependencies: [],
      rolloutPercentage: 0,
      environments: ['development']
    };

    const updatedFlags = { ...flags, [newFlagKey]: newFlag };
    await onConfigUpdate({ featureFlags: updatedFlags });
    
    setNewFlagKey('');
    setShowNewFlag(false);
  };

  const handleDeleteFlag = async (key: string) => {
    const updatedFlags = { ...flags };
    delete updatedFlags[key];
    await onConfigUpdate({ featureFlags: updatedFlags });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Feature Flags</h3>
        <Button
          size="sm"
          onClick={() => setShowNewFlag(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Flag
        </Button>
      </div>

      {showNewFlag && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Feature flag key"
                value={newFlagKey}
                onChange={(e) => setNewFlagKey(e.target.value)}
              />
              <Button size="sm" onClick={handleAddFlag}>
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowNewFlag(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {Object.entries(flags).map(([key, flag]) => (
          <FeatureFlagCard
            key={key}
            flagKey={key}
            flag={flag}
            onUpdate={(updates) => onUpdate(key, updates)}
            onDelete={() => handleDeleteFlag(key)}
          />
        ))}
      </div>

      {Object.keys(flags).length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No feature flags configured</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Feature flag card component
const FeatureFlagCard: React.FC<FeatureFlagCardProps> = ({
  flagKey,
  flag,
  onUpdate,
  onDelete
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              checked={flag.state === 'enabled'}
              onCheckedChange={(checked) => 
                onUpdate({ state: checked ? 'enabled' : 'disabled' })
              }
            />
            <div>
              <CardTitle className="text-base">{flagKey}</CardTitle>
              <CardDescription>{flag.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={flag.state === 'enabled' ? 'default' : 'secondary'}>
              {flag.state}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rollout Percentage</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={flag.rolloutPercentage}
                onChange={(e) => onUpdate({ rolloutPercentage: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>State</Label>
              <Select
                value={flag.state}
                onValueChange={(state) => onUpdate({ state: state as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                  <SelectItem value="experimental">Experimental</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Description</Label>
            <Input
              value={flag.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
            />
          </div>
          
          <div>
            <Label>Environments</Label>
            <div className="flex gap-2 mt-2">
              {(['development', 'staging', 'production', 'test'] as ConfigEnvironment[]).map(env => (
                <Badge
                  key={env}
                  variant={flag.environments.includes(env) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const environments = flag.environments.includes(env)
                      ? flag.environments.filter(e => e !== env)
                      : [...flag.environments, env];
                    onUpdate({ environments });
                  }}
                >
                  {env}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// XState machines panel
const XStateMachinesPanel: React.FC<{
  machines: Record<string, XStateMachineConfig>;
  onConfigUpdate: (updates: Partial<AppConfig>) => Promise<void>;
}> = ({ machines, onConfigUpdate }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">XState Machine Configurations</h3>
      
      <div className="grid gap-4">
        {Object.entries(machines).map(([id, machine]) => (
          <XStateMachineCard
            key={id}
            machineId={id}
            machine={machine}
            onUpdate={(updates) => {
              const updatedMachines = {
                ...machines,
                [id]: { ...machine, ...updates }
              };
              onConfigUpdate({ xstateMachines: updatedMachines });
            }}
            onDelete={() => {
              const updatedMachines = { ...machines };
              delete updatedMachines[id];
              onConfigUpdate({ xstateMachines: updatedMachines });
            }}
          />
        ))}
      </div>

      {Object.keys(machines).length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No XState machines configured</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// XState machine card component
const XStateMachineCard: React.FC<XStateMachineCardProps> = ({
  machineId,
  machine,
  onUpdate,
  onDelete
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{machineId}</CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              checked={machine.enabled}
              onCheckedChange={(enabled) => onUpdate({ enabled })}
            />
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Label>Debug Mode</Label>
            <Switch
              checked={machine.debugMode}
              onCheckedChange={(debugMode) => onUpdate({ debugMode })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label>Persist State</Label>
            <Switch
              checked={machine.persistState}
              onCheckedChange={(persistState) => onUpdate({ persistState })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Max Concurrent Actors</Label>
            <Input
              type="number"
              value={machine.actorSpawning.maxConcurrentActors}
              onChange={(e) => onUpdate({
                actorSpawning: {
                  ...machine.actorSpawning,
                  maxConcurrentActors: Number(e.target.value)
                }
              })}
            />
          </div>
          <div>
            <Label>Retry Attempts</Label>
            <Input
              type="number"
              value={machine.errorHandling.retryAttempts}
              onChange={(e) => onUpdate({
                errorHandling: {
                  ...machine.errorHandling,
                  retryAttempts: Number(e.target.value)
                }
              })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Performance panel
const PerformancePanel: React.FC<{
  performance: PerformanceConfig;
  onConfigUpdate: (updates: Partial<AppConfig>) => Promise<void>;
}> = ({ performance, onConfigUpdate }) => {
  const handleUpdate = (updates: Partial<PerformanceConfig>) => {
    onConfigUpdate({ performance: { ...performance, ...updates } });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Performance Configuration</h3>
      
      <Card>
        <CardHeader>
          <CardTitle>Metrics Collection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Enabled</Label>
            <Switch
              checked={performance.enabled}
              onCheckedChange={(enabled) => handleUpdate({ enabled })}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Interval (ms)</Label>
              <Input
                type="number"
                value={performance.metricsCollection.interval}
                onChange={(e) => handleUpdate({
                  metricsCollection: {
                    ...performance.metricsCollection,
                    interval: Number(e.target.value)
                  }
                })}
              />
            </div>
            <div>
              <Label>Batch Size</Label>
              <Input
                type="number"
                value={performance.metricsCollection.batchSize}
                onChange={(e) => handleUpdate({
                  metricsCollection: {
                    ...performance.metricsCollection,
                    batchSize: Number(e.target.value)
                  }
                })}
              />
            </div>
            <div>
              <Label>Retention (ms)</Label>
              <Input
                type="number"
                value={performance.metricsCollection.retentionPeriod}
                onChange={(e) => handleUpdate({
                  metricsCollection: {
                    ...performance.metricsCollection,
                    retentionPeriod: Number(e.target.value)
                  }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alerting Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Memory Usage (%)</Label>
              <Input
                type="number"
                value={performance.alerting.thresholds.memoryUsage}
                onChange={(e) => handleUpdate({
                  alerting: {
                    ...performance.alerting,
                    thresholds: {
                      ...performance.alerting.thresholds,
                      memoryUsage: Number(e.target.value)
                    }
                  }
                })}
              />
            </div>
            <div>
              <Label>Execution Time (ms)</Label>
              <Input
                type="number"
                value={performance.alerting.thresholds.executionTime}
                onChange={(e) => handleUpdate({
                  alerting: {
                    ...performance.alerting,
                    thresholds: {
                      ...performance.alerting.thresholds,
                      executionTime: Number(e.target.value)
                    }
                  }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// StockSage panel
const StockSagePanel: React.FC<{
  stocksage: StockSageConfig;
  onConfigUpdate: (updates: Partial<AppConfig>) => Promise<void>;
}> = ({ stocksage, onConfigUpdate }) => {
  const handleUpdate = (updates: Partial<StockSageConfig>) => {
    onConfigUpdate({ stocksage: { ...stocksage, ...updates } });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">StockSage Configuration</h3>
      
      <Card>
        <CardHeader>
          <CardTitle>AI Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Timeout (ms)</Label>
              <Input
                type="number"
                value={stocksage.aiIntegration.timeoutMs}
                onChange={(e) => handleUpdate({
                  aiIntegration: {
                    ...stocksage.aiIntegration,
                    timeoutMs: Number(e.target.value)
                  }
                })}
              />
            </div>
            <div>
              <Label>Retry Attempts</Label>
              <Input
                type="number"
                value={stocksage.aiIntegration.retryAttempts}
                onChange={(e) => handleUpdate({
                  aiIntegration: {
                    ...stocksage.aiIntegration,
                    retryAttempts: Number(e.target.value)
                  }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Macro Automation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Enabled</Label>
            <Switch
              checked={stocksage.macroAutomation.enabled}
              onCheckedChange={(enabled) => handleUpdate({
                macroAutomation: { ...stocksage.macroAutomation, enabled }
              })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Label>Sequential Execution</Label>
              <Switch
                checked={stocksage.macroAutomation.sequentialExecution}
                onCheckedChange={(sequentialExecution) => handleUpdate({
                  macroAutomation: { ...stocksage.macroAutomation, sequentialExecution }
                })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>Debug Logging</Label>
              <Switch
                checked={stocksage.macroAutomation.debugLogging}
                onCheckedChange={(debugLogging) => handleUpdate({
                  macroAutomation: { ...stocksage.macroAutomation, debugLogging }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Environment panel
const EnvironmentPanel: React.FC<{
  environment: any;
  onConfigUpdate: (updates: Partial<AppConfig>) => Promise<void>;
}> = ({ environment, onConfigUpdate }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Environment Configuration</h3>
      
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Polygon API</Label>
            <Input
              value={environment.apiEndpoints.polygon}
              onChange={(e) => onConfigUpdate({
                environmentConfig: {
                  ...environment,
                  apiEndpoints: {
                    ...environment.apiEndpoints,
                    polygon: e.target.value
                  }
                }
              })}
            />
          </div>
          <div>
            <Label>Gemini API</Label>
            <Input
              value={environment.apiEndpoints.gemini}
              onChange={(e) => onConfigUpdate({
                environmentConfig: {
                  ...environment,
                  apiEndpoints: {
                    ...environment.apiEndpoints,
                    gemini: e.target.value
                  }
                }
              })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Requests/Minute</Label>
              <Input
                type="number"
                value={environment.rateLimiting.requestsPerMinute}
                onChange={(e) => onConfigUpdate({
                  environmentConfig: {
                    ...environment,
                    rateLimiting: {
                      ...environment.rateLimiting,
                      requestsPerMinute: Number(e.target.value)
                    }
                  }
                })}
              />
            </div>
            <div>
              <Label>Burst Limit</Label>
              <Input
                type="number"
                value={environment.rateLimiting.burstLimit}
                onChange={(e) => onConfigUpdate({
                  environmentConfig: {
                    ...environment,
                    rateLimiting: {
                      ...environment.rateLimiting,
                      burstLimit: Number(e.target.value)
                    }
                  }
                })}
              />
            </div>
            <div>
              <Label>Backoff (ms)</Label>
              <Input
                type="number"
                value={environment.rateLimiting.backoffMs}
                onChange={(e) => onConfigUpdate({
                  environmentConfig: {
                    ...environment,
                    rateLimiting: {
                      ...environment.rateLimiting,
                      backoffMs: Number(e.target.value)
                    }
                  }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};