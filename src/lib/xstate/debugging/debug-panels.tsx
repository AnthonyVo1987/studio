/**
 * @fileOverview React Debugging Panels for XState Development
 * 
 * Interactive React components for XState debugging including machine inspector,
 * log viewer, performance monitor, and testing interface.
 * Designed for development environment with hot-key support and real-time updates.
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  DeveloperPanelConfiguration,
  DeveloperPanelTab,
  DeveloperPanelState,
  PanelFilters,
  PanelSettings,
  MachineSnapshot,
  StateTransition,
  StructuredLogEntry,
  PerformanceMetric,
  TestScenario,
  TestResult
} from './debugging-types';
import { createTickerLogger, generateExecutionId } from '../../ticker-logger';
import { globalAdvancedLogger, type LogStatistics } from './advanced-logger';
import { globalInspectorManager, globalStateVisualizer } from './xstate-inspector';
import { globalTestRunner, globalMockManager } from './machine-testing';
import { globalEnvironmentDetector } from './dev-tools';

// ================================
// PANEL CONFIGURATION
// ================================

const DEFAULT_PANEL_CONFIG: DeveloperPanelConfiguration = {
  enabled: process.env.NODE_ENV === 'development',
  position: 'bottom',
  theme: 'dark',
  defaultTab: 'machines',
  enabledTabs: ['machines', 'inspector', 'performance', 'logs', 'testing', 'errors'],
  hotkeys: {
    togglePanel: 'ctrl+shift+d',
    nextTab: 'ctrl+shift+]',
    prevTab: 'ctrl+shift+[',
    clearData: 'ctrl+shift+delete'
  }
};

// ================================
// MAIN DEVELOPER PANEL COMPONENT
// ================================

export interface DeveloperPanelProps {
  config?: Partial<DeveloperPanelConfiguration>;
  onClose?: () => void;
}

export const DeveloperPanel: React.FC<DeveloperPanelProps> = ({ 
  config = {}, 
  onClose 
}) => {
  const [panelConfig] = useState<DeveloperPanelConfiguration>({
    ...DEFAULT_PANEL_CONFIG,
    ...config
  });

  const [panelState, setPanelState] = useState<DeveloperPanelState>({
    isOpen: true,
    activeTab: panelConfig.defaultTab,
    filters: {},
    settings: {
      autoRefresh: true,
      refreshInterval: 2000,
      enableNotifications: true,
      maxDisplayItems: 100,
      enableAutoScroll: true
    }
  });

  const logger = createTickerLogger('SYSTEM', 'DebugPanel', generateExecutionId('panel'));

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = formatKeyCombo(event);
      
      switch (key) {
        case panelConfig.hotkeys.togglePanel:
          event.preventDefault();
          setPanelState(prev => ({ ...prev, isOpen: !prev.isOpen }));
          break;
        case panelConfig.hotkeys.nextTab:
          event.preventDefault();
          setNextTab();
          break;
        case panelConfig.hotkeys.prevTab:
          event.preventDefault();
          setPrevTab();
          break;
        case panelConfig.hotkeys.clearData:
          event.preventDefault();
          handleClearData();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [panelConfig.hotkeys]);

  const formatKeyCombo = (event: KeyboardEvent): string => {
    const parts: string[] = [];
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  };

  const setNextTab = () => {
    const currentIndex = panelConfig.enabledTabs.indexOf(panelState.activeTab);
    const nextIndex = (currentIndex + 1) % panelConfig.enabledTabs.length;
    setPanelState(prev => ({ ...prev, activeTab: panelConfig.enabledTabs[nextIndex] }));
  };

  const setPrevTab = () => {
    const currentIndex = panelConfig.enabledTabs.indexOf(panelState.activeTab);
    const prevIndex = currentIndex === 0 ? panelConfig.enabledTabs.length - 1 : currentIndex - 1;
    setPanelState(prev => ({ ...prev, activeTab: panelConfig.enabledTabs[prevIndex] }));
  };

  const handleClearData = () => {
    switch (panelState.activeTab) {
      case 'logs':
        globalAdvancedLogger.clearLogs();
        break;
      case 'inspector':
        globalStateVisualizer.clearHistory();
        break;
      case 'testing':
        globalMockManager.clearCallHistory();
        break;
    }
    logger.info('ClearData', `Cleared data for tab: ${panelState.activeTab}`);
  };

  if (!panelConfig.enabled || !panelState.isOpen) {
    return null;
  }

  return (
    <div className={`developer-panel theme-${panelConfig.theme} position-${panelConfig.position}`}>
      <div className="panel-header">
        <div className="panel-tabs">
          {panelConfig.enabledTabs.map(tab => (
            <button
              key={tab}
              className={`tab-button ${panelState.activeTab === tab ? 'active' : ''}`}
              onClick={() => setPanelState(prev => ({ ...prev, activeTab: tab }))}
            >
              {formatTabName(tab)}
            </button>
          ))}
        </div>
        <div className="panel-controls">
          <button 
            className="control-button"
            onClick={() => setPanelState(prev => ({ 
              ...prev, 
              settings: { ...prev.settings, autoRefresh: !prev.settings.autoRefresh }
            }))}
            title="Toggle auto-refresh"
          >
            {panelState.settings.autoRefresh ? '⏸️' : '▶️'}
          </button>
          <button 
            className="control-button"
            onClick={handleClearData}
            title="Clear data"
          >
            🗑️
          </button>
          <button 
            className="control-button"
            onClick={onClose || (() => setPanelState(prev => ({ ...prev, isOpen: false })))}
            title="Close panel"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="panel-content">
        {renderTabContent(panelState.activeTab, panelState, setPanelState)}
      </div>

      <style jsx>{`
        .developer-panel {
          position: fixed;
          background: var(--panel-bg);
          border: 1px solid var(--panel-border);
          border-radius: 8px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          z-index: 10000;
          min-width: 600px;
          max-width: 90vw;
          min-height: 300px;
          max-height: 70vh;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }
        
        .position-bottom {
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .position-top {
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .position-left {
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
        }
        
        .position-right {
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
        }
        
        .theme-dark {
          --panel-bg: #1e1e1e;
          --panel-border: #333;
          --text-primary: #fff;
          --text-secondary: #ccc;
          --accent: #007acc;
          --error: #f48771;
          --warning: #ddb76d;
          --success: #4ec9b0;
        }
        
        .theme-light {
          --panel-bg: #ffffff;
          --panel-border: #d0d0d0;
          --text-primary: #000;
          --text-secondary: #666;
          --accent: #0066cc;
          --error: #d73a49;
          --warning: #e36209;
          --success: #28a745;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid var(--panel-border);
          background: rgba(0, 0, 0, 0.1);
        }
        
        .panel-tabs {
          display: flex;
          gap: 4px;
        }
        
        .tab-button {
          padding: 6px 12px;
          background: transparent;
          border: 1px solid var(--panel-border);
          border-radius: 4px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .tab-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }
        
        .tab-button.active {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }
        
        .panel-controls {
          display: flex;
          gap: 4px;
        }
        
        .control-button {
          padding: 4px 8px;
          background: transparent;
          border: 1px solid var(--panel-border);
          border-radius: 4px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .control-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }
        
        .panel-content {
          padding: 12px;
          overflow: auto;
          max-height: calc(70vh - 60px);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};

// ================================
// TAB CONTENT RENDERER
// ================================

const renderTabContent = (
  activeTab: DeveloperPanelTab,
  panelState: DeveloperPanelState,
  setPanelState: React.Dispatch<React.SetStateAction<DeveloperPanelState>>
) => {
  switch (activeTab) {
    case 'machines':
      return <MachinesTab panelState={panelState} setPanelState={setPanelState} />;
    case 'inspector':
      return <InspectorTab panelState={panelState} setPanelState={setPanelState} />;
    case 'performance':
      return <PerformanceTab panelState={panelState} setPanelState={setPanelState} />;
    case 'logs':
      return <LogsTab panelState={panelState} setPanelState={setPanelState} />;
    case 'testing':
      return <TestingTab panelState={panelState} setPanelState={setPanelState} />;
    case 'errors':
      return <ErrorsTab panelState={panelState} setPanelState={setPanelState} />;
    default:
      return <div>Tab not implemented: {activeTab}</div>;
  }
};

const formatTabName = (tab: DeveloperPanelTab): string => {
  return tab.charAt(0).toUpperCase() + tab.slice(1);
};

// ================================
// MACHINES TAB
// ================================

const MachinesTab: React.FC<{
  panelState: DeveloperPanelState;
  setPanelState: React.Dispatch<React.SetStateAction<DeveloperPanelState>>;
}> = ({ panelState, setPanelState }) => {
  const [snapshots, setSnapshots] = useState<MachineSnapshot[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

  useEffect(() => {
    const updateSnapshots = () => {
      const activeSnapshots = Array.from(globalStateVisualizer.getActiveSnapshots().values());
      setSnapshots(activeSnapshots);
    };

    updateSnapshots();
    
    const interval = panelState.settings.autoRefresh 
      ? setInterval(updateSnapshots, panelState.settings.refreshInterval)
      : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [panelState.settings.autoRefresh, panelState.settings.refreshInterval]);

  return (
    <div className="machines-tab">
      <div className="section-header">
        <h3>Active Machines ({snapshots.length})</h3>
      </div>
      
      <div className="machines-list">
        {snapshots.length === 0 ? (
          <div className="empty-state">No active machines found</div>
        ) : (
          snapshots.map(snapshot => (
            <div 
              key={snapshot.id} 
              className={`machine-item ${selectedMachine === snapshot.machineId ? 'selected' : ''}`}
              onClick={() => setSelectedMachine(snapshot.machineId)}
            >
              <div className="machine-header">
                <span className="machine-id">{snapshot.machineId}</span>
                <span className="machine-state">{JSON.stringify(snapshot.state)}</span>
              </div>
              <div className="machine-meta">
                <span>Ticker: {snapshot.metadata.ticker || 'N/A'}</span>
                <span>Uptime: {formatDuration(snapshot.performance.machineUptime)}</span>
                <span>Memory: {formatBytes(snapshot.performance.memoryFootprint)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedMachine && (
        <MachineDetails 
          machineId={selectedMachine}
          snapshot={snapshots.find(s => s.machineId === selectedMachine)!}
        />
      )}

      <style jsx>{`
        .machines-tab {
          height: 100%;
        }
        
        .section-header {
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--panel-border);
        }
        
        .section-header h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: 14px;
        }
        
        .machines-list {
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 16px;
        }
        
        .machine-item {
          padding: 8px;
          border: 1px solid var(--panel-border);
          border-radius: 4px;
          margin-bottom: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .machine-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .machine-item.selected {
          border-color: var(--accent);
          background: rgba(0, 122, 204, 0.1);
        }
        
        .machine-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        
        .machine-id {
          font-weight: bold;
          color: var(--text-primary);
        }
        
        .machine-state {
          color: var(--accent);
          font-family: monospace;
        }
        
        .machine-meta {
          display: flex;
          gap: 12px;
          font-size: 10px;
          color: var(--text-secondary);
        }
        
        .empty-state {
          text-align: center;
          color: var(--text-secondary);
          font-style: italic;
          padding: 20px;
        }
      `}</style>
    </div>
  );
};

// ================================
// MACHINE DETAILS COMPONENT
// ================================

const MachineDetails: React.FC<{
  machineId: string;
  snapshot: MachineSnapshot;
}> = ({ machineId, snapshot }) => {
  return (
    <div className="machine-details">
      <div className="section-header">
        <h4>Machine Details</h4>
      </div>
      
      <div className="details-grid">
        <div className="detail-item">
          <label>Machine ID:</label>
          <span>{machineId}</span>
        </div>
        <div className="detail-item">
          <label>Current State:</label>
          <span className="state-value">{JSON.stringify(snapshot.state)}</span>
        </div>
        <div className="detail-item">
          <label>Ticker:</label>
          <span>{snapshot.metadata.ticker || 'N/A'}</span>
        </div>
        <div className="detail-item">
          <label>Execution ID:</label>
          <span>{snapshot.metadata.executionId || 'N/A'}</span>
        </div>
        <div className="detail-item">
          <label>Uptime:</label>
          <span>{formatDuration(snapshot.performance.machineUptime)}</span>
        </div>
        <div className="detail-item">
          <label>Memory Usage:</label>
          <span>{formatBytes(snapshot.performance.memoryFootprint)}</span>
        </div>
        <div className="detail-item">
          <label>Context Size:</label>
          <span>{formatBytes(snapshot.performance.contextSize)}</span>
        </div>
      </div>

      <div className="context-preview">
        <h5>Context Preview:</h5>
        <pre className="context-json">
          {JSON.stringify(snapshot.context, null, 2)}
        </pre>
      </div>

      <style jsx>{`
        .machine-details {
          border-top: 1px solid var(--panel-border);
          padding-top: 12px;
        }
        
        .section-header h4 {
          margin: 0 0 8px 0;
          color: var(--text-primary);
          font-size: 13px;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .detail-item label {
          font-size: 10px;
          color: var(--text-secondary);
          font-weight: bold;
        }
        
        .detail-item span {
          font-size: 11px;
          color: var(--text-primary);
          font-family: monospace;
        }
        
        .state-value {
          color: var(--accent) !important;
        }
        
        .context-preview h5 {
          margin: 0 0 4px 0;
          font-size: 11px;
          color: var(--text-secondary);
        }
        
        .context-json {
          background: rgba(0, 0, 0, 0.2);
          padding: 8px;
          border-radius: 4px;
          font-size: 10px;
          max-height: 150px;
          overflow: auto;
          margin: 0;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};

// ================================
// INSPECTOR TAB
// ================================

const InspectorTab: React.FC<{
  panelState: DeveloperPanelState;
  setPanelState: React.Dispatch<React.SetStateAction<DeveloperPanelState>>;
}> = ({ panelState }) => {
  const [transitions, setTransitions] = useState<StateTransition[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);

  useEffect(() => {
    const updateData = () => {
      const recentTransitions = globalStateVisualizer.getTransitionHistory().slice(-50);
      setTransitions(recentTransitions);
      setConnectionStatus(globalInspectorManager.getConnectionStatus());
    };

    updateData();
    
    const interval = panelState.settings.autoRefresh 
      ? setInterval(updateData, panelState.settings.refreshInterval)
      : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [panelState.settings.autoRefresh, panelState.settings.refreshInterval]);

  return (
    <div className="inspector-tab">
      <div className="connection-status">
        <h3>Inspector Connection</h3>
        <div className={`status-indicator ${connectionStatus?.connected ? 'connected' : 'disconnected'}`}>
          {connectionStatus?.connected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        {connectionStatus?.attempts > 0 && (
          <div className="reconnect-info">
            Reconnection attempts: {connectionStatus.attempts}
          </div>
        )}
      </div>

      <div className="transitions-section">
        <h3>Recent Transitions ({transitions.length})</h3>
        <div className="transitions-list">
          {transitions.length === 0 ? (
            <div className="empty-state">No transitions recorded</div>
          ) : (
            transitions.map(transition => (
              <TransitionItem key={transition.id} transition={transition} />
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .inspector-tab {
          height: 100%;
        }
        
        .connection-status {
          margin-bottom: 16px;
          padding: 8px;
          border: 1px solid var(--panel-border);
          border-radius: 4px;
        }
        
        .connection-status h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: var(--text-primary);
        }
        
        .status-indicator {
          font-size: 12px;
          font-weight: bold;
        }
        
        .status-indicator.connected {
          color: var(--success);
        }
        
        .status-indicator.disconnected {
          color: var(--error);
        }
        
        .reconnect-info {
          font-size: 10px;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        
        .transitions-section h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: var(--text-primary);
        }
        
        .transitions-list {
          max-height: 300px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

// ================================
// TRANSITION ITEM COMPONENT
// ================================

const TransitionItem: React.FC<{ transition: StateTransition }> = ({ transition }) => {
  return (
    <div className="transition-item">
      <div className="transition-header">
        <span className="transition-states">
          {JSON.stringify(transition.from)} → {JSON.stringify(transition.to)}
        </span>
        <span className="transition-duration">{transition.duration}ms</span>
      </div>
      <div className="transition-meta">
        <span>Event: {transition.event?.type || 'N/A'}</span>
        <span>Machine: {transition.machineId}</span>
        <span>Time: {new Date(transition.timestamp).toLocaleTimeString()}</span>
      </div>
      {transition.actions.length > 0 && (
        <div className="transition-actions">
          Actions: {transition.actions.map(a => a.name).join(', ')}
        </div>
      )}

      <style jsx>{`
        .transition-item {
          padding: 8px;
          border: 1px solid var(--panel-border);
          border-radius: 4px;
          margin-bottom: 4px;
          font-size: 11px;
        }
        
        .transition-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        
        .transition-states {
          color: var(--accent);
          font-family: monospace;
          font-weight: bold;
        }
        
        .transition-duration {
          color: var(--warning);
          font-family: monospace;
        }
        
        .transition-meta {
          display: flex;
          gap: 12px;
          font-size: 10px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        
        .transition-actions {
          font-size: 10px;
          color: var(--success);
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

// ================================
// LOGS TAB
// ================================

const LogsTab: React.FC<{
  panelState: DeveloperPanelState;
  setPanelState: React.Dispatch<React.SetStateAction<DeveloperPanelState>>;
}> = ({ panelState }) => {
  const [logs, setLogs] = useState<StructuredLogEntry[]>([]);
  const [stats, setStats] = useState<LogStatistics | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateLogs = () => {
      const recentLogs = globalAdvancedLogger.getLogs().slice(-panelState.settings.maxDisplayItems);
      setLogs(recentLogs);
      setStats(globalAdvancedLogger.getStatistics());
    };

    updateLogs();
    
    const interval = panelState.settings.autoRefresh 
      ? setInterval(updateLogs, panelState.settings.refreshInterval)
      : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [panelState.settings.autoRefresh, panelState.settings.refreshInterval, panelState.settings.maxDisplayItems]);

  useEffect(() => {
    if (panelState.settings.enableAutoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, panelState.settings.enableAutoScroll]);

  return (
    <div className="logs-tab">
      <div className="logs-stats">
        <h3>Log Statistics</h3>
        {stats && (
          <div className="stats-grid">
            <div className="stat-item">
              <label>Total Entries:</label>
              <span>{stats.totalEntries}</span>
            </div>
            <div className="stat-item">
              <label>Error Rate:</label>
              <span>{((stats.levelDistribution.error || 0) / stats.totalEntries * 100).toFixed(1)}%</span>
            </div>
            {stats.performanceSummary && (
              <>
                <div className="stat-item">
                  <label>Avg Execution:</label>
                  <span>{stats.performanceSummary.averageExecutionTime.toFixed(2)}ms</span>
                </div>
                <div className="stat-item">
                  <label>Peak Memory:</label>
                  <span>{formatBytes(stats.performanceSummary.maxMemoryUsage)}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="logs-list">
        <h3>Recent Logs ({logs.length})</h3>
        <div className="logs-container">
          {logs.map(log => (
            <LogItem key={log.id} log={log} />
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      <style jsx>{`
        .logs-tab {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .logs-stats {
          margin-bottom: 16px;
          padding: 8px;
          border: 1px solid var(--panel-border);
          border-radius: 4px;
        }
        
        .logs-stats h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: var(--text-primary);
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        
        .stat-item label {
          color: var(--text-secondary);
        }
        
        .stat-item span {
          color: var(--text-primary);
          font-family: monospace;
        }
        
        .logs-list {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .logs-list h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: var(--text-primary);
        }
        
        .logs-container {
          flex: 1;
          overflow-y: auto;
          max-height: 300px;
          border: 1px solid var(--panel-border);
          border-radius: 4px;
          padding: 4px;
        }
      `}</style>
    </div>
  );
};

// ================================
// LOG ITEM COMPONENT
// ================================

const LogItem: React.FC<{ log: StructuredLogEntry }> = ({ log }) => {
  const levelColor = {
    error: 'var(--error)',
    warn: 'var(--warning)',
    info: 'var(--text-primary)',
    debug: 'var(--text-secondary)',
    trace: 'var(--text-secondary)'
  }[log.level];

  return (
    <div className="log-item">
      <div className="log-header">
        <span className="log-level" style={{ color: levelColor }}>
          [{log.level.toUpperCase()}]
        </span>
        <span className="log-category">[{log.category}]</span>
        <span className="log-time">
          {new Date(log.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div className="log-message">{log.message}</div>
      {log.data && (
        <div className="log-data">
          <pre>{JSON.stringify(log.data, null, 2)}</pre>
        </div>
      )}

      <style jsx>{`
        .log-item {
          margin-bottom: 4px;
          padding: 6px;
          border-left: 3px solid ${levelColor};
          background: rgba(0, 0, 0, 0.1);
          font-size: 10px;
        }
        
        .log-header {
          display: flex;
          gap: 8px;
          margin-bottom: 2px;
          font-family: monospace;
        }
        
        .log-level {
          font-weight: bold;
        }
        
        .log-category {
          color: var(--accent);
        }
        
        .log-time {
          color: var(--text-secondary);
          margin-left: auto;
        }
        
        .log-message {
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        
        .log-data {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 2px;
          padding: 4px;
        }
        
        .log-data pre {
          margin: 0;
          font-size: 9px;
          color: var(--text-secondary);
          white-space: pre-wrap;
          max-height: 100px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

// ================================
// PLACEHOLDER TABS
// ================================

const PerformanceTab: React.FC<any> = () => (
  <div className="placeholder-tab">
    <h3>Performance Monitor</h3>
    <p>Performance monitoring data would be displayed here...</p>
    <div className="placeholder-content">
      <div>• Memory usage tracking</div>
      <div>• CPU usage monitoring</div>
      <div>• State transition performance</div>
      <div>• Service execution times</div>
    </div>
  </div>
);

const TestingTab: React.FC<any> = () => (
  <div className="placeholder-tab">
    <h3>Testing Interface</h3>
    <p>Testing controls and results would be displayed here...</p>
    <div className="placeholder-content">
      <div>• Mock service configuration</div>
      <div>• Test scenario runner</div>
      <div>• State manipulation tools</div>
      <div>• Test results and assertions</div>
    </div>
  </div>
);

const ErrorsTab: React.FC<any> = () => (
  <div className="placeholder-tab">
    <h3>Error Tracking</h3>
    <p>Error tracking and recovery information would be displayed here...</p>
    <div className="placeholder-content">
      <div>• Machine errors and exceptions</div>
      <div>• Error recovery attempts</div>
      <div>• Stack traces and debugging info</div>
      <div>• Error reporting and analytics</div>
    </div>
  </div>
);

// ================================
// UTILITY FUNCTIONS
// ================================

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// ================================
// EXPORTS
// ================================

export default DeveloperPanel;
export { DeveloperPanel };
export type { DeveloperPanelProps };