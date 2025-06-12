
'use client';

import { Header } from "@/components/layout/header";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebugTabContent } from "@/components/debug-tab-content";
import { MainTabContent } from "@/components/main-tab-content";
import { StockAnalysisProvider, useStockAnalysis } from "@/contexts/stock-analysis-context";
import { DebugConsole, CONSOLE_HEIGHT_PX } from "@/components/debug-console";
import { cn } from "@/lib/utils";

function PageContent() {
  const {
    isClientDebugConsoleEnabled,
    setClientDebugConsoleEnabled,
    isClientDebugConsoleOpen,
    setClientDebugConsoleOpen,
  } = useStockAnalysis();

  const handleDebugConsoleToggle = (checked: boolean) => {
    setClientDebugConsoleEnabled(checked);
    setClientDebugConsoleOpen(checked);
    // The clearGlobalLogBuffer() is called within setClientDebugConsoleEnabled(false)
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
            checked={isClientDebugConsoleEnabled && isClientDebugConsoleOpen}
            onCheckedChange={handleDebugConsoleToggle}
          />
          <Label htmlFor="enable-debug-console">Enable & Show Client Debug Console</Label>
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
