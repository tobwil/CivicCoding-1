import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify uses native Next.js; the existing Sites build still uses vinext.
  typescript: { tsconfigPath: "tsconfig.next.json" },
};

export default nextConfig;
