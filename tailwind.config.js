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
            screens: {
                'xs': '375px',
            },
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
                display: ['Inter', ...defaultTheme.fontFamily.sans],
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
                // --- LIGHT THEME (was dark) ---
                'coin-dark': '#f8fafc',
                'coin-surface': '#f1f5f9',
                'coin-card': '#ffffff',
                'coin-card-hover': '#f8fafc',
                'coin-accent': '#e04b3f',
                'coin-accent-light': '#ff6a5f',
                'coin-accent-dark': '#b92f2a',
                'coin-text': '#0f172a',
                'coin-muted': '#64748b',
                'coin-border': '#e2e8f0',
                'coin-glow': 'rgba(224, 75, 63, 0.08)',
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
                'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
                'cta': '0 4px 14px rgba(224, 75, 63, 0.2)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(ellipse at center, rgba(224, 75, 63, 0.04) 0%, transparent 70%)',
            },
            animation: {
                'float-slow': 'float-slow 10s ease-in-out infinite',
                'float-medium': 'float-medium 8s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
                'shimmer': 'shimmer 3s linear infinite',
            },
            keyframes: {
                'float-slow': {
                    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                    '25%': { transform: 'translateY(-15px) rotate(2deg)' },
                    '50%': { transform: 'translateY(-8px) rotate(-1deg)' },
                    '75%': { transform: 'translateY(-18px) rotate(1deg)' },
                },
                'float-medium': {
                    '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
                    '33%': { transform: 'translateY(-12px) translateX(8px)' },
                    '66%': { transform: 'translateY(6px) translateX(-5px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
                    '50%': { opacity: '0.7', transform: 'scale(1.15)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% center' },
                    '100%': { backgroundPosition: '200% center' },
                },
            },
        },
    },

    plugins: [forms],
};
