// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import path from "path";

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
//   server: {
//     port: 5174,
//     proxy: {
//       "/api": {
//         target: "https://sp-builder-backend.vercel.app",
//         changeOrigin: true,
//         secure: true,
//       },
//       "/uploads": {
//         target: "https://sp-builder-backend.vercel.app",
//         changeOrigin: true,
//         secure: true,
//       },
//     },
//   },
// });



import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { injectGoogleSiteVerificationMeta } from "./vite.gsc-meta";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), injectGoogleSiteVerificationMeta()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
