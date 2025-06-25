
"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebugTabContent } from "@/components/debug-tab-content";
import { MainTabContent } from "@/components/main-tab-content";
import { FsmDebugTabContent } from "@/components/fsm-debug-tab-content";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { DebugConsole, CONSOLE_HEIGHT_PX } from "@/components/debug-console";
import { cn } from "@/lib/utils";

interface PageContentProps {
  appVersion: string;
  lastUpdatedTimestamp?: string;
}

export function PageContent({ appVersion, lastUpdatedTimestamp }: PageContentProps) {
  const {
    isClientDebugConsoleEnabled,
    setClientDebugConsoleEnabled,
    isClientDebugConsoleOpen,
    logDebug,
    ...allRawData
  } = useStockAnalysis();

  const handleDebugConsoleToggle = (checked: boolean) => {
    logDebug('PageContent', 'UserAction_DebugConsoleToggle', `Main debug console switch toggled by user to: ${checked}`);
    setClientDebugConsoleEnabled(checked);
  };

  const calculatePaddingBottom = () => {
    let padding = 32; 
    let consoleEffectiveHeight = 0;

    if (isClientDebugConsoleEnabled && isClientDebugConsoleOpen) {
      consoleEffectiveHeight = CONSOLE_HEIGHT_PX;
    }
    
    if (consoleEffectiveHeight > 0) {
      padding = consoleEffectiveHeight + 16;
    }
    return `${padding}px`;
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header appVersion={appVersion} lastUpdatedTimestamp={lastUpdatedTimestamp} />
      <main
        className={cn(
          "flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out"
        )}
        style={{ paddingBottom: calculatePaddingBottom() }}
      >
        <div className="flex flex-col space-y-2 mb-4 p-4 border rounded-md bg-card/50">
          <div className="flex items-center space-x-2">
            <Switch
              id="enable-debug-console"
              checked={isClientDebugConsoleEnabled}
              onCheckedChange={handleDebugConsoleToggle}
            />
            <Label htmlFor="enable-debug-console" className="flex-shrink-0">Enable & Show Client Debug Console</Label>
          </div>
        </div>
        <Tabs defaultValue="main" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
            <TabsTrigger value="fsm-debug">FSM Debug</TabsTrigger>
          </TabsList>
          <TabsContent value="main">
            <MainTabContent /> 
          </TabsContent>
          <TabsContent value="debug">
            <DebugTabContent />
          </TabsContent>
          <TabsContent value="fsm-debug">
            <FsmDebugTabContent />
          </TabsContent>
        </Tabs>
      </main>
      <DebugConsole appVersion={appVersion} allRawData={allRawData} />
      <Footer />
    </div>
  );
}
