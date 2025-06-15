
'use client';

import { Header } from "@/components/layout/header";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebugTabContent } from "@/components/debug-tab-content";
import { MainTabContent } from "@/components/main-tab-content";
import { StockAnalysisProvider, useStockAnalysis, FsmState } from "@/contexts/stock-analysis-context";
import { DebugConsole, CONSOLE_HEIGHT_PX } from "@/components/debug-console";
import { cn } from "@/lib/utils";

function PageContent() {
  const {
    isClientDebugConsoleEnabled,
    setClientDebugConsoleEnabled,
    isClientDebugConsoleOpen,
    logDebug,
    fsmState, // Current FSM state
    previousFsmState,
    targetFsmDisplayState,
  } = useStockAnalysis();

  const handleDebugConsoleToggle = (checked: boolean) => {
    logDebug('MainTabContent', `Main debug console switch toggled by user to: ${checked}`);
    // This will now primarily control visibility if enabled is true by default,
    // or enable/disable if that's still the desired core behavior.
    // The logic in setClientDebugConsoleEnabled in context handles opening/closing.
    setClientDebugConsoleEnabled(checked);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main
        className={cn(
          "flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out"
        )}
        style={{ paddingBottom: isClientDebugConsoleEnabled && isClientDebugConsoleOpen ? `${CONSOLE_HEIGHT_PX + 16}px` : '32px' }}
      >
        <div className="flex items-center space-x-2 mb-4 p-4 border rounded-md bg-card/50">
          <Switch
            id="enable-debug-console"
            checked={isClientDebugConsoleEnabled} 
            onCheckedChange={handleDebugConsoleToggle}
          />
          <Label htmlFor="enable-debug-console" className="flex-shrink-0">Enable & Show Client Debug Console</Label>
          <div className="ml-auto text-xs text-muted-foreground text-right flex-grow space-x-2">
            <span>Prev: <span className="font-semibold">{previousFsmState || 'N/A'}</span></span>
            <span>|</span>
            <span>Current: <span className="font-semibold">{fsmState}</span></span>
            <span>|</span>
            <span>Target: <span className="font-semibold">{targetFsmDisplayState || 'N/A'}</span></span>
          </div>
        </div>
        <Tabs defaultValue="main" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>
          <TabsContent value="main">
            <MainTabContent />
          </TabsContent>
          <TabsContent value="debug">
            <DebugTabContent />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
      <DebugConsole />
    </div>
  );
}

export default function Home() {
  return (
    <StockAnalysisProvider>
      <PageContent />
    </StockAnalysisProvider>
  );
}
