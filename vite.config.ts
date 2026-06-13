import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Middleware to prevent SPA fallback for /models/ requests.
    // Without this, missing model files get served as index.html (HTML),
    // which @xenova/transformers tries to JSON.parse → "Unexpected token '<'"
    {
      name: 'models-404',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/models/')) {
            const filePath = path.join(process.cwd(), 'public', req.url)
            if (!fs.existsSync(filePath)) {
              res.statusCode = 404
              res.end('Not found')
              return
            }
          }
          next()
        })
      },
    },
    react(),
    tailwindcss(),
  ],
})
