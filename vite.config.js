import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react({
            include: "**/*.{jsx,tsx}",
        }),
        {
            name: 'polyfill-node-globals',
            config: () => ({
                define: {
                    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
                    global: 'window',
                    'global.TextEncoder': 'TextEncoder',
                    'global.TextDecoder': 'TextDecoder',
                }
            })
        }
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
            'react': path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
            'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
            'react-is': path.resolve(__dirname, 'node_modules/react-is'),
            stream: 'stream-browserify',
            util: 'util',
            crypto: 'crypto-browserify',
            http: false,
            https: false,
            zlib: false,
            path: false,
            fs: false,
            tty: false,
            os: false
        },
        dedupe: [
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react-is',
            '@inertiajs/react',
            'lucide-react',
            'framer-motion',
            '@headlessui/react',
            '@heroicons/react',
            'react-hook-form',
            'react-datepicker',
            'react-chartjs-2',
            'qrcode.react',
            'react-leaflet',
            '@react-leaflet/core',
            '@floating-ui/react',
            '@react-aria/focus',
            '@react-aria/utils',
            '@react-stately/utils',
            '@react-types/shared',
            '@tanstack/react-virtual',
        ],
        mainFields: ['module', 'browser', 'main'],
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react-is',
            '@inertiajs/react',
            '@inertiajs/core',
            'lucide-react',
            'framer-motion',
            '@headlessui/react',
            '@heroicons/react',
            'recharts',
            'react-chartjs-2',
            'react-leaflet',
            '@floating-ui/react',
            '@floating-ui/react-dom',
            'react-hook-form',
            'react-datepicker',
            'qrcode.react',
            '@react-leaflet/core',
            '@react-aria/focus',
            '@react-aria/utils',
            '@react-stately/utils',
            '@react-types/shared',
            '@tanstack/react-virtual',
        ],
        exclude: [],
        force: true,
        esbuildOptions: {
            define: {
                global: 'globalThis',
            },
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'process.env.VITE_PUSHER_APP_KEY': JSON.stringify(process.env.PUSHER_APP_KEY),
        'process.env.VITE_PUSHER_APP_CLUSTER': JSON.stringify(process.env.PUSHER_APP_CLUSTER),
    },
    server: {
        cors: {
            origin: true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        },
        host: '0.0.0.0',
        port: 5174,
        hmr: {
            host: 'controlroom2.test',
            port: 5174,
        },
        strictPort: false,
    },
    build: {
        rollupOptions: {
            external: [
                'http', 'https', 'zlib', 'stream', 'crypto', 'fs', 'path', 'tty', 'os',
                'node:http', 'node:https', 'node:zlib', 'node:stream', 'node:crypto', 'node:fs', 'node:path', 'node:tty', 'node:os',
            ],
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return undefined;

                    const nm = id.includes('node_modules/') ? id.split('node_modules/').pop() : id;

                    if (nm.startsWith('react') || nm.startsWith('react-dom') || nm.startsWith('react-is') ||
                        nm.startsWith('react-hook-form') || nm.startsWith('react-datepicker') ||
                        nm.startsWith('react-chartjs-2') || nm.startsWith('qrcode.react') ||
                        nm.startsWith('react-hot-toast') || nm.startsWith('react-redux') ||
                        nm.startsWith('react-remove-scroll') || nm.startsWith('react-style-singleton') ||
                        nm.startsWith('@headlessui/react') || nm.startsWith('@heroicons/react') ||
                        nm.startsWith('@inertiajs/react') || nm.startsWith('react-leaflet') ||
                        nm.startsWith('@react-leaflet') || nm.startsWith('@floating-ui/react') ||
                        nm.startsWith('@react-aria') || nm.startsWith('@react-stately') ||
                        nm.startsWith('@react-types') || nm.startsWith('@tanstack/react') ||
                        nm.startsWith('@radix-ui/') ||
                        nm.startsWith('@reduxjs/') ||
                        nm.startsWith('framer-motion') ||
                        nm.startsWith('recharts') ||
                        nm.startsWith('lucide-react') ||
                        nm.startsWith('use-callback-ref') ||
                        nm.startsWith('use-sidecar')) {
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

                    return 'vendor';
                },
            },
        },
        chunkSizeWarningLimit: 250,
        outDir: 'public/build',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                passes: 3,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
                unused: true,
                dead_code: true,
            },
            mangle: true,
            format: {
                comments: false,
            },
        },
        commonjsOptions: {
            include: [/node_modules/],
            transformMixedEsModules: true,
            defaultIsModuleExports: 'auto',
            requireReturnsDefault: 'auto',
        },
        cssMinify: true,
        maxInitialChunkSize: 250,
        maxAssetSize: 250,
        treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
            tryCatchDeoptimization: false,
        },
    },
});
