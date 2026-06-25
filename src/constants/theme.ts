/**
 * SportLink theme. Built on React Native Paper's MD3 themes, with a sporty
 * blue primary plus per-pillar accent colors used across the app.
 */

import '@/global.css';

import { DarkTheme as NavDark, DefaultTheme as NavLight } from 'expo-router';
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

/** One accent color per pillar so each feature reads at a glance. */
export const PillarColors = {
  routes: '#0B6BCB', // blue
  courts: '#15A66A', // green
  coach: '#FF6B35', // orange
} as const;

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0B6BCB',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D7E7FF',
    onPrimaryContainer: '#001C3A',
    secondary: '#15A66A',
    tertiary: '#FF6B35',
    background: '#F6F7F9',
    surface: '#FFFFFF',
    surfaceVariant: '#EDEFF3',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#FFFFFF',
      level2: '#FBFCFE',
    },
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#7FB6FF',
    onPrimary: '#00315F',
    primaryContainer: '#0C4A8A',
    onPrimaryContainer: '#D7E7FF',
    secondary: '#5FD6A0',
    tertiary: '#FF9466',
    background: '#0E1116',
    surface: '#161A21',
    surfaceVariant: '#1E232B',
  },
};

/** React Navigation themes kept in sync with Paper so there are no color flashes. */
export const navLightTheme = {
  ...NavLight,
  colors: {
    ...NavLight.colors,
    primary: lightTheme.colors.primary,
    background: lightTheme.colors.background,
    card: lightTheme.colors.surface,
    text: lightTheme.colors.onSurface,
    border: lightTheme.colors.surfaceVariant,
  },
};

export const navDarkTheme = {
  ...NavDark,
  colors: {
    ...NavDark.colors,
    primary: darkTheme.colors.primary,
    background: darkTheme.colors.background,
    card: darkTheme.colors.surface,
    text: darkTheme.colors.onSurface,
    border: darkTheme.colors.surfaceVariant,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const MaxContentWidth = 720;
