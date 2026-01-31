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
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'antd-core': ['antd'],
            'antd-icons': ['@ant-design/icons'],
            'chart-vendor': ['recharts'],
            'utils': ['axios']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['@ant-design/icons', 'antd']
    }
  }
})
