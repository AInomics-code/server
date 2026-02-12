import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  const plugins = [
    react(),
    runtimeErrorOverlay(),
  ];
  
  // Conditionally add Replit plugin
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    const cartographer = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer.cartographer());
  }
  
  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: true,
      port: 5173,
      allowedHosts: true, // allow ladona.ainomics.online and any other host
      proxy: {
        // Proxy all /api requests to backend to avoid CORS issues
        '/api': {
          target: env.VITE_API_URL || env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path, // Keep the /api prefix
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Proxying:', req.method, req.url, '→', proxyReq.path);
            });
          },
        }
      }
    },
    // Expose environment variables to the client
    define: {
      'import.meta.env.NEXT_PUBLIC_API_URL': JSON.stringify(env.NEXT_PUBLIC_API_URL || env.VITE_API_URL || 'https://ladonaapi.ainomics.online'),
      'import.meta.env.NEXT_PUBLIC_APP_LANGUAGE': JSON.stringify(env.NEXT_PUBLIC_APP_LANGUAGE || env.VITE_APP_LANGUAGE || 'en'),
      'import.meta.env.VITE_APP_LANGUAGE': JSON.stringify(env.VITE_APP_LANGUAGE || env.NEXT_PUBLIC_APP_LANGUAGE || 'en'),
    },
  };
});
