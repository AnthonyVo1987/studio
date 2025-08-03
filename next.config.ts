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
    
    return config;
  },
  // Enable experimental App Router features if needed
  experimental: {
    // Add any experimental features needed for XState
  },
};

export default nextConfig;
