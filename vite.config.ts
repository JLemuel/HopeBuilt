import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5174,
    strictPort: false,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "convex/react": path.resolve(__dirname, "./src/mocks/convex/react.tsx"),
      "convex/values": path.resolve(__dirname, "./src/mocks/convex/values.ts"),
      "@convex-dev/auth/react": path.resolve(
        __dirname,
        "./src/mocks/convex/auth-react.tsx",
      ),
      "@stripe/react-stripe-js": path.resolve(
        __dirname,
        "./src/mocks/stripe/react-stripe-js.tsx",
      ),
      "@stripe/stripe-js": path.resolve(
        __dirname,
        "./src/mocks/stripe/stripe-js.ts",
      ),
      "@/convex": path.resolve(__dirname, "./src/mocks/convex"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
