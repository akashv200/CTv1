import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    allowedHosts: [
      "sb-1gakxiucqmn2.vercel.run",
      "localhost",
      "127.0.0.1",
      ".vercel.app"
    ],
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true
      },
      "/graphql": {
        target: "http://localhost:4000",
        changeOrigin: true
      },
      "/socket.io": {
        target: "http://localhost:4000",
        ws: true
      }
    }
  }
});
