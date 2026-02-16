import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/pages': path.resolve(__dirname, './src/pages'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/contexts': path.resolve(__dirname, './src/contexts'),
        '@/config': path.resolve(__dirname, './src/config'),
        '@/assets': path.resolve(__dirname, './src/assets'),
        // Explicitly resolve React to avoid multiple instances
        'react': path.resolve(__dirname, './node_modules/react'),
        'react-dom': path.resolve(__dirname, './node_modules/react-dom')
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // React core libraries
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Form handling
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            // UI libraries
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-label',
              '@radix-ui/react-select',
              '@radix-ui/react-slot',
              'lucide-react',
              'react-icons'
            ],
            // Chart libraries (split into separate chunks as they're very large)
            'chartjs': ['chart.js'],
            'react-chartjs': ['react-chartjs-2'],
            'recharts': ['recharts'],
            // Map libraries (split as leaflet is large)
            'leaflet': ['leaflet'],
            'react-leaflet': ['react-leaflet'],
            // PDF/Export libraries
            'export-vendor': ['jspdf', 'jspdf-autotable', 'html2canvas'],
            // Query and state management
            'query-vendor': ['@tanstack/react-query'],
            // Utilities
            'utils-vendor': ['axios', 'moment', 'clsx', 'tailwind-merge', 'class-variance-authority'],
            // Analytics
            'analytics-vendor': ['posthog-js']
          }
        }
      },
      // Increase chunk size warning limit to 1000kb (1MB) to suppress warnings for large vendor chunks
      chunkSizeWarningLimit: 1000
    },
    server: {
      port: parseInt(env.PORT) || 5173,
      host: 'localhost', // Use localhost instead of 127.0.0.1 to match CORS
      strictPort: false, // Allow Vite to find another port if unavailable
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: parseInt(env.PORT) || 5173,
      host: '0.0.0.0',
      strictPort: false, // Allow fallback port
      allowedHosts: ['urutix.com', 'www.urutix.com', '161.97.148.53'],
    },
  }
})
