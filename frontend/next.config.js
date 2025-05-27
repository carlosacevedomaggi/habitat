/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add other Next.js configurations here as needed
  // For example, to use environment variables:
  // env: {
  //   API_BASE_URL: process.env.API_BASE_URL,
  // },
  // For image optimization from external sources (if not using cloud storage directly served):
  images: {
    // Allow loading images from Unsplash and local backend during development
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'backend', // Docker service name for backend
        port: '8000',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/api/:path*', // Proxy to backend service
      },
    ];
  },
};

module.exports = nextConfig;