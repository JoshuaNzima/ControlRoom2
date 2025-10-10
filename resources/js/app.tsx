import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
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
    progress: {
        color: '#4B5563',
    },
});
