import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',

    setupFiles: [
      './src/test/setup.ts',
    ],

    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
    ],

    exclude: [
      'node_modules',
      'dist',
      'e2e',
    ],

    coverage: {
      provider: 'v8',

      reporter: [
        'text',
        'html',
      ],

      exclude: [
        'node_modules',
        'src/test/**',
        'src/**/*.d.ts',
        'src/assets/**',
        'src/main.tsx',
        'src/App.tsx',
        'src/app/router.tsx',
        'src/components/ui/**',
      ],
    },
  },
})
