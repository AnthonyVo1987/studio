
"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStockAnalysis, type BusinessFsmState, type BusinessFlags, type BusinessContextVariables } from "@/contexts/business-logic-context";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadJson, copyToClipboard } from "@/lib/export-utils";

function BusinessFsmStateDisplay({ title, previousState, currentState, targetState }: {
  title: string;
  previousState: BusinessFsmState | null;
  currentState: BusinessFsmState;
  targetState: BusinessFsmState | null;
}) {
  return (
    <div className="p-2 border rounded-md bg-muted/30">
      <p className="text-sm font-semibold mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium">Prev:</span> {previousState || 'N/A'} |{' '}
        <span className="font-medium text-foreground">Curr:</span> {currentState} |{' '}
        <span className="font-medium">Target:</span> {targetState || 'N/A'}
      </p>
    </div>
  );
}


export function FsmDebugTabContent() {
    const {
        fsmState: globalFsmState,
        previousFsmState: globalPreviousFsmState,
        targetFsmDisplayState: globalTargetFsmDisplayState,
        fsmFlags,
        fsmVariables
    } = useStockAnalysis();
    const { toast } = useToast();

    const getFullFsmSnapshotForExport = () => ({
        timestamp: new Date().toISOString(),
        globalApplicationFSM: {
          previous: globalPreviousFsmState,
          current: globalFsmState,
          target: globalTargetFsmDisplayState,
        },
        globalFsmFlags: fsmFlags,
        globalFsmContextVariables: fsmVariables,
    });

    const handleCopyJson = async () => {
        const fsmData = getFullFsmSnapshotForExport();
        if (await copyToClipboard(JSON.stringify(fsmData, null, 2))) {
            toast({ title: 'Global FSM Data Copied', description: 'Global FSM state, flags, and variables copied as JSON.' });
        } else {
            toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy Global FSM data.' });
        }
    };

    const handleExportJson = () => {
        try {
            const fsmData = getFullFsmSnapshotForExport();
            downloadJson(fsmData, 'stocksage_global_fsm_snapshot.json');
            toast({ title: 'Global FSM Data Exported', description: 'Global FSM state, flags, and variables downloaded as JSON.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export Global FSM data.' });
        }
    };


    const renderVariables = (variables: BusinessContextVariables) => {
        return Object.entries(variables).map(([key, value]) => (
            <TableRow key={`var-${key}`}>
                <TableCell className="font-medium py-1 px-2 text-xs break-all">{key}</TableCell>
                <TableCell className="py-1 px-2 text-xs break-all">
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? 'null')}
                </TableCell>
            </TableRow>
        ));
    };
    
    const renderFlags = (flags: BusinessFlags) => {
        return Object.entries(flags).map(([key, value]) => (
            <TableRow key={`flag-${key}`}>
                <TableCell className="font-medium py-1 px-2 text-xs break-all">{key}</TableCell>
                <TableCell className={`py-1 px-2 text-xs break-all font-semibold ${value ? 'text-positive' : 'text-destructive'}`}>{String(value)}</TableCell>
            </TableRow>
        ));
    };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Global FSM Debug</CardTitle>
            <CardDescription>
                Real-time state, flags, and variables of the Global Finite State Machine.
            </CardDescription>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyJson}>
                <Copy className="mr-2 h-4 w-4" /> Copy JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJson}>
                <Download className="mr-2 h-4 w-4" /> Export JSON
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-22rem)] pr-4">
          <div className="space-y-4 font-code">
            <BusinessFsmStateDisplay
                title="Global Application FSM"
                previousState={globalPreviousFsmState}
                currentState={globalFsmState}
                targetState={globalTargetFsmDisplayState}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="p-3 border-b">
                        <CardTitle className="text-base">Global Flags</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/2">Flag</TableHead>
                                    <TableHead className="w-1/2">Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>{renderFlags(fsmFlags)}</TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="p-3 border-b">
                        <CardTitle className="text-base">Global Variables</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/3">Variable</TableHead>
                                    <TableHead className="w-2/3">Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>{renderVariables(fsmVariables)}</TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
