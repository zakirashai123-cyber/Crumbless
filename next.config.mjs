/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // app/route.ts reads public/landing.html at runtime with fs.readFile. Next's
    // build tracer can't follow that computed path, so on Vercel the file would be
    // missing from the serverless bundle and "/" would 500. Force-include it.
    outputFileTracingIncludes: {
      "/": ["./public/landing.html"],
    },
  },
};
export default nextConfig;
