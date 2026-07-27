import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  // ponytail: compress + poweredByHeader off
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
