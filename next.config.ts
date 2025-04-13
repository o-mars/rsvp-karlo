import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  // Optional: Add trailingSlash if you want URLs to end with a slash
  trailingSlash: true,
};

export default nextConfig;
