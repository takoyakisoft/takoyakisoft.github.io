import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  optimizeDeps: {
    include: [
      'dhtmlx-gantt',
    ],
  },
  build: {
    rollupOptions: {
      external: [
      ]
    }
  }
})
