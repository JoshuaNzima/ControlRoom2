import '../css/app.css';
import './bootstrap';

import React from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { router } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from './Providers/NotificationProvider';
import { ThemeProvider } from './Providers/ThemeProvider';
import FlashBridge from '@/Components/FlashBridge';
import PwaControls from '@/Components/PwaControls';
import './pwa';

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: unknown; errorInfo: React.ErrorInfo | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: unknown) {
        return { error, errorInfo: null };
    }

    componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
        this.setState({ error, errorInfo });
        // Keep console logging for devtools.
        // eslint-disable-next-line no-console
        console.error('UI crashed:', error, errorInfo);
    }

    render() {
        if (this.state.error) {
            const message = this.state.error instanceof Error ? this.state.error.message : String(this.state.error);
            return (
                <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
                    <div className="max-w-3xl mx-auto space-y-4">
                        <h1 className="text-xl font-semibold text-red-400">Something went wrong</h1>
                        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                            <div className="text-sm text-gray-300">{message}</div>
                        </div>
                        {this.state.errorInfo?.componentStack ? (
                            <pre className="rounded-lg border border-gray-800 bg-gray-900 p-4 text-xs text-gray-300 overflow-auto whitespace-pre-wrap">
                                {this.state.errorInfo.componentStack}
                            </pre>
                        ) : null}
                        <div className="text-xs text-gray-500">
                            Check the browser console for a full stack trace.
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

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
                    <ErrorBoundary>
                        <App {...props} />
                        <FlashBridge initialPageProps={props} />
                        <PwaControls />
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    background: '#1f2937',
                                    color: '#f3f4f6',
                                    border: '1px solid #374151',
                                },
                                success: {
                                    iconTheme: {
                                        primary: '#10b981',
                                        secondary: '#f3f4f6',
                                    },
                                },
                                error: {
                                    iconTheme: {
                                        primary: '#ef4444',
                                        secondary: '#f3f4f6',
                                    },
                                },
                            }}
                        />
                    </ErrorBoundary>
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
