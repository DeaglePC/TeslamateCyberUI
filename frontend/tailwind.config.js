/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 赛博朋克主题
        cyber: {
          bg: '#0a0a0f',
          card: 'rgba(20, 20, 35, 0.8)',
          primary: '#00f0ff',
          secondary: '#ff00aa',
          accent: '#f0f',
          text: '#e0e0e0',
          muted: '#808080',
          border: 'rgba(0, 240, 255, 0.3)',
          success: '#00ff88',
          warning: '#ffaa00',
          error: '#ff4444',
        },
        // 特斯拉主题
        tesla: {
          bg: '#111111',
          card: 'rgba(30, 30, 30, 0.9)',
          primary: '#cc0000',
          secondary: '#ffffff',
          accent: '#cc0000',
          text: '#ffffff',
          muted: '#888888',
          border: 'rgba(255, 255, 255, 0.1)',
          success: '#4caf50',
          warning: '#ff9800',
          error: '#f44336',
        },
        // 暗夜主题
        dark: {
          bg: '#1a1a2e',
          card: 'rgba(30, 30, 50, 0.85)',
          primary: '#4361ee',
          secondary: '#7209b7',
          accent: '#f72585',
          text: '#edf2f4',
          muted: '#8d99ae',
          border: 'rgba(67, 97, 238, 0.3)',
          success: '#06d6a0',
          warning: '#ffd60a',
          error: '#ef476f',
        },
        // 科技蓝主题
        tech: {
          bg: '#0d1b2a',
          card: 'rgba(27, 38, 59, 0.9)',
          primary: '#0077b6',
          secondary: '#00b4d8',
          accent: '#90e0ef',
          text: '#caf0f8',
          muted: '#778da9',
          border: 'rgba(0, 119, 182, 0.3)',
          success: '#52b788',
          warning: '#f4a261',
          error: '#e63946',
        },
        // 极光主题
        aurora: {
          bg: '#0b132b',
          card: 'rgba(28, 38, 65, 0.85)',
          primary: '#5390d9',
          secondary: '#7678ed',
          accent: '#72efdd',
          text: '#e0fbfc',
          muted: '#98c1d9',
          border: 'rgba(114, 239, 221, 0.3)',
          success: '#80ed99',
          warning: '#fcbf49',
          error: '#d62828',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '100%': { boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor' },
        },
      },
    },
  },
  plugins: [],
  // 支持动态主题切换
  safelist: [
    {
      pattern: /(bg|text|border|shadow)-(cyber|tesla|dark|tech|aurora)-(bg|card|primary|secondary|accent|text|muted|border|success|warning|error)/,
    },
  ],
};
