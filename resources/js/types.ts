export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    permissions?: string[];
    roles?: string[];
}

/** Shared props injected by Laravel/Inertia on every page load */
export interface InertiaSharedProps {
    weeklyTasks?: any[];
    isExecutiveAssistant?: boolean;
    appName?: string;
    counters?: Record<string, any>;
    errors?: Record<string, string>;
    flash?: Record<string, string>;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User;
    };
} & InertiaSharedProps;
