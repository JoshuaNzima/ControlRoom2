import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                // Split vendor and large libs into separate chunks.
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                            // Keep react + react-dom + charting libs + lucide-react together to avoid
                            // initialization/order issues when icons are imported by name in many modules.
                            if (
                                id.includes('react') ||
                                id.includes('react-dom') ||
                                id.includes('chart.js') ||
                                id.includes('lucide-react')
                            ) {
                                return 'vendor-react';
                            }
                            return 'vendor';
                        }
                },
            },
        },
        chunkSizeWarningLimit: 1200, // increase warning limit slightly
    },
});
