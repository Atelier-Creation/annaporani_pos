import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    allowedHosts: [
      'localhost',
      '127.0.0.1'
    ],
    historyApiFallback: true,
    proxy: {
      // Proxy API calls to backend
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true,
      },
      // Proxy selfie images to backend
      '/selfies': {
        target: 'http://localhost:10000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    allowedHosts: [
      'billing-frontend-kdco.onrender.com'
    ],
    host: '0.0.0.0',
    port: process.env.PORT || 4174
  }
})
