import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#eff8ff',
                    100: '#dbeffe',
                    200: '#bfe3fd',
                    300: '#94d1fb',
                    400: '#60b5f8',
                    500: '#3b96f4',
                    600: '#2578e9',
                    700: '#1d60d6',
                    800: '#1e4fad',
                    900: '#1e4489',
                    950: '#172b53',
                },
                teal: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
                'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 6px -1px rgba(0,0,0,0.06)',
                glow: '0 0 0 3px rgba(59,150,244,0.15)',
            },
            borderRadius: {
                xl: '1rem',
                '2xl': '1.25rem',
                '3xl': '1.5rem',
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [],
}

export default config
