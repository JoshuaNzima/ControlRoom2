<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        {{-- Only include Vite dev client and page HMR when running locally. In production we must use the built assets. --}}
        @if(app()->isLocal())
            @viteReactRefresh
            @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @else
            @vite(['resources/js/app.tsx'])
        @endif
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
