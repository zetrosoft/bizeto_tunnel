import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 6500,
    watch: {
      usePolling: true,
    },
    host: true,
    allowedHosts: ["bijexa.samkarsa.com", "api.samkarsa.com"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
