/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0a0a0a',
                surface: '#121212',
                primary: {
                    DEFAULT: '#8b5cf6', // Violet 500
                    hover: '#7c3aed', // Violet 600
                    glow: 'rgba(139, 92, 246, 0.5)'
                },
                accent: {
                    DEFAULT: '#ec4899', // Pink 500
                    glow: 'rgba(236, 72, 153, 0.5)'
                }
            },
            animation: {
                'gradient-x': 'gradient-x 15s ease infinite',
                'float': 'float 6s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                'gradient-x': {
                    '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center'
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center'
                    },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)' },
                    '50%': { opacity: '.5', boxShadow: '0 0 10px rgba(139, 92, 246, 0.2)' },
                }
            }
        },
    },
    plugins: [],
}
