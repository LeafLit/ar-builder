import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { createPwaManifestPaths, getDeployBase } from "./deploymentPaths";

export default defineConfig({
  base: getDeployBase(),
  cacheDir: ".vite-cache",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["manifest.webmanifest"],
      manifest: (() => {
        const paths = createPwaManifestPaths();

        return {
        name: "AR Builder",
        short_name: "AR Builder",
        description: "手机端 AR 原型制作工具",
        theme_color: "#111827",
        background_color: "#f8fafc",
        display: "standalone",
        scope: paths.scope,
        start_url: paths.startUrl,
        icons: [
          {
            src: paths.icon192,
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: paths.icon512,
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: paths.maskable512,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
        };
      })()
    })
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true
  }
});
