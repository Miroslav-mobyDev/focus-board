import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  build: { outDir: 'dist' },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-512-maskable.png'
      ],
      manifest: {
        name: 'FocusBoard',
        short_name: 'Focus',
        start_url: '/focus-board/',
        scope: '/focus-board/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1c1c2b', // тёмный фон
        theme_color: '#6c63ff',     // основной цвет темы
        icons: [
          {
            src: 'icons/windows11/LargeTile.scale-100.png',
            sizes: '310x310',
            type: 'image/png'
          },
          {
            src: 'icons/windows11/SmallTile.scale-100.png',
            sizes: '71x71',
            type: 'image/png'
          },
         
        ],
         screenshots: [
    
  ]
      }
    })
  ]
});



