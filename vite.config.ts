// vite.config.ts
import { defineConfig } from 'vite';

// Путь зависит от твоего GitHub репозитория
const repoName = 'focus-board';

export default defineConfig({
  base: `/${repoName}/`, // важно: имя репозитория
});
