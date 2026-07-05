/** @type {import('next').NextConfig} */
function normalizeBasePath(value) {
  if (!value) return ''
  const trimmed = value.trim().replace(/\/+$/, '')
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] || ''
const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH || repositoryName)

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['a.ppy.sh']
  },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : '',
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  },
  distDir: 'out'
}

module.exports = nextConfig
