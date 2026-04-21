/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_NAME: string
    readonly VITE_VAPID_PUBLIC_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module 'stream-browserify';

declare global {
    interface Window {
        axios: any;
        Buffer: typeof Buffer;
        EventEmitter: any;
        Stream: any;
        csrfToken?: string;
    }
}