import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-vendor': ['jspdf', 'html2canvas']
        }
      }
    },
    // Optional: Slightly raise the limit if vendor chunk is still large, 
    // but splitting is the primary goal.
    chunkSizeWarningLimit: 1000 
  }
})
