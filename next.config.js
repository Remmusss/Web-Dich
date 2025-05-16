/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['img.youtube.com'],
  },
  webpack: (config, { isServer }) => {
    // Handle cheerio and undici
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
      url: false,
      stream: false,
      http2: false,
      perf_hooks: false,
      'utf-8-validate': false,
      bufferutil: false
    };

    // Add source-map-support
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'source-map-support': false,
      }
    }

    return config;
  },
}

module.exports = nextConfig 