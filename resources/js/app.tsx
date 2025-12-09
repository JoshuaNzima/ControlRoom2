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
import PwaControls from '@/Components/PwaControls';
import './pwa';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function withPageTransition(PageComponent: React.ComponentType<any>): React.FC<any> {
    const Wrapped: React.FC<any> = (props) => (
        <div className="animate-fadeIn min-h-screen">
            <PageComponent {...props} />
        </div>
    );

    Wrapped.displayName = `PageTransition(${PageComponent.displayName || PageComponent.name || 'Page'})`;
    return Wrapped;
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        const pagePromise = resolvePageComponent(
            `./Pages/${name}.tsx`,
            {
                ...import.meta.glob('./Pages/**/*.tsx'),
                ...import.meta.glob('./Pages/**/*.jsx'),
            },
        );

        return pagePromise.then((module: any) => {
            if (!module?.default) {
                return module;
            }

            const Wrapped = withPageTransition(module.default);
            return {
                ...module,
                default: Wrapped,
            };
        });
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ThemeProvider>
                <NotificationProvider>
                    <App {...props} />
                    <FlashBridge initialPageProps={props} />
                    <PwaControls />
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
