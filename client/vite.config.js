import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Listen on all network interfaces
      port: 5173,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'antd-vendor': ['antd', '@ant-design/icons'],
            'chart-vendor': ['chart.js', 'react-chartjs-2', 'recharts']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['@ant-design/icons', 'antd']
    }
  }
})
