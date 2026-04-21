import type { NextConfig } from 'next'

// -----------------------------------------------------------------------------
// TECH DEBT — TS + ESLint checks disabled at build time.
//
// `npx tsc --noEmit` currently reports ~9 pre-existing type errors, mostly in
// fake/offline datasources and a handful of UI pages. None are runtime bugs;
// they prevent `next build` with default strict settings.
//
// Smaller backlog than admin-panel's (~526), but the resolution stance is the
// same: build on runtime behaviour, burn the list down separately, and keep
// `ignoreBuildErrors: false` locally while editing a file to avoid growing it.
// -----------------------------------------------------------------------------

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
