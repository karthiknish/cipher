import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@convex": fileURLToPath(new URL("./convex", import.meta.url)),
    },
  },
  ssr: {
    noExternal: ["@convex-dev/better-auth"],
  },
  plugins: [
    tanstackStart(),
    // Nitro compiles the server for deployment (Vercel auto-detects TanStack Start + Nitro)
    nitro(),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
  ],
});
