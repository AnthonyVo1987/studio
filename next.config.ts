import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // XState v5 configuration
  webpack: (config, { dev, isServer }) => {
    // Enable source maps for XState debugging in development
    if (dev && !isServer) {
      config.devtool = 'cheap-module-source-map';
    }
    
    // Optimize XState imports
    config.resolve.alias = {
      ...config.resolve.alias,
      // Ensure consistent XState version resolution
      'xstate': require.resolve('xstate'),
      '@xstate/react': require.resolve('@xstate/react'),
    };

    // Fix OpenTelemetry and Genkit build warnings
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // Suppress optional OpenTelemetry dependencies
      '@opentelemetry/exporter-jaeger': false,
      '@genkit-ai/firebase': false,
    };

    // Suppress webpack warnings for Handlebars and other optional dependencies
    config.ignoreWarnings = [
      // Ignore handlebars webpack warnings
      /require.extensions is not supported by webpack/,
      // Ignore OpenTelemetry optional dependencies
      /Can't resolve '@opentelemetry\/exporter-jaeger'/,
      /Can't resolve '@genkit-ai\/firebase'/,
    ];

    // For server-side builds, ignore Node.js specific modules
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        // Mark optional dependencies as external for server builds
        '@opentelemetry/exporter-jaeger': 'commonjs @opentelemetry/exporter-jaeger',
        '@genkit-ai/firebase': 'commonjs @genkit-ai/firebase',
      });
    }
    
    return config;
  },
  // Enable experimental App Router features if needed
  experimental: {
    // Add any experimental features needed for XState
  },
};

export default nextConfig;
