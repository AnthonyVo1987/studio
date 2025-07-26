'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUIState } from "@/contexts/ui-state-context";
import { useState } from "react";

/**
 * DebugUIStateControls - Debug component for UI state inspection
 * 
 * This component provides debug information about the UI state context,
 * showing snapshots, versions, and state transitions.
 */
export function DebugUIStateControls() {
  const { currentSnapshot, previousSnapshot, pendingSnapshot, snapshotHistory, snapshotVersion } = useUIState();
  const [showFullSnapshot, setShowFullSnapshot] = useState(false);

  const exportUIState = () => {
    const uiStateData = {
      currentSnapshot,
      previousSnapshot,
      pendingSnapshot,
      snapshotHistory,
      snapshotVersion,
      exportedAt: new Date().toISOString(),
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(uiStateData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ui-state-debug-v${snapshotVersion}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>UI State Debug Controls</CardTitle>
        <CardDescription>
          Debug information for the UI state management layer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Snapshot Version</label>
            <Badge variant="outline">{snapshotVersion}</Badge>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Snapshot History Count</label>
            <Badge variant="outline">{snapshotHistory.length}</Badge>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lag Mechanism Status</label>
            <Badge variant={pendingSnapshot ? "secondary" : "default"}>
              {pendingSnapshot ? "Pending Update" : "Synchronized"}
            </Badge>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">UI State Status</label>
            <Badge variant={currentSnapshot ? "default" : "destructive"}>
              {currentSnapshot ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Loading States</label>
            <div className="text-sm space-y-1">
              <div>Analyzing: {currentSnapshot.loadingStates.isAnalyzing ? '✅' : '❌'}</div>
              <div>Fetching Data: {currentSnapshot.loadingStates.isFetchingData ? '✅' : '❌'}</div>
              <div>Calculating TA: {currentSnapshot.loadingStates.isCalculatingTA ? '✅' : '❌'}</div>
              <div>Progress: {currentSnapshot.loadingStates.progress}%</div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Error State</label>
            <div className="text-sm space-y-1">
              <div>Has Error: {currentSnapshot.errorState.hasError ? '❌' : '✅'}</div>
              <div>Can Retry: {currentSnapshot.errorState.canRetry ? '✅' : '❌'}</div>
              {currentSnapshot.errorState.message && (
                <div className="text-destructive">Message: {currentSnapshot.errorState.message}</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Data Readiness</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>Stock: {currentSnapshot.stockSnapshot.isDataReady ? '✅' : '❌'}</div>
            <div>Market: {currentSnapshot.marketStatus.isDataReady ? '✅' : '❌'}</div>
            <div>TA: {currentSnapshot.technicalAnalysis.isDataReady ? '✅' : '❌'}</div>
            <div>Options: {currentSnapshot.optionsData.isDataReady ? '✅' : '❌'}</div>
            <div>AI TA: {currentSnapshot.aiAnalysis.isTechnicalAnalysisReady ? '✅' : '❌'}</div>
            <div>AI Takeaways: {currentSnapshot.aiAnalysis.isKeyTakeawaysReady ? '✅' : '❌'}</div>
            <div>AI Options: {currentSnapshot.aiAnalysis.isOptionsAnalysisReady ? '✅' : '❌'}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={exportUIState} variant="outline" size="sm">
            Export UI State
          </Button>
          <Button 
            onClick={() => setShowFullSnapshot(!showFullSnapshot)} 
            variant="outline" 
            size="sm"
          >
            {showFullSnapshot ? 'Hide' : 'Show'} Full Snapshot
          </Button>
        </div>

        {showFullSnapshot && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Snapshot (JSON)</label>
            <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-96">
              {JSON.stringify(currentSnapshot, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}