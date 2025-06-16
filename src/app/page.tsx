
'use client';

import { Header } from "@/components/layout/header";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebugTabContent } from "@/components/debug-tab-content";
import { MainTabContent } from "@/components/main-tab-content";
import { StockAnalysisProvider, useStockAnalysis, type FsmDisplayTuple } from "@/contexts/stock-analysis-context";
import { DebugConsoleFsmProvider } from "@/contexts/debug-console-fsm-context";
import { FsmStateDebugCard, FSM_CARD_HEIGHT_PX } from "@/components/fsm-state-debug-card";
import { DebugConsole, CONSOLE_HEIGHT_PX } from "@/components/debug-console";
import { cn } from "@/lib/utils";
import { useState } from "react";

function PageContent() {
  const {
    isClientDebugConsoleEnabled,
    setClientDebugConsoleEnabled,
    isClientDebugConsoleOpen,
    isFsmDebugCardEnabled,
    setFsmDebugCardEnabled,
    isFsmDebugCardOpen,
    logDebug,
    setMainTabFsmDisplay,
    setDebugConsoleMenuFsmDisplay,
  } = useStockAnalysis();

  const [mainTabFsmPreviousState, setMainTabFsmPreviousState] = useState<string | null>(null);
  const [mainTabFsmCurrentState, setMainTabFsmCurrentState] = useState<string>('IDLE');
  const [mainTabFsmTargetState, setMainTabFsmTargetState] = useState<string | null>(null);

  const handleDebugConsoleToggle = (checked: boolean) => {
    logDebug('PageContent', `Main debug console switch toggled by user to: ${checked}`);
    setClientDebugConsoleEnabled(checked);
  };

  const handleFsmDebugCardToggle = (checked: boolean) => {
    logDebug('PageContent', `FSM debug card switch toggled by user to: ${checked}`);
    setFsmDebugCardEnabled(checked);
  };

  const calculatePaddingBottom = () => {
    let padding = 32; 
    if (isClientDebugConsoleEnabled && isClientDebugConsoleOpen) {
      padding = CONSOLE_HEIGHT_PX + 16;
    }
    if (isFsmDebugCardEnabled && isFsmDebugCardOpen) {
      padding = (isClientDebugConsoleEnabled && isClientDebugConsoleOpen ? CONSOLE_HEIGHT_PX : 0) + FSM_CARD_HEIGHT_PX + 16 + (isClientDebugConsoleEnabled && isClientDebugConsoleOpen ? 16 : 0) ;
    }
    return `${padding}px`;
  };

  // Callback to update mainTabFsmDisplay in StockAnalysisContext
  const updateMainTabFsmDisplayInGlobalContext = (display: FsmDisplayTuple | null) => {
    setMainTabFsmDisplay(display);
  };


  return (
    <div className="flex flex-col min-h-screen">
      <Header />
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
          <div className="flex items-center space-x-2">
             <Switch
              id="enable-fsm-debug-card"
              checked={isFsmDebugCardEnabled}
              onCheckedChange={handleFsmDebugCardToggle}
            />
            <Label htmlFor="enable-fsm-debug-card" className="flex-shrink-0">Enable & Show FSM State Debug Card</Label>
          </div>
        </div>
        <Tabs defaultValue="main" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>
          <TabsContent value="main">
            <MainTabContent 
              setMainTabFsmPreviousState={setMainTabFsmPreviousState} // For direct prop to FsmStateDebugCard
              setMainTabFsmCurrentState={setMainTabFsmCurrentState}   // For direct prop to FsmStateDebugCard
              setMainTabFsmTargetState={setMainTabFsmTargetState}       // For direct prop to FsmStateDebugCard
              setMainTabFsmDisplayState={updateMainTabFsmDisplayInGlobalContext} // For reporting to global context
            />
          </TabsContent>
          <TabsContent value="debug">
            <DebugTabContent />
          </TabsContent>
        </Tabs>
      </main>
      <DebugConsoleFsmProvider 
        logDebug={logDebug} 
        setDebugConsoleMenuFsmDisplayState={setDebugConsoleMenuFsmDisplay}
      >
        <FsmStateDebugCard 
            mainTabFsmPreviousState={mainTabFsmPreviousState}
            mainTabFsmCurrentState={mainTabFsmCurrentState}
            mainTabFsmTargetState={mainTabFsmTargetState}
        />
        <DebugConsole />
      </DebugConsoleFsmProvider>
      <Footer />
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

