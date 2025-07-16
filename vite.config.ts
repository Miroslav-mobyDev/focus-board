import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: './',
  build: { outDir: 'dist' },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FocusBoard',
        short_name: 'FocusBoard',
        start_url: '/focus-board/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4caf50',
        
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
    }),
  ],
});


