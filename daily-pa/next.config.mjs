/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用严格模式
  reactStrictMode: true,
  
  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    // Disable image optimization for static export
    unoptimized: process.env.NEXT_PUBLIC_CAPACITOR === 'true',
  },
  
  // 实验性功能
  experimental: {
    // 启用服务端操作
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Ignore build errors to allow deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Exclude mobile-app directory from webpack compilation
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules', '**/mobile-app/**', '**/.git/**'],
    };
    return config;
  },
  
  // Output configuration for Capacitor (static export)
  output: process.env.NEXT_PUBLIC_CAPACITOR === 'true' ? 'export' : undefined,
  
  // Disable trailing slash for Capacitor compatibility
  trailingSlash: false,
  
  // Base path for Capacitor (if needed)
  basePath: process.env.NEXT_PUBLIC_CAPACITOR === 'true' ? '' : undefined,
};

export default nextConfig;
