
import { getAppConfig, type AppConfig } from '@/lib/app-config-loader';
import { PageContent } from '@/components/page-content'; // Import the new client component
import { SpyAnalysisProvider } from '@/contexts/spy-analysis-context';
import { NvdaAnalysisProvider } from '@/contexts/nvda-analysis-context';
import { NvdaStagingAnalysisProvider } from '@/contexts/nvda-staging-analysis-context';

export default async function Home() {
  let appConfig: AppConfig;
  try {
    appConfig = await getAppConfig();
  } catch (error) {
    // Fallback error logging moved to app-config-loader.tsx
    // If getAppConfig throws, it will be caught by Next.js error handling or an ErrorBoundary
    // For robustness, provide default values if critical
    appConfig = {
      appVersion: "v0.0.0-error",
      lastUpdatedTimestamp: new Date().toISOString(),
      metadataSchemaVersion: "0.0.0",
    };
  }

  return (
    <SpyAnalysisProvider>
      <NvdaAnalysisProvider>
        <NvdaStagingAnalysisProvider>
          <PageContent appVersion={appConfig.appVersion} lastUpdatedTimestamp={appConfig.lastUpdatedTimestamp} />
        </NvdaStagingAnalysisProvider>
      </NvdaAnalysisProvider>
    </SpyAnalysisProvider>
  );
}

