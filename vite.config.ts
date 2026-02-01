import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const TUNNEL_DOMAIN = process.env.VITE_TUNNEL_DOMAIN
const DISABLE_TUNNEL_HMR = process.env.VITE_TUNNEL_DISABLE_HMR === '1'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'https://api.mashynbazar.com',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'https://api.mashynbazar.com',
        changeOrigin: true,
        secure: false,
      },
      '/api/ws': {
        target: 'wss://api.mashynbazar.com',
        ws: true,
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api\/ws/, '/ws'),
        configure: (proxy) => {
          proxy.on('proxyReqWs', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://mashynbazar.com');
          });
        },
      },
    },
    hmr: DISABLE_TUNNEL_HMR
      ? false
      : TUNNEL_DOMAIN
        ? {
            host: TUNNEL_DOMAIN,
            protocol: 'wss',
            clientPort: 443,
          }
        : undefined,
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
