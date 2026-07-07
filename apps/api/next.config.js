/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  experimental: {
    instrumentationHook: true,
  },
}

module.exports = nextConfig
