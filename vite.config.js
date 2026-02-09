import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Define se está em produção
const isProduction = process.env.NODE_ENV === 'production'
const basePath = isProduction ? '/controle-mari/' : '/'

export default defineConfig({
  // Base SEMPRE com a barra final
  base: basePath,
  
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'robots.txt'],
      
      // ✅ CORREÇÃO CRÍTICA: Manifest deve ter caminhos ABSOLUTOS
      manifest: {
        name: 'App Mari - Controle Salão',
        short_name: 'App Mari',
        description: 'Sistema de gestão para salões de beleza',
        theme_color: '#8b5cf6',
        background_color: '#ffffff',
        display: 'standalone',
        scope: basePath,
        start_url: basePath,
        id: basePath, // ✅ IMPORTANTE para iOS
        
        icons: [
          {
            // ✅ CAMINHO ABSOLUTO com basePath
            src: `${basePath}pwa-192x192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: `${basePath}pwa-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: `${basePath}index.html`,
        skipWaiting: true,
        clientsClaim: true,
        
        // ✅ Runtime caching para melhor controle
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              }
            }
          }
        ]
      },
      
      // ✅ Configurações específicas para iOS
      manifestFilename: 'manifest.webmanifest',
      includeManifestIcons: false, // Desabilita geração automática (conflict)
      strategies: 'generateSW'
    })
  ],
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    
    // ✅ Gera hashes únicos para bust cache
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})