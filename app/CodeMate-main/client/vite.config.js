// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   base: "/", // 🔥 VERY IMPORTANT FOR CLOUDFRONT

//   build: {
//     chunkSizeWarningLimit: 5000,
//     rollupOptions: {
//       output: {
//         manualChunks(id) {
//           if (id.includes("node_modules")) {
//             return "vendor";
//           }
//         },
//       },
//     },
//   },

//   plugins: [react()],

//   define: {
//     "process.env": {},
//   },

//   server: {
//     proxy: {
//       "/api": {
//         target: "http://localhost:5000",
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
// });
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
});
