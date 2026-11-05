import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/users": "http://localhost:3000",
      "/owners": "http://localhost:3000",
      "/products": "http://localhost:3000",
      "/orders": "http://localhost:3000",
    },
  },
});
