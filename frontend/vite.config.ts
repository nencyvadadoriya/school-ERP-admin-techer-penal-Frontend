import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://school-erp-admin-techer-penal-backe.vercel.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})