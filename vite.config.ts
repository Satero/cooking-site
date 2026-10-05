import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// Tests run in a US timezone on purpose: a UTC-offset zone is what exposes the
// `new Date("YYYY-MM-DD")` off-by-one-day bug that src/data/dates.ts guards against.
process.env.TZ = 'America/Detroit'

// https://vite.dev/config/
export default defineConfig({
  // `base` stays '/' here; the GitHub Pages workflow builds with --base=/cooking-site/.
  plugins: [
    react(),
    // Installable app + offline support. The service worker precaches the built
    // files, so after one visit the app opens with no signal (e.g. in a store).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Cooking Site',
        short_name: 'Cooking',
        description: 'Recipes, meal schedule, shopping list, and cooking steps.',
        display: 'standalone',
        background_color: '#faf8f5',
        theme_color: '#c2410c',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
