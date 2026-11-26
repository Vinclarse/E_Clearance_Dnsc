import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
  server: {
    proxy: {
      "/api": {
        target: "https://e-clearance-system-api.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
