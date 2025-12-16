import type { Config } from "tailwindcss";

const config = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                    dark: "hsl(var(--primary-dark))",
                    light: "hsl(var(--primary-light))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                    warm: "hsl(var(--accent-warm))",
                    success: "hsl(var(--success))",
                    error: "hsl(var(--destructive))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // 新增：设计系统颜色
                cream: {
                    50: '#F5F3EF',   // 主背景
                    100: '#EAE5DD',  // 次级背景
                    200: '#D5D0C6',  // 分割线
                },
                brand: {
                    DEFAULT: '#7C14E3',  // 主品牌色
                    dark: '#3B0F70',     // 品牌深色
                    light: '#E2CFEC',    // 浅品牌色
                },
                text: {
                    primary: '#1F2430',    // 主文字
                    secondary: '#6B7280',  // 次级文字
                },
            },
            fontFamily: {
                sans: ['Inter', 'Noto Sans SC', 'SF Pro', 'Roboto', 'sans-serif'],
            },
            fontSize: {
                // 首页字号
                'homepage-h1': ['52px', { lineHeight: '1.2', fontWeight: '700' }],
                'homepage-h2': ['32px', { lineHeight: '1.2', fontWeight: '600' }],
                'homepage-h3': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
                'homepage-h4': ['20px', { lineHeight: '1.4', fontWeight: '500' }],
                'homepage-body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
                // 移动端
                'homepage-h1-mobile': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
                'homepage-h2-mobile': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
                'homepage-h3-mobile': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
