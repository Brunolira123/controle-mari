import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // A base só deve ser aplicada em produção para GitHub Pages
  base: process.env.NODE_ENV === 'production' ? '/controle-mari/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'apple-touch-icon-*.png', 
        'favicon-16x16.png',
        'favicon-32x32.png',
        'pwa-192x192.png',
        'pwa-512x512.png'
      ],
      manifest: {
        name: 'App Mari - Controle Salão',
        short_name: 'App Mari',
        description: 'Sistema de gestão para salões de beleza',
        theme_color: '#8b5cf6',
        background_color: '#ffffff',
        display: 'standalone',
        scope: process.env.NODE_ENV === 'production' ? '/controle-mari/' : '/',
        start_url: process.env.NODE_ENV === 'production' ? '/controle-mari/' : '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json}'],
        navigateFallback: process.env.NODE_ENV === 'production' ? '/controle-mari/index.html' : '/index.html',
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  }
})