import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "Summit Money",
        short_name: "Summit",
        description: "Personal money command center",
        theme_color: "#060a12",
        background_color: "#060a12",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        shortcuts: [
          { name: "Log spending", short_name: "Spend", url: "/?tab=spend", icons: [{ src: "pwa-192x192.png", sizes: "192x192" }] },
          { name: "Casino", short_name: "Casino", url: "/?tab=casino", icons: [{ src: "pwa-192x192.png", sizes: "192x192" }] },
          { name: "Goals", short_name: "Goals", url: "/?tab=goals", icons: [{ src: "pwa-192x192.png", sizes: "192x192" }] },
        ],
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"] },
    }),
  ],
});
