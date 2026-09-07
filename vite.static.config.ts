import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

// Static SPA for here.now: client-only Vite build, no Workers / no POST /api/coach.
export default defineConfig({
  root: resolve(rootDir, "spa"),
  base: "/",
  publicDir: resolve(rootDir, "public"),
  plugins: [react()],
  css: {
    postcss: resolve(rootDir, "postcss.config.mjs"),
  },
  build: {
    outDir: resolve(rootDir, "dist-static"),
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
