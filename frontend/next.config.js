const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
    // App directory is enabled by default in Next.js 14
    webpack: (config, { isServer }) => {
        // Add alias for @ symbol
        config.resolve.alias['@'] = path.join(__dirname)

        return config
    },
}

module.exports = nextConfig
