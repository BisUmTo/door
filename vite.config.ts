import { createReadStream } from "node:fs";
import { cp, mkdir, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";

const normalizeFsPath = (value: string) => value.replace(/\\/g, "/").replace(/\/+$/, "");
const ASSETS_PREFIX = "/assets/";
const ASSETS_ROOT = resolve(__dirname, "assets");
const NORMALIZED_ASSETS_ROOT_NO_SLASH = normalizeFsPath(ASSETS_ROOT);
const NORMALIZED_ASSETS_ROOT = `${NORMALIZED_ASSETS_ROOT_NO_SLASH}/`;

const mimeTypes: Record<string, string> = {
  ".json": "application/json",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".psd": "image/vnd.adobe.photoshop",
  ".psb": "image/vnd.adobe.photoshop",
  ".py": "text/x-python"
};

const createStaticAssetPlugins = (): PluginOption[] => {
  let buildOutDir = "dist";

  const servePlugin: PluginOption = {
    name: "static-assets-serve",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url;
        if (!rawUrl) {
          return next();
        }

        let pathname: string;
        try {
          pathname = new URL(rawUrl, "http://localhost").pathname;
        } catch {
          return next();
        }

        if (!pathname.startsWith(ASSETS_PREFIX)) {
          return next();
        }

        const relativePath = decodeURIComponent(pathname.slice(ASSETS_PREFIX.length));
        const filePath = resolve(ASSETS_ROOT, relativePath);
        const normalizedPath = normalizeFsPath(filePath);
        if (
          normalizedPath !== NORMALIZED_ASSETS_ROOT_NO_SLASH &&
          !normalizedPath.startsWith(NORMALIZED_ASSETS_ROOT)
        ) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }

        try {
          const fileStats = await stat(filePath);
          if (!fileStats.isFile()) {
            return next();
          }

          res.setHeader("Content-Type", mimeTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream");
          res.setHeader("Cache-Control", "no-store");
          const stream = createReadStream(filePath);
          stream.on("error", (error) => {
            next(error);
          });
          stream.pipe(res);
        } catch {
          next();
        }
      });
    }
  };

  const copyPlugin: PluginOption = {
    name: "static-assets-copy",
    apply: "build",
    configResolved(config) {
      buildOutDir = config.build.outDir;
    },
    async closeBundle() {
      const target = resolve(buildOutDir, "assets");
      await mkdir(target, { recursive: true });
      await cp(ASSETS_ROOT, target, { recursive: true, force: true });
    }
  };

  return [servePlugin, copyPlugin];
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enableCache = env.ENABLE_CACHE === "true";
  const staticAssetPlugins = createStaticAssetPlugins();

  return {
    base: "./",
    define: {
      __ENABLE_CACHE__: JSON.stringify(enableCache)
    },
    plugins: [react(), ...staticAssetPlugins],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src")
      }
    },
    assetsInclude: ["**/*.psd", "**/*.psb"],
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
