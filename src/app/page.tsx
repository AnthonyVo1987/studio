
'use client'; // Needs to be client component to use context for padding

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebugTabContent } from "@/components/debug-tab-content";
import { MainTabContent } from "@/components/main-tab-content";
import { StockAnalysisProvider, useStockAnalysis, CONSOLE_HEIGHT } from "@/contexts/stock-analysis-context";
import { DebugConsole } from "@/components/debug-console"; // Import DebugConsole
import { cn } from "@/lib/utils";

function PageContent() {
  const { isClientDebugConsoleOpen } = useStockAnalysis();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main 
        className={cn(
          "flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out"
        )}
        style={{ paddingBottom: isClientDebugConsoleOpen ? `${CONSOLE_HEIGHT + 16}px` : '32px' }} // 16px buffer + console height or default padding
      >
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
      <DebugConsole /> {/* Add DebugConsole here so it's part of the layout */}
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
