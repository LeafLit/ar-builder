import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  cacheDir: ".vite-cache",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["manifest.webmanifest"],
      manifest: {
        name: "AR Builder",
        short_name: "AR Builder",
        description: "手机端 AR 原型制作工具",
        theme_color: "#111827",
        background_color: "#f8fafc",
        display: "standalone",
        start_url: "/"
      }
    })
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true
  }
});
