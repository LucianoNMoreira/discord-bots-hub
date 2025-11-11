import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Enable standalone mode for Docker
  output: 'standalone',
  // Disable type checking and ESLint during build (to speed up Docker build)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configure webpack to handle native modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark native modules and discord.js as externals
      // so they are not bundled by webpack
      config.externals.push({
        'zlib-sync': 'commonjs zlib-sync',
        'discord.js': 'commonjs discord.js',
        'bufferutil': 'commonjs bufferutil',
        'utf-8-validate': 'commonjs utf-8-validate',
      });
    }
    return config;
  },
};

export default nextConfig;
