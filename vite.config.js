import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), "");
    var enableCache = env.ENABLE_CACHE === "true";
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
                    entryFileNames: function (chunk) {
                        return chunk.name === "sw" ? "sw.js" : "assets/[name]-[hash].js";
                    }
                }
            }
        }
    };
});
