import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/niwamiri-bonsai/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'NiwaMirî',
        short_name: 'NiwaMirî',
        description: 'Gestión de colecciones Bonsai con IA',
        theme_color: '#0e1a13',
        background_color: '#0e1a13',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/niwamiri-bonsai/',
        scope: '/niwamiri-bonsai/',
        icons: [
          { src: '/niwamiri-bonsai/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/niwamiri-bonsai/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/niwamiri-bonsai/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-css',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
