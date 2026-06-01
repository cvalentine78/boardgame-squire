import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Next.js Image to fetch, resize, and convert external thumbnails to WebP
  images: {
    remotePatterns: [
      {
        // BoardGameGeek CDN — game thumbnails
        protocol: 'https',
        hostname: 'cf.geekdo-images.com',
      },
      {
        // Supabase Storage — rules PDFs thumbnails (future-proof)
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    // Serve modern formats — WebP is ~30% smaller than JPEG/PNG
    formats: ['image/webp', 'image/avif'],
  },

  // Strip console.log/warn in production bundles
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error'] }
      : false,
  },
};

export default nextConfig;
