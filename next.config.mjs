/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure experimental features
  experimental: {
    // Disable optimizations that might interfere
    optimizeCss: false,
    optimizePackageImports: [],
  },
  // Empty turbopack config to prevent warnings
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Webpack configuration for font loading
  webpack: (config) => {
    // Add alias to resolve font loading issues
    config.resolve.alias = {
      ...config.resolve.alias,
      // Fix for font loading
      '@vercel/turbopack-next/internal/font/google/font': 'next/font/google/font',
      'next/font/google': require.resolve('next/font/google')
    };
    return config;
  },
  // Disable server actions logging in development
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Enable styled-components compiler
  compiler: {
    styledComponents: true,
  },
}

export default nextConfig
