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
    domains: [
      'images.unsplash.com', // Unsplash sample/property images
      'unsplash.com',        // Fallback Unsplash host (rare but safe)
      'localhost',           // Local backend files served via http://localhost:8000/uploads
      'picsum.photos'        // Random placeholder images
    ],
  },
};

module.exports = nextConfig; 