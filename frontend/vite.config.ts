import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

const normalizeBasePath = (value: string | undefined): string => {
  const raw = value?.trim();
  if (!raw || raw === "/") {
    return "/";
  }

  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.API_PROXY_TARGET || "http://localhost:2455";
  const publicBasePath = normalizeBasePath(env.VITE_PUBLIC_BASE_PATH);

  return {
    base: publicBasePath,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src"),
      },
    },
    server: {
      proxy: {
        "/api": proxyTarget,
        "/v1": proxyTarget,
        "/backend-api": proxyTarget,
        "/health": proxyTarget,
      },
    },
    build: {
      outDir: "../app/static",
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-query": ["@tanstack/react-query"],
            "vendor-charts": ["recharts"],
            "vendor-ui": ["radix-ui"],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      exclude: ["screenshots/**", "node_modules/**"],
      testTimeout: 15_000,
      coverage: {
        provider: "v8",
        reporter: ["text", "html"],
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },
      },
    },
  };
});
