const config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#faf7f0',
                    100: '#f3edd9',
                    200: '#e7d8b1',
                    300: '#d9bd82',
                    400: '#cba357',
                    500: '#b88934',
                    600: '#a3712b',
                    700: '#835425',
                    800: '#6d4323',
                    900: '#5c3720',
                    950: '#351c0f',
                },
                gold: {
                    50: '#fdfbf7',
                    100: '#f9f4e8',
                    200: '#f2e6cb',
                    300: '#e8d2a2',
                    400: '#dba558',
                    500: '#cfa043',
                    600: '#b88432',
                    700: '#946329',
                    800: '#774f26',
                    900: '#634223',
                },
                obsidian: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    800: '#141a29',
                    900: '#090d16',
                    950: '#04070d',
                },
            },
            fontFamily: {
                sans: ['Vazirmatn', 'Tahoma', 'sans-serif'],
            },
            boxShadow: {
                'luxury-sm': '0 2px 10px rgba(184, 137, 52, 0.08)',
                'luxury-md': '0 8px 30px rgba(184, 137, 52, 0.12)',
                'luxury-lg': '0 20px 50px rgba(9, 13, 22, 0.15)',
            },
        },
    },
    plugins: [],
};
export default config;
