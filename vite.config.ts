import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  plugins: [react()],
  publicDir: "public",
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/health": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/favicon.ico": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: [
      "5940-2401-4900-8820-77ab-410d-5d13-c8fe-7929.ngrok-free.app",
      "818c8593-89e8-4773-b845-5c49e9459543-00-2tu0fb8lculis.janeway.replit.dev",
      "localhost",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: "assets/index-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
