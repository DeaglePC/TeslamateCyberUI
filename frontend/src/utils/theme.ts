import type { ThemeType } from '@/store/settings';

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

export const themeConfigs: Record<ThemeType, ThemeColors> = {
    cyber: {
        primary: '#00f0ff',
        muted: '#808080',
        success: '#00ff88',
        warning: '#ffaa00',
        danger: '#ff4444',
        accent: '#ff00aa',
        bg: '#0a0a0f',
        cardBg: 'rgba(20,20,35,0.8)',
        border: 'rgba(0,240,255,0.3)',
        gradient: ['rgba(0, 240, 255, 0.5)', 'rgba(0, 240, 255, 0)'],
        timeline: {
            driving: '#a855f7',   // Purple
            charging: '#00f0ff',  // Cyan (theme primary)
            offline: '#f97316',   // Orange
            asleep: '#22c55e',    // Green
            online: '#06b6d4',    // Teal
            updating: '#eab308',  // Yellow
        },
        chart: ['#00f0ff', '#a855f7', '#22c55e', '#f97316', '#ec4899'],
    },

    tesla: {
        primary: '#cc0000',
        muted: '#888888',
        success: '#4caf50',
        warning: '#ff9800',
        danger: '#f44336',
        accent: '#ffffff',
        bg: '#111111',
        cardBg: 'rgba(30,30,30,0.9)',
        border: 'rgba(255,255,255,0.1)',
        gradient: ['rgba(204, 0, 0, 0.5)', 'rgba(204, 0, 0, 0)'],
        timeline: {
            driving: '#cc0000',   // Tesla red
            charging: '#4caf50',  // Green
            offline: '#9e9e9e',   // Grey
            asleep: '#2196f3',    // Blue
            online: '#00bcd4',    // Cyan
            updating: '#ff9800',  // Orange
        },
        chart: ['#cc0000', '#4caf50', '#2196f3', '#ff9800', '#9c27b0'],
    },

    dark: {
        primary: '#4361ee',
        muted: '#8d99ae',
        success: '#06d6a0',
        warning: '#ffd166',
        danger: '#ef476f',
        accent: '#f72585',
        bg: '#1a1a2e',
        cardBg: 'rgba(30,30,50,0.85)',
        border: 'rgba(67,97,238,0.3)',
        gradient: ['rgba(67, 97, 238, 0.5)', 'rgba(67, 97, 238, 0)'],
        timeline: {
            driving: '#4361ee',   // Primary blue
            charging: '#06d6a0',  // Teal green
            offline: '#8d99ae',   // Muted
            asleep: '#7209b7',    // Purple
            online: '#3a86ff',    // Light blue
            updating: '#ffd166',  // Yellow
        },
        chart: ['#4361ee', '#ef476f', '#06d6a0', '#ffd166', '#118ab2'],
    },

    tech: {
        primary: '#0077b6',
        muted: '#778da9',
        success: '#52b788',
        warning: '#f4a261',
        danger: '#e76f51',
        accent: '#90e0ef',
        bg: '#0d1b2a',
        cardBg: 'rgba(27,38,59,0.9)',
        border: 'rgba(0,119,182,0.3)',
        gradient: ['rgba(0, 119, 182, 0.5)', 'rgba(0, 119, 182, 0)'],
        timeline: {
            driving: '#0077b6',   // Primary blue
            charging: '#52b788',  // Green
            offline: '#778da9',   // Muted grey
            asleep: '#48cae4',    // Light blue
            online: '#00b4d8',    // Cyan
            updating: '#f4a261',  // Orange
        },
        chart: ['#0077b6', '#52b788', '#48cae4', '#f4a261', '#e76f51'],
    },

    aurora: {
        primary: '#72efdd',
        muted: '#98c1d9',
        success: '#80ed99',
        warning: '#ffb703',
        danger: '#ff595e',
        accent: '#7678ed',
        bg: '#0b132b',
        cardBg: 'rgba(28,38,65,0.85)',
        border: 'rgba(114,239,221,0.3)',
        gradient: ['rgba(114, 239, 221, 0.5)', 'rgba(114, 239, 221, 0)'],
        timeline: {
            driving: '#72efdd',   // Mint (primary)
            charging: '#80ed99',  // Light green
            offline: '#6c757d',   // Grey
            asleep: '#5e60ce',    // Purple
            online: '#48bfe3',    // Sky blue
            updating: '#ffb703',  // Amber
        },
        chart: ['#72efdd', '#80ed99', '#5e60ce', '#48bfe3', '#ff595e'],
    },
};

// Helper hook to get current theme colors
export function getThemeColors(theme: ThemeType): ThemeColors {
    return themeConfigs[theme] || themeConfigs.cyber;
}
