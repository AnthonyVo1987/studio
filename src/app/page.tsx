
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StockAnalysisProvider } from "@/contexts/stock-analysis-context";
import { getAppConfig, type AppConfig } from '@/lib/app-config-loader';
import { PageContent } from '@/components/page-content'; // Import the new client component

export default async function Home() {
  let appConfig: AppConfig;
  try {
    appConfig = await getAppConfig();
  } catch (error) {
    // Fallback error logging moved to app-config-loader.tsx
    // If getAppConfig throws, it will be caught by Next.js error handling or an ErrorBoundary
    // For robustness, provide default values if critical
    console.error("[HomeServerComponent] Critical: Failed to load app config, using defaults:", error);
    appConfig = {
      appVersion: "v0.0.0-error",
      lastUpdatedTimestamp: new Date().toISOString(),
      metadataSchemaVersion: "0.0.0",
    };
  }

  return (
    <StockAnalysisProvider>
      <PageContent appVersion={appConfig.appVersion} lastUpdatedTimestamp={appConfig.lastUpdatedTimestamp} />
    </StockAnalysisProvider>
  );
}

