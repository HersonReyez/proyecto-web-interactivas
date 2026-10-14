import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'LARAVEL_')
  const target = process.env.LARAVEL_API_URL || env.LARAVEL_API_URL || 'http://127.0.0.1:8000'
  const proxy = {
    '/api': { target, changeOrigin: true },
    '/sanctum': { target, changeOrigin: true },
  }
  return {
    plugins: [react()],
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 4173, strictPort: true, proxy },
  }
})
