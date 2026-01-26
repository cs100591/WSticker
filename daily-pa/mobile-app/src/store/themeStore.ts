import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as defaultColors } from '@/theme/colors';

export type ThemeMode = 'system' | 'minimal' | 'sage' | 'sunset' | 'ocean';

interface ThemeState {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    colors: typeof defaultColors;
}

// Minimalist B&W Theme Colors
const minimalColors = {
    ...defaultColors,
    primary: {
        ...defaultColors.primary,
        50: '#F8FAFC', // Very light gray
        100: '#F1F5F9',
        500: '#000000', // Black for primary actions
        600: '#333333',
    },
    background: {
        light: '#FFFFFF',
        dark: '#000000',
    },
    card: {
        light: '#FFFFFF', // High contrast
        dark: '#121212',
    },
    text: {
        primary: { light: '#000000', dark: '#FFFFFF' },
        secondary: { light: '#333333', dark: '#CCCCCC' },
        muted: { light: '#666666', dark: '#999999' },
    },
};

// Blue Sage Theme (System Default - Blue version of Sage)
const blueSageColors = {
    ...defaultColors,
    primary: {
        ...defaultColors.primary,
        50: '#F0F9FF',
        100: '#E0F2FE',
        200: '#BFDBFE', // Blue Sage Top
        300: '#DBEAFE', // Blue Sage Mid
        400: '#60A5FA',
        500: '#2563EB', // Blue Sage Action
        600: '#1D4ED8',
        700: '#1E40AF',
        800: '#1E3A8A',
        900: '#172554',
    },
    background: {
        light: '#EFF6FF',
        dark: '#172554',
    },
    card: {
        light: '#FFFFFF',
        dark: '#1E3A8A',
    },
    text: {
        primary: { light: '#1F2937', dark: '#F9FAFB' },
        secondary: { light: '#4B5563', dark: '#D1D5DB' },
        muted: { light: '#9CA3AF', dark: '#9CA3AF' },
    },
    success: '#10B981',
    info: '#3B82F6',
};

// Sage Balance Theme (Nature/Wellness inspired)
const sageColors = {
    ...defaultColors,
    primary: {
        ...defaultColors.primary,
        50: '#F5F9F8',
        100: '#E8F3F0',
        200: '#C3E0D8', // Sage Top
        300: '#D6E8E2', // Sage Mid
        400: '#2D6A4F',
        500: '#065F46', // Dark green/teal for primary actions
        600: '#047857',
        700: '#064E3B',
        800: '#064E3B',
        900: '#022C22',
    },
    background: {
        light: '#F9F6F0', // Cream Bottom
        dark: '#1C2E2A',  // Dark green/gray
    },
    card: {
        light: '#FFFFFF',
        dark: '#273E38',
    },
    text: {
        primary: { light: '#1F2937', dark: '#F9FAFB' },
        secondary: { light: '#4B5563', dark: '#D1D5DB' },
        muted: { light: '#9CA3AF', dark: '#9CA3AF' },
    },
    success: '#10B981',
    info: '#AECBEB', // Timeline Blue
};

// Sunset Theme (Warm/Energetic)
const sunsetColors = {
    ...defaultColors,
    primary: {
        ...defaultColors.primary,
        50: '#FFF1F2',
        100: '#FFE4E6',
        200: '#FECDD3',
        300: '#FDA4AF',
        400: '#FB7185',
        500: '#F43F5E', // Rose/Red
        600: '#E11D48',
        700: '#BE123C',
        800: '#9F1239',
        900: '#881337',
    },
    background: {
        light: '#FFF5F5', // Light Warm
        dark: '#2A0A12',
    },
    card: {
        light: '#FFFFFF',
        dark: '#4C0519',
    },
    text: {
        primary: { light: '#1F2937', dark: '#F9FAFB' },
        secondary: { light: '#4B5563', dark: '#D1D5DB' },
        muted: { light: '#9CA3AF', dark: '#9CA3AF' },
    },
    success: '#10B981',
    info: '#F43F5E',
};

// Ocean Theme (Deep Blue/Calm)
const oceanColors = {
    ...defaultColors,
    primary: {
        ...defaultColors.primary,
        50: '#F0F9FF',
        100: '#E0F2FE',
        200: '#BAE6FD',
        300: '#7DD3FC',
        400: '#38BDF8',
        500: '#0EA5E9', // Sky Blue
        600: '#0284C7',
        700: '#0369A1',
        800: '#075985',
        900: '#0C4A6E',
    },
    background: {
        light: '#F0F9FF', // Light Blue
        dark: '#0B1120',
    },
    card: {
        light: '#FFFFFF',
        dark: '#162032',
    },
    text: {
        primary: { light: '#1F2937', dark: '#F9FAFB' },
        secondary: { light: '#4B5563', dark: '#D1D5DB' },
        muted: { light: '#9CA3AF', dark: '#9CA3AF' },
    },
    success: '#10B981',
    info: '#0EA5E9',
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            mode: 'system',
            colors: defaultColors,
            setMode: (mode) => {
                let activeColors = defaultColors;
                if (mode === 'system') activeColors = blueSageColors;
                if (mode === 'minimal') activeColors = minimalColors;
                if (mode === 'sage') activeColors = sageColors;
                if (mode === 'sunset') activeColors = sunsetColors;
                if (mode === 'ocean') activeColors = oceanColors;

                set({
                    mode,
                    colors: activeColors
                });
            },
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
