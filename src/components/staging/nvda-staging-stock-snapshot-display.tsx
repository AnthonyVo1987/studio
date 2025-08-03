"use client";

/**
 * @fileOverview NVDA Staging Stock Snapshot Display - Enterprise Staging Component
 * 
 * This component displays NVDA stock snapshot data in the staging environment
 * with identical functionality to production for accurate comparison testing.
 * 
 * ENTERPRISE FEATURES:
 * - Complete isolation from production with staging context integration
 * - Security boundaries with audit logging for all data access
 * - Performance monitoring with comparison metrics
 * - Compliance tracking with data protection validation
 * - Feature flag integration for experimental features
 * - Real-time threat detection and isolation validation
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3, Shield, AlertTriangle } from "lucide-react";
import { useEffect } from 'react';

// NVDA Staging Context
import { useNvdaStagingAnalysis } from "@/contexts/nvda-staging-analysis-context";

// Security and Audit Services
import { AuditLogger } from "@/lib/staging/audit-logger";
import { SecurityMonitor } from "@/lib/staging/security-monitor";

interface SnapshotDetailItem {
  label: string;
  current: string | null;
  previous: string | null;
  minute: string | null;
}

const renderDetailRow = (item: SnapshotDetailItem, index: number, isLoading: boolean) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-nvda-staging-snapshot-${index}`}>
        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
          🧪 Waiting for NVDA staging snapshot data...
        </TableCell>
      </TableRow>
    );
  }
  return (
    <TableRow key={item.label}>
      <TableCell className="font-medium">{item.label}</TableCell>
      <TableCell>{item.current ?? "N/A"}</TableCell>
      <TableCell>{item.minute ?? "N/A"}</TableCell>
      <TableCell>{item.previous ?? "N/A"}</TableCell>
    </TableRow>
  );
};

export function NvdaStagingStockSnapshotDisplay() {
  const stagingState = useNvdaStagingAnalysis();

  // Audit data access for compliance
  useEffect(() => {
    if (stagingState.stockSnapshotJson) {
      AuditLogger.logEvent({
        type: 'USER_ACTION',
        action: 'STOCK_SNAPSHOT_DATA_ACCESSED',
        source: 'nvda-staging-stock-snapshot-display',
        details: {
          ticker: 'NVDA',
          dataLength: stagingState.stockSnapshotJson.length,
          hasData: stagingState.hasStockData,
          timestamp: new Date().toISOString(),
        },
        severity: 'info',
        compliance: {
          soc2Required: true,
          gdprSensitive: false,
          financialData: true,
          retentionPeriod: 30,
        },
      });
    }
  }, [stagingState.stockSnapshotJson, stagingState.hasStockData]);

  // Safe JSON parsing pattern following actual Polygon API structure (IDENTICAL TO PRODUCTION)
  const snapshotData = stagingState.stockSnapshotJson ? (() => {
    try {
      const parsed = JSON.parse(stagingState.stockSnapshotJson);
      const day = parsed.day || {};
      const prevDay = parsed.prevDay || {};
      const min = parsed.min || {};
      
      return {
        ticker: parsed.ticker || "NVDA",
        open: day.o?.toFixed(2) || "N/A",
        high: day.h?.toFixed(2) || "N/A",
        low: day.l?.toFixed(2) || "N/A",
        close: day.c?.toFixed(2) || "N/A",
        volume: day.v?.toLocaleString() || "N/A",
        vwap: day.vw?.toFixed(2) || "N/A",
        prevOpen: prevDay.o?.toFixed(2) || "N/A",
        prevHigh: prevDay.h?.toFixed(2) || "N/A",
        prevLow: prevDay.l?.toFixed(2) || "N/A",
        prevClose: prevDay.c?.toFixed(2) || "N/A",
        prevVolume: prevDay.v?.toLocaleString() || "N/A",
        prevVwap: prevDay.vw?.toFixed(2) || "N/A",
        minOpen: min.o?.toFixed(2) || "N/A",
        minHigh: min.h?.toFixed(2) || "N/A",
        minLow: min.l?.toFixed(2) || "N/A",
        minClose: min.c?.toFixed(2) || "N/A",
        minVolume: min.v?.toLocaleString() || "N/A",
        minVwap: min.vw?.toFixed(2) || "N/A",
        currentPrice: parsed.currentPrice?.toFixed(2) || "N/A",
        todaysChange: parsed.todaysChange?.toFixed(2) || "N/A",
        todaysChangePerc: parsed.todaysChangePerc?.toFixed(2) || "N/A",
        isDataReady: stagingState.dataRetrievalComplete
      };
    } catch (e) {
      // Log parsing error for security monitoring
      SecurityMonitor.reportEvent({
        type: 'DATA_BREACH',
        severity: 'medium',
        description: 'JSON parsing error in staging stock snapshot',
        source: 'nvda-staging-stock-snapshot-display',
        details: {
          error: e instanceof Error ? e.message : 'Unknown error',
          jsonLength: stagingState.stockSnapshotJson.length,
          ticker: 'NVDA',
        },
      });

      return {
        ticker: "NVDA",
        open: "Error parsing data",
        high: "Error parsing data",
        low: "Error parsing data",
        close: "Error parsing data",
        volume: "Error parsing data",
        vwap: "Error parsing data",
        prevOpen: "N/A",
        prevHigh: "N/A",
        prevLow: "N/A",
        prevClose: "N/A",
        prevVolume: "N/A",
        prevVwap: "N/A",
        minOpen: "N/A",
        minHigh: "N/A",
        minLow: "N/A",
        minClose: "N/A",
        minVolume: "N/A",
        minVwap: "N/A",
        currentPrice: "N/A",
        todaysChange: "N/A",
        todaysChangePerc: "N/A",
        isDataReady: false
      };
    }
  })() : {
    ticker: "NVDA",
    open: "N/A",
    high: "N/A",
    low: "N/A", 
    close: "N/A",
    volume: "N/A",
    vwap: "N/A",
    prevOpen: "N/A",
    prevHigh: "N/A",
    prevLow: "N/A",
    prevClose: "N/A",
    prevVolume: "N/A",
    prevVwap: "N/A",
    minOpen: "N/A",
    minHigh: "N/A",
    minLow: "N/A",
    minClose: "N/A",
    minVolume: "N/A",
    minVwap: "N/A",
    currentPrice: "N/A",
    todaysChange: "N/A",
    todaysChangePerc: "N/A",
    isDataReady: false
  };

  const snapshotDetails: SnapshotDetailItem[] = [
    { label: "Open", current: snapshotData.open, previous: snapshotData.prevOpen, minute: snapshotData.minOpen },
    { label: "High", current: snapshotData.high, previous: snapshotData.prevHigh, minute: snapshotData.minHigh },
    { label: "Low", current: snapshotData.low, previous: snapshotData.prevLow, minute: snapshotData.minLow },
    { label: "Close", current: snapshotData.close, previous: snapshotData.prevClose, minute: snapshotData.minClose },
    { label: "Volume", current: snapshotData.volume, previous: snapshotData.prevVolume, minute: snapshotData.minVolume },
    { label: "VWAP", current: snapshotData.vwap, previous: snapshotData.prevVwap, minute: snapshotData.minVwap },
  ];

  return (
    <Card className="border-orange-200 bg-orange-50/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <BarChart3 className="w-5 h-5" />
            🧪 Stock Snapshot (Staging)
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
              EXPERIMENTAL
            </Badge>
          </CardTitle>
          
          {/* Security Status Indicator */}
          <div className="flex items-center gap-2">
            {stagingState.isolationValidation.validated ? (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-400">
                <Shield className="w-3 h-3 mr-1" />
                ISOLATED
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-400">
                <AlertTriangle className="w-3 h-3 mr-1" />
                VIOLATION
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-orange-600">
          Real-time NVDA stock data in isolated staging environment with security monitoring
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Security Alert for Isolation Violations */}
        {!stagingState.isolationValidation.validated && (
          <Alert className="border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>Security Alert:</strong> Isolation boundaries have been violated. 
              Component may be contaminated with production data.
              {stagingState.isolationValidation.violations.length > 0 && (
                <ul className="mt-1 text-xs">
                  {stagingState.isolationValidation.violations.map((violation, index) => (
                    <li key={index}>• {violation}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Performance Comparison Alert */}
        {stagingState.performanceComparison && !stagingState.performanceMetrics.comparisonWithProduction.performanceParity && (
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              <strong>Performance Alert:</strong> Response time differs from production baseline by 
              {stagingState.performanceMetrics.comparisonWithProduction.responseTimeDiff > 0 ? '+' : ''}
              {stagingState.performanceMetrics.comparisonWithProduction.responseTimeDiff.toFixed(0)}ms
            </AlertDescription>
          </Alert>
        )}

        {/* Current Price Display (if available) */}
        {snapshotData.currentPrice !== "N/A" && (
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-orange-800">{snapshotData.ticker}</h3>
                <p className="text-2xl font-bold text-orange-700">${snapshotData.currentPrice}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${parseFloat(snapshotData.todaysChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(snapshotData.todaysChange) >= 0 ? '+' : ''}{snapshotData.todaysChange}
                </p>
                <p className={`text-sm ${parseFloat(snapshotData.todaysChangePerc) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({parseFloat(snapshotData.todaysChangePerc) >= 0 ? '+' : ''}{snapshotData.todaysChangePerc}%)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium text-orange-700">Metric</TableHead>
              <TableHead className="font-medium text-orange-700">Current Day</TableHead>
              <TableHead className="font-medium text-orange-700">Minute</TableHead>
              <TableHead className="font-medium text-orange-700">Previous Day</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshotDetails.map((item, index) => 
              renderDetailRow(item, index, !stagingState.hasStockData)
            )}
          </TableBody>
        </Table>

        {/* Data Status Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-orange-200">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${snapshotData.isDataReady ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>Data Status: {snapshotData.isDataReady ? 'Complete' : 'Partial'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Environment: 🧪 Staging</span>
            <span>Security: {stagingState.securityMonitoringActive ? '🛡️ Active' : '⚠️ Inactive'}</span>
            <span>Audit: {stagingState.auditingActive ? '📋 Logging' : '❌ Disabled'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}