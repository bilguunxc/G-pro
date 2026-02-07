const path = require("path");

const API_ORIGIN = (
  process.env.API_ORIGIN ||
  "http://localhost:3000"
).replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      // Reverse-proxy all browser calls from /api/* to the backend.
      // This keeps auth cookies first-party on the frontend origin.
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
