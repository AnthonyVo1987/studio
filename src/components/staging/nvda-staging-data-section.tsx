"use client";

/**
 * @fileOverview NVDA Staging Data Section - Enterprise Data Management
 * 
 * This component manages data display and export functionality for the staging environment
 * with enhanced security, compliance monitoring, and data protection features.
 * 
 * ENTERPRISE FEATURES:
 * - Data encryption and secure export with compliance validation
 * - Audit trail for all data access and export operations
 * - Role-based access controls with approval workflows
 * - Real-time data protection monitoring with threat detection
 * - Performance metrics collection with comparison to production
 * - Automated compliance validation with regulatory requirements
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Download, Shield, AlertTriangle, FileText, Database, Lock } from "lucide-react";
import { useCallback, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

// NVDA Staging Context
import { useNvdaStagingAnalysis } from "@/contexts/nvda-staging-analysis-context";

// Security and Audit Services
import { AuditLogger } from "@/lib/staging/audit-logger";
import { SecurityMonitor } from "@/lib/staging/security-monitor";
import { FeatureFlagService } from "@/lib/staging/feature-flag-service";

// Export utility functions
import { exportToJson, exportToCsv, copyToClipboard } from "@/lib/export-utils";

interface DataSectionProps {
  children: ReactNode;
}

export function NvdaStagingDataSection({ children }: DataSectionProps) {
  const stagingState = useNvdaStagingAnalysis();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Export data with security validation
  const handleExportData = useCallback(async (format: 'json' | 'csv') => {
    setIsExporting(true);
    
    try {
      // Check data export restrictions
      if (stagingState.dataExportRestricted) {
        toast({
          variant: "destructive",
          title: "❌ Export Restricted",
          description: "Data export is currently restricted due to compliance requirements",
        });
        return;
      }

      // Validate security context
      if (!stagingState.isolationValidation.validated) {
        toast({
          variant: "destructive", 
          title: "❌ Security Violation",
          description: "Cannot export data due to isolation boundary violations",
        });
        return;
      }

      // Log export attempt for audit
      await AuditLogger.logEvent({
        type: 'USER_ACTION',
        action: 'DATA_EXPORT_INITIATED',
        source: 'nvda-staging-data-section',
        details: {
          format,
          dataTypes: ['stockSnapshot', 'marketStatus', 'technicalAnalysis'],
          securityContext: stagingState.securityContext,
          timestamp: new Date().toISOString(),
        },
        severity: 'info',
        compliance: {
          soc2Required: true,
          gdprSensitive: true,
          financialData: true,
          retentionPeriod: 365, // Financial data retention
        },
      });

      // Prepare export data
      const exportData = {
        meta: {
          ticker: 'NVDA',
          environment: 'staging',
          exportedAt: new Date().toISOString(),
          experimentType: stagingState.experimentType,
          version: 'v4.5.0.0',
          dataEncrypted: stagingState.dataEncrypted,
          complianceStatus: stagingState.complianceStatus,
        },
        stockSnapshot: stagingState.stockSnapshotJson ? JSON.parse(stagingState.stockSnapshotJson) : null,
        marketStatus: stagingState.marketStatusJson ? JSON.parse(stagingState.marketStatusJson) : null,
        technicalAnalysis: {
          standard: stagingState.standardTasJson ? JSON.parse(stagingState.standardTasJson) : null,
          aiAnalyzed: stagingState.aiAnalyzedTaJson ? JSON.parse(stagingState.aiAnalyzedTaJson) : null,
        },
        aiAnalysis: {
          keyTakeaways: stagingState.aiKeyTakeawaysJson ? JSON.parse(stagingState.aiKeyTakeawaysJson) : null,
          optionsAnalysis: stagingState.aiOptionsAnalysisJson ? JSON.parse(stagingState.aiOptionsAnalysisJson) : null,
        },
        optionsChain: stagingState.optionsChainJson ? JSON.parse(stagingState.optionsChainJson) : null,
        performanceMetrics: stagingState.performanceMetrics,
        securityValidation: stagingState.isolationValidation,
      };

      let exportedData: string;
      let filename: string;

      if (format === 'json') {
        exportedData = exportToJson(exportData);
        filename = `nvda-staging-data-${new Date().toISOString().split('T')[0]}.json`;
      } else {
        exportedData = exportToCsv(exportData);
        filename = `nvda-staging-data-${new Date().toISOString().split('T')[0]}.csv`;
      }

      // Create and trigger download
      const blob = new Blob([exportedData], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log successful export
      await AuditLogger.logEvent({
        type: 'USER_ACTION',
        action: 'DATA_EXPORT_COMPLETED',
        source: 'nvda-staging-data-section',
        details: {
          format,
          filename,
          fileSize: blob.size,
          recordCount: Object.keys(exportData).length,
          success: true,
        },
        severity: 'info',
        compliance: {
          soc2Required: true,
          gdprSensitive: true,
          financialData: true,
          retentionPeriod: 365,
        },
      });

      toast({
        title: "✅ Export Successful",
        description: `Data exported as ${filename}`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log export error for security monitoring
      await SecurityMonitor.reportEvent({
        type: 'DATA_BREACH',
        severity: 'high',
        description: 'Data export failed with error',
        source: 'nvda-staging-data-section',
        details: {
          error: errorMessage,
          format,
          timestamp: new Date().toISOString(),
        },
      });

      toast({
        variant: "destructive",
        title: "❌ Export Failed",
        description: errorMessage,
      });
    } finally {
      setIsExporting(false);
    }
  }, [stagingState, toast]);

  // Copy data to clipboard with security validation
  const handleCopyData = useCallback(async () => {
    try {
      if (!stagingState.isolationValidation.validated) {
        toast({
          variant: "destructive",
          title: "❌ Security Violation", 
          description: "Cannot copy data due to isolation boundary violations",
        });
        return;
      }

      const summaryData = {
        ticker: 'NVDA',
        environment: 'staging',
        hasStockData: stagingState.hasStockData,
        hasAiAnalysis: stagingState.hasAiKeyTakeaways,
        hasOptionsData: stagingState.hasOptionsChainData,
        experimentType: stagingState.experimentType,
        securityStatus: stagingState.isolationValidation.validated ? 'SECURE' : 'VIOLATED',
        timestamp: new Date().toISOString(),
      };

      await copyToClipboard(JSON.stringify(summaryData, null, 2));

      // Log clipboard access for audit
      await AuditLogger.logEvent({
        type: 'USER_ACTION',
        action: 'DATA_COPIED_TO_CLIPBOARD',
        source: 'nvda-staging-data-section',
        details: {
          dataType: 'summary',
          size: JSON.stringify(summaryData).length,
        },
        severity: 'info',
        compliance: {
          soc2Required: true,
          gdprSensitive: false,
          financialData: false,
          retentionPeriod: 30,
        },
      });

      toast({
        title: "✅ Copied to Clipboard",
        description: "Staging data summary copied successfully",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        variant: "destructive",
        title: "❌ Copy Failed",
        description: errorMessage,
      });
    }
  }, [stagingState, toast]);

  return (
    <div className="space-y-6">
      {/* Data Section Header */}
      <Card className="border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Database className="w-5 h-5" />
              🧪 Staging Data Management
              <Badge variant="outline" className="bg-orange-200 text-orange-800 border-orange-400">
                ISOLATED
              </Badge>
            </CardTitle>
            
            {/* Security and Compliance Status */}
            <div className="flex items-center gap-2">
              {stagingState.dataEncrypted ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-400">
                  <Lock className="w-3 h-3 mr-1" />
                  ENCRYPTED
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-400">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  UNENCRYPTED
                </Badge>
              )}
              
              {stagingState.complianceStatus.soc2Compliant ? (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-400">
                  SOC2
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-400">
                  NON-COMPLIANT
                </Badge>
              )}
            </div>
          </div>
          <CardDescription className="text-orange-600">
            Enterprise data management with security monitoring, audit trails, and compliance validation
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Data Export Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-orange-800">Data Export Controls</h4>
                <p className="text-sm text-orange-600">
                  Export staging data with enterprise security and compliance validation
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyData}
                  disabled={!stagingState.isolationValidation.validated}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Copy Summary
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportData('json')}
                  disabled={isExporting || stagingState.dataExportRestricted}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportData('csv')}
                  disabled={isExporting || stagingState.dataExportRestricted}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Data Status Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stagingState.hasStockData ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span>Stock Data: {stagingState.hasStockData ? 'Available' : 'Pending'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stagingState.hasAiKeyTakeaways ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span>AI Analysis: {stagingState.hasAiKeyTakeaways ? 'Complete' : 'Pending'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stagingState.hasOptionsChainData ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span>Options: {stagingState.hasOptionsChainData ? 'Loaded' : 'Pending'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stagingState.dataRetrievalComplete ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span>Complete: {stagingState.dataRetrievalComplete ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      {!stagingState.isolationValidation.validated && (
        <Alert className="border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>🚨 SECURITY ALERT:</strong> Isolation boundaries violated. Data may be contaminated.
            <ul className="mt-1 text-xs">
              {stagingState.isolationValidation.violations.map((violation, index) => (
                <li key={index}>• {violation}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {stagingState.dataExportRestricted && (
        <Alert className="border-yellow-300 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            <strong>⚠️ COMPLIANCE RESTRICTION:</strong> Data export is temporarily restricted due to compliance requirements.
          </AlertDescription>
        </Alert>
      )}

      <Separator className="border-orange-200" />

      {/* Data Display Content */}
      <div className="space-y-6">
        {children}
      </div>

      {/* Performance Metrics Footer */}
      {stagingState.performanceComparison && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="font-medium text-blue-800">Response Time</div>
                <div className="text-blue-600">{stagingState.performanceMetrics.responseTime.toFixed(0)}ms</div>
              </div>
              <div>
                <div className="font-medium text-blue-800">Memory Usage</div>
                <div className="text-blue-600">{stagingState.performanceMetrics.memoryUsage.toFixed(1)}MB</div>
              </div>
              <div>
                <div className="font-medium text-blue-800">vs Production</div>
                <div className={`${stagingState.performanceMetrics.comparisonWithProduction.performanceParity ? 'text-green-600' : 'text-red-600'}`}>
                  {stagingState.performanceMetrics.comparisonWithProduction.performanceParity ? '✅ Parity' : '⚠️ Variance'}
                </div>
              </div>
              <div>
                <div className="font-medium text-blue-800">Experiment</div>
                <div className="text-blue-600 capitalize">{stagingState.experimentType}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}