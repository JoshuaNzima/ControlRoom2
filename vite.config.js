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
            '@headlessui/react'
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
            'recharts',
            'react-chartjs-2',
            'react-leaflet',
            '@floating-ui/react',
            '@floating-ui/react-dom'
        ],
        exclude: [],
        force: true,
        esbuildOptions: {
            define: {
                global: 'globalThis'
            }
        }
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
            external: [
                'http', 'https', 'zlib', 'stream', 'crypto', 'fs', 'path', 'tty', 'os',
                'node:http', 'node:https', 'node:zlib', 'node:stream', 'node:crypto', 'node:fs', 'node:path', 'node:tty', 'node:os'
            ],
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
                    'vendor-inertia': ['@inertiajs/react'],
                    'vendor-ui': [
                        'lucide-react', 
                        '@headlessui/react',
                        'framer-motion'
                    ],
                    'vendor-charts': [
                        'chart.js',
                        'react-chartjs-2',
                        'recharts'
                    ],
                    'vendor-leaflet': [
                        'leaflet',
                        'react-leaflet'
                    ]
                }
            }
        },
        chunkSizeWarningLimit: 1200,
        outDir: 'public/build',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'terser',
        commonjsOptions: {
            include: [/node_modules/],
            transformMixedEsModules: true,
            defaultIsModuleExports: 'auto',
            requireReturnsDefault: 'auto'
        }
    },
});
