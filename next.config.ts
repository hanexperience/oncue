import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 1. Fix the Google Auth 404 (redirects /signup to /creators)
      {
        source: '/signup',
        destination: '/creators',
        permanent: false,
      },
      // 2. Fix the Email Typo (redirects /creator to /creators)
      {
        source: '/creator',
        destination: '/creators',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;