/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  publicExcludes: ['/api/*'],
  buildExcludes: [/chunks\/.+\.js$/],
  workboxOptions: {
    disableDevLogs: true,
    cleanupOutdatedCaches: true,
    runtimeCaching: {
      maxAgeSeconds: 60 * 60 * 24 * 30,
    },
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  images: {
    domains: ['example.com'], // Add your image domains here
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  experimental: {
    optimizeCss: true,
    optimizeImages: true,
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  webpack(config, { isServer }) {
    // Custom webpack config if needed
    return config;
  },
};

module.exports = withPWA(nextConfig);