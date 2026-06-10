import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
    dangerouslyAllowSVG: false,
  },
  experimental: {
    // Allows larger file uploads in serverless functions
    serverActions: { bodySizeLimit: '50mb' },
  },
};

export default nextConfig;
