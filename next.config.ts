import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Habilitar modo standalone para Docker
  output: 'standalone',
  // Desabilitar verificação de tipos e ESLint durante o build (para acelerar o build Docker)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configurar webpack para lidar com módulos nativos
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Marcar módulos nativos e discord.js como externos
      // para que não sejam empacotados pelo webpack
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
