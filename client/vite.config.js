import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true, 
    proxy: {
      '/api': {
        target: 'http://localhost:6000',
        changeOrigin: true,
      },
      '/media-api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/media-api/, '/api')
      }
    },

    allowedHosts: [
      'localhost',
      'andhyy.com',
      'planetaanime.andhyy.com',
      'api-planetaanime.andhyy.com',
      'cdn.andhyy.com'
    ],
  },
})
