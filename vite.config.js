import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react({
            include: "**/*.{jsx,tsx}",
        }),
    ],
    resolve: {
        dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
        include: [
            'react', 'react-dom', 'react/jsx-runtime', 'react-is', 'recharts',
            '@headlessui/react', '@heroicons/react', '@inertiajs/react',
            'react-hook-form', 'react-datepicker', 'react-chartjs-2',
            'qrcode.react', 'react-leaflet', '@react-leaflet/core',
            '@floating-ui/react', '@react-aria/focus', '@react-aria/utils',
            '@react-stately/utils', '@react-types/shared', '@tanstack/react-virtual'
        ],
        exclude: [],
        force: true,
    },
    esbuild: {
        jsx: 'automatic',
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    server: {
        cors: {
            origin: true, // Allow all origins during development
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        },
        host: '0.0.0.0',
        port: 5174,
        hmr: {
            host: 'controlroom2.test',
            port: 5174
        },
        strictPort: false
    },
  
    build: {
        rollupOptions: {
            output: {
                // Split vendor and large libs into separate chunks to balance sizes.
                manualChunks(id) {
                    if (!id.includes('node_modules')) return undefined;

                    // Extract module path after node_modules/ for simple matching
                    const nm = id.includes('node_modules/') ? id.split('node_modules/').pop() : id;

                    // Ensure ALL React-related packages are in the same chunk to prevent conflicts
                    if (nm.startsWith('react') || nm.startsWith('react-dom') || nm.startsWith('react-is') || 
                        nm.startsWith('react-hook-form') || nm.startsWith('react-datepicker') || 
                        nm.startsWith('react-chartjs-2') || nm.startsWith('qrcode.react') ||
                        nm.startsWith('@headlessui/react') || nm.startsWith('@heroicons/react') ||
                        nm.startsWith('@inertiajs/react') || nm.startsWith('react-leaflet') ||
                        nm.startsWith('@react-leaflet') || nm.startsWith('@floating-ui/react') ||
                        nm.startsWith('@react-aria') || nm.startsWith('@react-stately') ||
                        nm.startsWith('@react-types') || nm.startsWith('@tanstack/react')) {
                        return 'vendor-react';
                    }

                    if (nm.startsWith('lucide-react')) {
                        return 'vendor-lucide';
                    }

                    if (nm.startsWith('chart.js') || nm.startsWith('react-chartjs-2') || nm.startsWith('recharts')) {
                        return 'vendor-charts';
                    }

                    if (nm.startsWith('leaflet') || nm.startsWith('react-leaflet')) {
                        return 'vendor-leaflet';
                    }

                    if (nm.startsWith('framer-motion')) {
                        return 'vendor-framer';
                    }

                    if (nm.startsWith('@inertiajs')) {
                        return 'vendor-inertia';
                    }

                    // default vendor chunk
                    return 'vendor';
                },
            },
        },
        chunkSizeWarningLimit: 1200, // increase warning limit slightly
        outDir: 'public/build',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'terser',
    },
});
