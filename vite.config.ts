import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://api.strikefinance.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
      '/price-api': {
        target: 'https://api.strikefinance.org/price',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/price-api/, ''),
        secure: false,
      },
      '/testnet-api': {
        target: 'https://api-v2-testnet.strikefinance.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/testnet-api/, ''),
        secure: false,
      },
    },
  },
})
