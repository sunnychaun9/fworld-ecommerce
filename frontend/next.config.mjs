import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the monorepo root so file-tracing ignores unrelated lockfiles elsewhere
  // on the machine and produces correct standalone output paths.
  outputFileTracingRoot: path.join(import.meta.dirname, '..'),
  // Standalone output produces a lean self-contained server for Docker.
  // It relies on symlinks, which require elevated privileges on Windows, so it
  // is opt-in via BUILD_STANDALONE (enabled in docker/frontend.Dockerfile).
  // Vercel ignores this and uses its own output target.
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  experimental: {
    // Optimize bundling of large, frequently used packages.
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Cloudflare R2 / CDN-served assets. Tighten hostnames before production.
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.cloudflarestorage.com' },
      // Storefront product/collection imagery is served from arbitrary CDNs and
      // the local API in dev. Broadly allow https here; the media component
      // degrades gracefully when an image is missing or fails to load.
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

export default nextConfig;
