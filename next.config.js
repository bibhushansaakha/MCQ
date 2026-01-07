/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    // Fix webpack chunk loading issues
    if (dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        chunkIds: 'named',
      };
    }
    return config;
  },
  // Disable static optimization for dynamic routes to prevent cache issues
  experimental: {
    optimizePackageImports: ['recharts'],
  },
}

module.exports = nextConfig

