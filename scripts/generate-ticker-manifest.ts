#!/usr/bin/env tsx

/**
 * @fileOverview Build-Time Ticker Manifest Generator
 * 
 * Generates a manifest of available tickers for build-time optimization
 * and automatic ticker module registration. This script runs during
 * the build process to create static manifests.
 * 
 * Features:
 * - Auto-discovery of ticker configurations
 * - Build-time validation of ticker setups
 * - Manifest generation for static imports
 * - Bundle size optimization analysis
 * - Dead code elimination support
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Import ticker configurations
import { TICKER_CONFIGS, getEnabledTickers, TickerConfigUtils } from '../src/config/ticker-configs';
import type { DynamicTickerConfig } from '../src/config/ticker-configs';

/**
 * Build-time ticker entry for manifest
 */
interface TickerManifestEntry {
  ticker: string;
  displayName: string;
  enabled: boolean;
  order: number;
  category: string;
  
  // Build-time information
  hasContext: boolean;
  hasComponents: boolean;
  hasChatAction: boolean;
  
  // Bundle information
  contextModule: string;
  componentsModule: string;
  chatActionModule?: string;
  
  // Feature flags
  features: {
    aiChat: boolean;
    optionsChain: boolean;
    technicalAnalysis: boolean;
    webSearch: boolean;
  };
}

/**
 * Complete build manifest
 */
interface TickerBuildManifest {
  version: string;
  generatedAt: string;
  enabledCount: number;
  totalCount: number;
  
  // Ticker entries
  tickers: TickerManifestEntry[];
  
  // Bundle optimization data
  bundleInfo: {
    sharedModules: string[];
    tickerSpecificModules: string[];
    estimatedBundleSize: {
      shared: string;
      perTicker: string;
      total: string;
    };
  };
  
  // Validation results
  validation: {
    allValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

/**
 * Get the project root directory
 */
function getProjectRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return join(dirname(currentFile), '..');
}

/**
 * Validate ticker configuration
 */
function validateTickerConfig(config: DynamicTickerConfig): { 
  valid: boolean; 
  errors: string[]; 
  warnings: string[]; 
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic validation
  const { valid: configValid, errors: configErrors } = TickerConfigUtils.validateConfig(config);
  errors.push(...configErrors);
  
  // Check for context module
  const contextPath = join(getProjectRoot(), 'src', 'contexts', `${config.ticker.toLowerCase()}-analysis-context.tsx`);
  const hasContextFile = existsSync(contextPath);
  
  if (!hasContextFile && config.enabled) {
    warnings.push(`No dedicated context file found for ${config.ticker}. Will use factory-generated context.`);
  }
  
  // Check for chat action
  if (config.chatActionPath && config.enabled) {
    // Transform path to file system path
    const actionPath = config.chatActionPath
      .replace('@/', 'src/')
      .replace(/\.ts$/, '') + '.ts';
    
    const fullActionPath = join(getProjectRoot(), actionPath);
    
    if (!existsSync(fullActionPath)) {
      errors.push(`Chat action file not found: ${actionPath}`);
    }
  }
  
  // Feature validation
  if (config.features?.optionsChain && config.category === 'INDEX') {
    warnings.push(`${config.ticker}: Options chain enabled for INDEX category ticker`);
  }
  
  return {
    valid: configValid && errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate manifest entry for a ticker
 */
function generateTickerManifestEntry(config: DynamicTickerConfig): TickerManifestEntry {
  const projectRoot = getProjectRoot();
  
  // Check for dedicated context file
  const contextPath = join(projectRoot, 'src', 'contexts', `${config.ticker.toLowerCase()}-analysis-context.tsx`);
  const hasContextFile = existsSync(contextPath);
  
  // Determine module paths
  const contextModule = hasContextFile 
    ? `@/contexts/${config.ticker.toLowerCase()}-analysis-context`
    : '@/lib/ticker-framework/core/context-factory';
    
  const componentsModule = hasContextFile
    ? `@/components/${config.ticker.toLowerCase()}-tab-content`
    : '@/lib/ticker-framework/core/base-components/component-factory';
  
  // Chat action module
  let chatActionModule: string | undefined;
  if (config.chatActionPath) {
    chatActionModule = config.chatActionPath;
  }
  
  return {
    ticker: config.ticker,
    displayName: config.displayName,
    enabled: config.enabled,
    order: config.order,
    category: config.category || 'STOCK',
    
    hasContext: hasContextFile,
    hasComponents: hasContextFile, // Assume components exist if context exists
    hasChatAction: !!config.chatActionPath,
    
    contextModule,
    componentsModule,
    chatActionModule,
    
    features: {
      aiChat: config.features?.aiChat ?? true,
      optionsChain: config.features?.optionsChain ?? true,
      technicalAnalysis: config.features?.technicalAnalysis ?? true,
      webSearch: config.features?.webSearch ?? true,
    },
  };
}

/**
 * Calculate estimated bundle sizes
 */
function calculateBundleSizes(): {
  shared: string;
  perTicker: string;
  total: string;
} {
  // These are rough estimates based on typical component sizes
  const SHARED_SIZE_KB = 150; // Context factory, component factory, base components
  const PER_TICKER_SIZE_KB = 25; // Each ticker's specific configurations and actions
  
  const enabledTickers = getEnabledTickers();
  const totalSizeKB = SHARED_SIZE_KB + (enabledTickers.length * PER_TICKER_SIZE_KB);
  
  return {
    shared: `${SHARED_SIZE_KB}KB`,
    perTicker: `${PER_TICKER_SIZE_KB}KB`,
    total: `${totalSizeKB}KB`,
  };
}

/**
 * Generate the complete build manifest
 */
function generateBuildManifest(): TickerBuildManifest {
  console.log('🚀 Generating ticker build manifest...');
  
  const enabledTickers = getEnabledTickers();
  const allValidationResults = TICKER_CONFIGS.map(validateTickerConfig);
  
  // Collect all validation results
  const allErrors = allValidationResults.flatMap(r => r.errors);
  const allWarnings = allValidationResults.flatMap(r => r.warnings);
  
  // Generate manifest entries
  const tickerEntries = TICKER_CONFIGS.map(generateTickerManifestEntry);
  
  // Identify shared modules
  const sharedModules = [
    '@/lib/ticker-framework/core/context-factory',
    '@/lib/ticker-framework/core/base-components/component-factory',
    '@/lib/ticker-framework/core/types',
    '@/lib/ticker-logger',
    '@/lib/ticker-registry',
    '@/components/ui/tabs',
    '@/components/ui/card',
    '@/components/ui/badge',
  ];
  
  // Identify ticker-specific modules
  const tickerSpecificModules = tickerEntries
    .filter(entry => entry.enabled)
    .flatMap(entry => [
      entry.contextModule,
      entry.componentsModule,
      ...(entry.chatActionModule ? [entry.chatActionModule] : []),
    ])
    .filter(module => !sharedModules.includes(module));
  
  const manifest: TickerBuildManifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    enabledCount: enabledTickers.length,
    totalCount: TICKER_CONFIGS.length,
    
    tickers: tickerEntries,
    
    bundleInfo: {
      sharedModules,
      tickerSpecificModules,
      estimatedBundleSize: calculateBundleSizes(),
    },
    
    validation: {
      allValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    },
  };
  
  return manifest;
}

/**
 * Write manifest to file
 */
function writeManifest(manifest: TickerBuildManifest): void {
  const projectRoot = getProjectRoot();
  const manifestDir = join(projectRoot, 'src', 'generated');
  const manifestPath = join(manifestDir, 'ticker-manifest.json');
  
  // Ensure directory exists
  if (!existsSync(manifestDir)) {
    mkdirSync(manifestDir, { recursive: true });
  }
  
  // Write manifest
  writeFileSync(
    manifestPath, 
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );
  
  console.log(`✅ Manifest written to: ${manifestPath}`);
}

/**
 * Generate TypeScript types file for the manifest
 */
function generateTypesFile(manifest: TickerBuildManifest): void {
  const projectRoot = getProjectRoot();
  const typesDir = join(projectRoot, 'src', 'generated');
  const typesPath = join(typesDir, 'ticker-manifest.types.ts');
  
  const typeDefinitions = `/**
 * @fileOverview Generated Ticker Manifest Types
 * 
 * This file is automatically generated by the build process.
 * Do not edit manually - changes will be overwritten.
 * 
 * Generated at: ${manifest.generatedAt}
 */

export type GeneratedTickerSymbol = ${manifest.tickers
    .filter(t => t.enabled)
    .map(t => `'${t.ticker}'`)
    .join(' | ')};

export interface GeneratedTickerManifestEntry {
  ticker: GeneratedTickerSymbol;
  displayName: string;
  enabled: boolean;
  order: number;
  category: 'ETF' | 'STOCK' | 'CRYPTO' | 'INDEX';
  
  hasContext: boolean;
  hasComponents: boolean;
  hasChatAction: boolean;
  
  contextModule: string;
  componentsModule: string;
  chatActionModule?: string;
  
  features: {
    aiChat: boolean;
    optionsChain: boolean;
    technicalAnalysis: boolean;
    webSearch: boolean;
  };
}

export interface GeneratedTickerBuildManifest {
  version: string;
  generatedAt: string;
  enabledCount: number;
  totalCount: number;
  tickers: GeneratedTickerManifestEntry[];
  bundleInfo: {
    sharedModules: string[];
    tickerSpecificModules: string[];
    estimatedBundleSize: {
      shared: string;
      perTicker: string;
      total: string;
    };
  };
  validation: {
    allValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

// Re-export the manifest data
export { default as tickerManifest } from './ticker-manifest.json';
`;
  
  // Ensure directory exists
  if (!existsSync(typesDir)) {
    mkdirSync(typesDir, { recursive: true });
  }
  
  writeFileSync(typesPath, typeDefinitions, 'utf-8');
  console.log(`✅ Types file written to: ${typesPath}`);
}

/**
 * Generate dynamic imports file for code splitting
 */
function generateDynamicImportsFile(manifest: TickerBuildManifest): void {
  const projectRoot = getProjectRoot();
  const importsDir = join(projectRoot, 'src', 'generated');
  const importsPath = join(importsDir, 'ticker-imports.ts');
  
  const enabledTickers = manifest.tickers.filter(t => t.enabled);
  
  const importsContent = `/**
 * @fileOverview Generated Dynamic Ticker Imports
 * 
 * This file provides lazy-loaded imports for all enabled tickers.
 * Used for code splitting and dynamic loading of ticker components.
 * 
 * Generated at: ${manifest.generatedAt}
 */

import { lazy } from 'react';

// Dynamic imports for contexts
export const tickerContexts = {
${enabledTickers.map(ticker => 
  `  ${ticker.ticker}: lazy(() => import('${ticker.contextModule}'))`
).join(',\n')}
};

// Dynamic imports for components  
export const tickerComponents = {
${enabledTickers.map(ticker => 
  `  ${ticker.ticker}: lazy(() => import('${ticker.componentsModule}'))`
).join(',\n')}
};

// Chat action paths (not lazy-loaded as these are server functions)
export const tickerChatActionPaths = {
${enabledTickers
  .filter(ticker => ticker.hasChatAction && ticker.chatActionModule)
  .map(ticker => 
    `  ${ticker.ticker}: '${ticker.chatActionModule}'`
  ).join(',\n')}
};

// Ticker metadata for runtime access
export const tickerMetadata = {
${enabledTickers.map(ticker => `  ${ticker.ticker}: ${JSON.stringify({
    ticker: ticker.ticker,
    displayName: ticker.displayName,
    category: ticker.category,
    order: ticker.order,
    features: ticker.features,
  }, null, 4)}`).join(',\n')}
};

// Helper functions
export function getTickerContext(ticker: string) {
  return tickerContexts[ticker as keyof typeof tickerContexts];
}

export function getTickerComponent(ticker: string) {
  return tickerComponents[ticker as keyof typeof tickerComponents];
}

export function getTickerChatActionPath(ticker: string) {
  return tickerChatActionPaths[ticker as keyof typeof tickerChatActionPaths];
}

export function getTickerMetadata(ticker: string) {
  return tickerMetadata[ticker as keyof typeof tickerMetadata];
}
`;
  
  // Ensure directory exists
  if (!existsSync(importsDir)) {
    mkdirSync(importsDir, { recursive: true });
  }
  
  writeFileSync(importsPath, importsContent, 'utf-8');
  console.log(`✅ Dynamic imports file written to: ${importsPath}`);
}

/**
 * Print manifest summary
 */
function printSummary(manifest: TickerBuildManifest): void {
  console.log('\n📊 Ticker Manifest Summary:');
  console.log(`   Total tickers: ${manifest.totalCount}`);
  console.log(`   Enabled tickers: ${manifest.enabledCount}`);
  console.log(`   Estimated bundle size: ${manifest.bundleInfo.estimatedBundleSize.total}`);
  
  if (manifest.validation.errors.length > 0) {
    console.log('\n❌ Validation Errors:');
    manifest.validation.errors.forEach(error => {
      console.log(`   • ${error}`);
    });
  }
  
  if (manifest.validation.warnings.length > 0) {
    console.log('\n⚠️  Validation Warnings:');
    manifest.validation.warnings.forEach(warning => {
      console.log(`   • ${warning}`);
    });
  }
  
  console.log('\n✅ Enabled Tickers:');
  manifest.tickers
    .filter(t => t.enabled)
    .sort((a, b) => a.order - b.order)
    .forEach(ticker => {
      console.log(`   ${ticker.order}. ${ticker.ticker} (${ticker.category})`);
    });
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    console.log('🏗️  Starting ticker manifest generation...\n');
    
    // Generate manifest
    const manifest = generateBuildManifest();
    
    // Write all files
    writeManifest(manifest);
    generateTypesFile(manifest);
    generateDynamicImportsFile(manifest);
    
    // Print summary
    printSummary(manifest);
    
    // Exit with error code if validation failed
    if (!manifest.validation.allValid) {
      console.log('\n💥 Build failed due to validation errors');
      process.exit(1);
    }
    
    console.log('\n🎉 Ticker manifest generation completed successfully!');
    
  } catch (error) {
    console.error('💥 Failed to generate ticker manifest:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}