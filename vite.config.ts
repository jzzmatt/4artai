import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";

const supabaseApi = ({ url }: { url: URL }) => {
  const path = url.pathname;
  return (
    url.hostname.includes("supabase") ||
    path.startsWith("/auth/v1") ||
    path.startsWith("/rest/v1") ||
    path.startsWith("/storage/v1") ||
    path.startsWith("/realtime/v1") ||
    path.startsWith("/functions/v1")
  );
};

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "QuadreStudio",
        short_name: "Quadre",
        description: "Museum-grade generative atelier for three-panel quadres.",
        theme_color: "#F5F4F0",
        background_color: "#F5F4F0",
        display: "standalone",
        start_url: "/",
        scope: "/",
        lang: "en",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,webp,ico,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/auth\/v1/, /^\/rest\/v1/, /^\/storage\/v1/, /^\/functions\/v1/, /^\/realtime\/v1/],
        runtimeCaching: [
          {
            urlPattern: supabaseApi,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "quadrestudio-fonts",
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
});
