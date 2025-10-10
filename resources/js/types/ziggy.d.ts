declare module 'ziggy-js' {
    type RouteParams = Record<string, any>;
    
    interface RouteConfig {
        uri: string;
        methods: string[];
        domain?: string | null;
        bindings?: Record<string, string>;
        parameters?: string[];
        name?: string;
    }

    interface ZiggyConfig {
        url: string;
        port: number | null;
        defaults: Record<string, string>;
        routes: Record<string, RouteConfig>;
    }

    export function route(name: string, params?: RouteParams, absolute?: boolean): string;
}