import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "lain.bgm.tv",
      },
    ],
  },
};

export default nextConfig;
