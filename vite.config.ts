import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enableCache = env.ENABLE_CACHE === "true";

  return {
    define: {
      __ENABLE_CACHE__: JSON.stringify(enableCache)
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src")
      }
    },
    build: {
      sourcemap: mode === "development",
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
          sw: resolve(__dirname, "src/pwa/sw.ts")
        },
        output: {
          entryFileNames: (chunk) => {
            return chunk.name === "sw" ? "sw.js" : "assets/[name]-[hash].js";
          }
        }
      }
    }
  };
});
