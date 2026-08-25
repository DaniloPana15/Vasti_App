/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "kimi-web-img.kimi.ai",
      },
      {
        protocol: "https",
        hostname: "www.everydaywigs.com",
      },
      {
        protocol: "https",
        hostname: "i.ebayimg.com",
      },
      {
        protocol: "https",
        hostname: "img.kwcdn.com",
      },
      {
        protocol: "https",
        hostname: "shinywaywigs.com.au",
      },
      {
        protocol: "https",
        hostname: "www.wigisfashion.com",
      },
    ],
  },
};

module.exports = nextConfig;
