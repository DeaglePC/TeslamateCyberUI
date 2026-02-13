import type { ThemeType } from '@/store/settings';
import { generateThemeFromColor } from '@/utils/colorExtractor';

// Complete theme color definitions
export interface ThemeColors {
    // Base colors
    primary: string;
    muted: string;
    success: string;
    warning: string;
    danger: string;
    accent: string;

    // Background colors
    bg: string;
    cardBg: string;
    border: string;

    // Gradient for charts
    gradient: [string, string];

    // Timeline state colors
    timeline: {
        driving: string;
        charging: string;
        offline: string;
        asleep: string;
        online: string;
        updating: string;
    };

    // Chart colors (for multi-series charts)
    chart: string[];
}

// 缓存自动生成的主题色
let cachedAutoTheme: ThemeColors | null = null;
let cachedAutoThemePrimary: string = '';

// 预定义主题类型（不包含 auto）
type PresetThemeType = Exclude<ThemeType, 'auto'>;

export const themeConfigs: Record<PresetThemeType, ThemeColors> = {
    // 1. Cyberpunk: High contrast, neon lights. Cyan primary.
    cyber: {
        primary: '#00f0ff',   // Cyan
        muted: '#8395a7',
        success: '#39ff14',   // Neon Green
        warning: '#fcee0a',   // Neon Yellow
        danger: '#ff3f34',    // Neon Red
        accent: '#00f0ff',
        bg: '#050505',
        cardBg: 'rgba(20, 20, 35, 0.95)',
        border: 'rgba(0, 240, 255, 0.4)',
        gradient: ['rgba(0, 240, 255, 0.5)', 'rgba(0, 240, 255, 0)'],
        timeline: {
            driving: '#fcee0a',   // Yellow
            charging: '#39ff14',  // Green
            offline: '#3d3d3d',   // Dark Grey (Merged)
            asleep: '#3d3d3d',    // Dark Grey (Merged)
            online: '#00f0ff',    // Cyan
            updating: '#ff9f43',  // Orange
        },
        chart: ['#00f0ff', '#ff00aa', '#39ff14', '#ff3f34', '#a29bfe'],
    },

    // 2. Tesla: OEM style. Red primary. Semantically standard.
    tesla: {
        primary: '#e82127',   // Tesla Red
        muted: '#9e9e9e',
        success: '#3e8e41',   // Standard Green
        warning: '#f0ad4e',
        danger: '#d9534f',
        accent: '#e82127',
        bg: '#18181b',
        cardBg: 'rgba(30, 30, 30, 0.9)',
        border: 'rgba(232, 33, 39, 0.2)',
        gradient: ['rgba(232, 33, 39, 0.5)', 'rgba(232, 33, 39, 0)'],
        timeline: {
            driving: '#e82127',   // Red
            charging: '#3e8e41',  // Green
            offline: '#424242',   // Dark Grey (Merged)
            asleep: '#424242',    // Dark Grey (Merged)
            online: '#ffffff',    // White
            updating: '#ff9800',  // Orange
        },
        chart: ['#e82127', '#ffffff', '#3e8e41', '#f0ad4e', '#2196f3'],
    },

    // 3. Dark: "Dracula" inspired. Purple primary.
    dark: {
        primary: '#bd93f9',   // Dracula Purple
        muted: '#6272a4',     // Comment Blue
        success: '#50fa7b',   // Green
        warning: '#ffb86c',   // Orange
        danger: '#ff5555',    // Red
        accent: '#bd93f9',
        bg: '#282a36',        // Dracula Background
        cardBg: 'rgba(68, 71, 90, 0.9)', // Current Line
        border: 'rgba(189, 147, 249, 0.3)',
        gradient: ['rgba(189, 147, 249, 0.5)', 'rgba(189, 147, 249, 0)'],
        timeline: {
            driving: '#ff79c6',   // Pink
            charging: '#50fa7b',  // Green
            offline: '#44475a',   // Dark Grey (Merged)
            asleep: '#44475a',    // Dark Grey (Merged)
            online: '#8be9fd',    // Cyan
            updating: '#ffb86c',  // Orange
        },
        chart: ['#bd93f9', '#ff79c6', '#8be9fd', '#50fa7b', '#ffb86c'],
    },

    // 4. Tech: "Deep Space". Blue primary. Cool, professional.
    tech: {
        primary: '#4361ee',   // Vivid Blue
        muted: '#8d99ae',
        success: '#4cc9f0',   // Light Blue/Cyan
        warning: '#f72585',   // Highlight Pink
        danger: '#e63946',    // Red
        accent: '#4361ee',
        bg: '#0b132b',        // Very Dark Blue
        cardBg: 'rgba(28, 37, 65, 0.9)',
        border: 'rgba(67, 97, 238, 0.3)',
        gradient: ['rgba(67, 97, 238, 0.5)', 'rgba(67, 97, 238, 0)'],
        timeline: {
            driving: '#480ca8',   // Deep Purple
            charging: '#4cc9f0',  // Cyan
            offline: '#1c2541',   // Navy (Merged)
            asleep: '#1c2541',    // Navy (Merged)
            online: '#4361ee',    // Blue
            updating: '#f72585',  // Pink (Distinct)
        },
        chart: ['#4361ee', '#f72585', '#4cc9f0', '#7209b7', '#3a0ca3'],
    },

    // 5. Aurora: "Synthwave". Pink primary. Retro future.
    aurora: {
        primary: '#ff2a6d',   // Neon Pink
        muted: '#635985',     // Muted Purple
        success: '#05d9e8',   // Neon Blue
        warning: '#ffc857',
        danger: '#ff595e',
        accent: '#ff2a6d',
        bg: '#18122B',        // Deep Purple/Black
        cardBg: 'rgba(57, 43, 88, 0.9)',
        border: 'rgba(255, 42, 109, 0.3)',
        gradient: ['rgba(255, 42, 109, 0.5)', 'rgba(255, 42, 109, 0)'],
        timeline: {
            driving: '#d300c5',   // Magenta
            charging: '#05d9e8',  // Cyan
            offline: '#2d0669',   // Dark Purple (Merged)
            asleep: '#2d0669',    // Dark Purple (Merged)
            online: '#ff8c00',    // Orange - distinct from driving
            updating: '#ffc857',  // Yellow
        },
        chart: ['#ff2a6d', '#05d9e8', '#d300c5', '#ffc857', '#635985'],
    },
};

// 设置自动主题色（从背景图提取的主色）
export function setAutoThemeColor(primaryHex: string): ThemeColors {
    if (primaryHex === cachedAutoThemePrimary && cachedAutoTheme) {
        return cachedAutoTheme;
    }
    const generated = generateThemeFromColor(primaryHex);
    cachedAutoTheme = generated as ThemeColors;
    cachedAutoThemePrimary = primaryHex;
    return cachedAutoTheme;
}

// 获取自动主题的缓存
export function getAutoThemeColors(): ThemeColors | null {
    return cachedAutoTheme;
}

// 清除自动主题缓存
export function clearAutoThemeCache(): void {
    cachedAutoTheme = null;
    cachedAutoThemePrimary = '';
}

// Helper hook to get current theme colors
export function getThemeColors(theme: ThemeType): ThemeColors {
    if (theme === 'auto' && cachedAutoTheme) {
        return cachedAutoTheme;
    }
    return themeConfigs[theme as PresetThemeType] || themeConfigs.cyber;
}
