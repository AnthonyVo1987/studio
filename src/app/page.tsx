
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebugTabContent } from "@/components/debug-tab-content";
import { MainTabContent } from "@/components/main-tab-content";
import { StockAnalysisProvider } from "@/contexts/stock-analysis-context"; // Import Provider

export default function Home() {
  return (
    <StockAnalysisProvider> {/* Wrap content with Provider */}
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
      </div>
    </StockAnalysisProvider>
  );
}
