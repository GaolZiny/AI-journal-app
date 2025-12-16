import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,  // 允许局域网访问
    port: 5173,
    allowedHosts: true,  // 允许所有域名访问（开发模式下通过反向代理）
  },
})
