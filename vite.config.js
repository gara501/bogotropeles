import { defineConfig } from 'vite';

// Phaser is ~1.2 MB of the bundle: its own chunk keeps it cached across game updates
// and lets the browser parse it in parallel with the game code.
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
  },
});
