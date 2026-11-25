import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function noStoreProtectedPages() {
  return {
    name: 'no-store-protected-pages',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url || '').split('?')[0]
        if (/^\/(dashboard|admin|signatory)(\/|$)/.test(path)) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), noStoreProtectedPages()],
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
