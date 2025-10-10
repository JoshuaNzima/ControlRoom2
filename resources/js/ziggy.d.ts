declare module 'ziggy-js' {
    type RouteParam = string | number | boolean | undefined;
    type RouteParams = Record<string, RouteParam>;
    
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

    interface Route {
        (name: string, params?: RouteParams, absolute?: boolean): string;
        current(): string | undefined;
        current(name: string): boolean;
        current(name: string, params: RouteParams): boolean;
        check(name: string): boolean;
        check(name: string, params: RouteParams): boolean;
        has(name: string): boolean;
        getRoutes(): Record<string, RouteConfig>;
    }

    const route: Route;
    export default route;
}