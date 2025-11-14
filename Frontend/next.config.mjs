/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to support dynamic routes and SSR
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
