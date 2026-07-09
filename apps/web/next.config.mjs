/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { hostname: 'img.clerk.com' },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
};
export default nextConfig;
