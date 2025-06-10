import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="main" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>
          <TabsContent value="main">
            <Card>
              <CardHeader>
                <CardTitle>Main Display</CardTitle>
                <CardDescription>
                  User-friendly display of stock analysis, options chain, and AI insights.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Main tab content will be implemented in Phase 2 & 3.</p>
                <img src="https://placehold.co/1200x600.png?text=Main+Tab+Placeholder" alt="Main tab placeholder" data-ai-hint="dashboard graph" className="w-full h-auto rounded-md shadow-md" />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="debug">
            <Card>
              <CardHeader>
                <CardTitle>Debug Information</CardTitle>
                <CardDescription>
                  Raw JSON data from APIs and AI flows for debugging and verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Debug tab content (Textareas with JSON) will be implemented in Phase 1.</p>
                <img src="https://placehold.co/1200x400.png?text=Debug+Tab+Placeholder" alt="Debug tab placeholder" data-ai-hint="code screen" className="w-full h-auto rounded-md shadow-md" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
