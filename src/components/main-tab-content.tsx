
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MainTabContent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Main Application View</CardTitle>
        <CardDescription>
          This is where the primary user interface for stock analysis, options, and AI insights will be displayed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Content for the Main tab will be built out in upcoming tasks.</p>
        <img 
          src="https://placehold.co/1200x600.png?text=Main+Tab+UI+Shell" 
          alt="Main tab UI shell placeholder" 
          data-ai-hint="dashboard chart" 
          className="w-full h-auto rounded-md shadow-md" 
        />
      </CardContent>
    </Card>
  );
}
