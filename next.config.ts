import type { NextConfig } from 'next';

// Set BASE_PATH when the site is served from a sub-folder, e.g. BASE_PATH=/system-design-prep
// for GitHub Pages. Leave it unset when the site sits at the root of its domain.
const basePath = process.env.BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  serverExternalPackages: ['shiki', '@shikijs/rehype', '@mdx-js/mdx'],
};

export default nextConfig;
