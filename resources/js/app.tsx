import '../css/app.css';
import './bootstrap';

import React from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { router } from '@inertiajs/react';
import { NotificationProvider } from './Providers/NotificationProvider';
import { ThemeProvider } from './Providers/ThemeProvider';
import FlashBridge from '@/Components/FlashBridge';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            {
                ...import.meta.glob('./Pages/**/*.tsx'),
                ...import.meta.glob('./Pages/**/*.jsx'),
            },
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ThemeProvider>
                <NotificationProvider>
                    <App {...props} />
                    <FlashBridge initialPageProps={props} />
                </NotificationProvider>
            </ThemeProvider>
        );
    },
    // We'll handle navigation progress with nprogress manually
});

// Hook into Inertia router events to show a page progress bar
router.on('start', () => NProgress.start());
router.on('finish', () => NProgress.done());
router.on('error', () => NProgress.done());
