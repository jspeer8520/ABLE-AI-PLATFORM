/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  images: {
    remotePatterns: [
      { hostname: 'img.clerk.com' },
    ],
  },
}

module.exports = nextConfig
