import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true, // Pour éviter les soucis de cache sur VPS sans config avancée
  }
};

export default nextConfig;
