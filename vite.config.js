import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(async () => {
  let cloudflarePlugin = [];

  try {
    const { cloudflare } = await import('@cloudflare/vite-plugin');
    cloudflarePlugin = [cloudflare()];
  } catch {
    // Optional for local/dev: app should still run without this package.
  }

  return {
    plugins: [react(), ...cloudflarePlugin],
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('node_modules')) return 'vendor-react';
          },
        },
      },
    },
  };
});
