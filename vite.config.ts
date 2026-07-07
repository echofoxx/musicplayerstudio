import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Echo — Music Player',
        short_name: 'Echo',
        description: 'A browser-based music player for local files and streaming sources.',
        theme_color: '#101012',
        background_color: '#101012',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell only — audio blobs/IndexedDB are handled at runtime, not
        // by the service worker, so there's no reason to precache anything
        // beyond the built HTML/JS/CSS/icons.
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
})
