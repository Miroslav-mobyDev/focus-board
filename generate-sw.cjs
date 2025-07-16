const workboxBuild = require('workbox-build');

// Генерация service-worker.js в папке dist
workboxBuild.generateSW({
  globDirectory: 'dist',
  globPatterns: [
    '**/*.{js,css,html,png,svg,ico,json}'
  ],
  swDest: 'dist/sw.js',
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [{
    urlPattern: ({request}) => request.destination === 'document' || request.destination === 'script' || request.destination === 'style',
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'assets',
    },
  }]
}).then(({ count, size }) => {
  console.log(`Generated sw.js, which will precache ${count} files (${size} bytes).`);
});
