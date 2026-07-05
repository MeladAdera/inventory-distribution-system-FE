import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
});

// Serwist injects a `webpack` config, which Turbopack (Next 16's default dev
// bundler) errors on. So only wrap for the production build — which runs on
// webpack via `next build --webpack`. Dev stays on plain Turbopack with no SW
// (the SW is a production concern and would only fight hot reload anyway).
const isDev = process.env.NODE_ENV === 'development';

export default isDev ? nextConfig : withSerwist(nextConfig);
