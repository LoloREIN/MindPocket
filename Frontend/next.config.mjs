/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' - let Amplify handle Next.js naturally
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
