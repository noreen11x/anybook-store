import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lets a production build run alongside `next dev` without sharing the .next folder
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // cover uploads are capped at 1.5 MB in the action itself
    serverActions: { bodySizeLimit: "2mb" },
  },
  poweredByHeader: false,
};

export default nextConfig;
