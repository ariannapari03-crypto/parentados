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
      manifest: {
        name: 'FESTIVA',
        short_name: 'FESTIVA',
        description: 'Organizza feste ed eventi, scopri i locali di Alba e le loro promozioni.',
        theme_color: '#A8B5A0',
        background_color: '#F7E7CE',
        display: 'standalone',
        lang: 'it',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
