/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Increase memory limit for webpack
    config.performance = {
      ...config.performance,
      maxAssetSize: 1000000,
      maxEntrypointSize: 1000000,
    };
    return config;
  },
  experimental: {
    // Increase memory limit for Next.js
    memoryLimit: 4096
  }
};

export default nextConfig;
