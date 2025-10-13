import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                coin: {
                    50: '#fff7f6',
                    100: '#ffefec',
                    200: '#ffd8d3',
                    300: '#ffb7ae',
                    400: '#ff8f82',
                    500: '#ff6a5f',
                    600: '#e04b3f',
                    700: '#b92f2a',
                    800: '#8b1f1a',
                    900: '#601412',
                },
            },
        },
    },

    plugins: [forms],
};
