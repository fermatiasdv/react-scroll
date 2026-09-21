import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,jsx}'],
  },
  resolve: {
    alias: {
      '@scroll/layout': fileURLToPath(
        new URL('./legacy/my-initial-store/assets/scroll-layout.js', import.meta.url),
      ),
    },
  },
})
