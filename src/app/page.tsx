
'use client';

import { Header } from "@/components/layout/header";
// import { Label } from "@/components/ui/label"; // No longer needed
// import { Switch } from "@/components/ui/switch"; // No longer needed
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebugTabContent } from "@/components/debug-tab-content";
import { MainTabContent } from "@/components/main-tab-content";
import { StockAnalysisProvider } from "@/contexts/stock-analysis-context"; // Remove useStockAnalysis and CONSOLE_HEIGHT if they were only for debug console
// import { DebugConsole } from "@/components/debug-console"; // No longer needed
import { cn } from "@/lib/utils";

function PageContent() {
  // Remove useStockAnalysis hook usage if it was only for debug console state
  // const { isClientDebugConsoleOpen } = useStockAnalysis(); // Example, remove if not used elsewhere

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main
        className={cn(
          "flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out"
        )}
        // Remove dynamic style for paddingBottom if it was only for debug console
        // style={{ paddingBottom: isClientDebugConsoleOpen ? `${CONSOLE_HEIGHT + 16}px` : '32px' }}
      >
        {/* Remove Switch control for debug console */}
        {/*
        <div className="flex items-center space-x-2 mb-4">
          <Switch
            id="enable-debug-console"
            checked={isClientDebugConsoleEnabled}
            onCheckedChange={setClientDebugConsoleEnabled} />
          <Label htmlFor="enable-debug-console">Enable Debug Console</Label>
        </div>
        */}
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
      {/* Remove DebugConsole component */}
      {/* <DebugConsole /> */}
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
