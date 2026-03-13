const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
    // App directory is enabled by default in Next.js 14
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@': path.resolve(__dirname),
        }
        return config
    },
}

module.exports = nextConfig