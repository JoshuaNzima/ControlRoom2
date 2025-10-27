declare module "@/types" {
    export interface User {
        id: number;
        name: string;
        email: string;
        email_verified_at?: string;
        permissions?: string[];
    }

    export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
        auth: {
            user: User;
        };
    };
}

declare module 'stream-browserify';

declare global {
    interface Window {
        axios: any;
        Buffer: typeof Buffer;
        EventEmitter: any;
        Stream: any;
    }
}
