// Material 3 themes built from the website's own colors (the CSS variables at
// the top of index.html), so the native bars match the page inside them.
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2352c2',
    onPrimary: '#ffffff',
    primaryContainer: '#e3ebfb',
    onPrimaryContainer: '#16213a',
    secondaryContainer: '#e3ebfb', // active tab "pill" in the bottom bar
    onSecondaryContainer: '#2352c2',
    background: '#f5f8fc',
    surface: '#ffffff',
    onSurface: '#16213a',
    onSurfaceVariant: '#56637d',
    outline: '#cfd8e6',
    error: '#b33434',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level2: '#ffffff', // bottom bar background
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  roundness: 3,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#86a8ff',
    onPrimary: '#0e1422',
    primaryContainer: '#1d2a4a',
    onPrimaryContainer: '#e6ebf4',
    secondaryContainer: '#1d2a4a',
    onSecondaryContainer: '#86a8ff',
    background: '#0e1422',
    surface: '#151d2f',
    onSurface: '#e6ebf4',
    onSurfaceVariant: '#9aa6bd',
    outline: '#2a3550',
    error: '#ff8080',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level2: '#151d2f',
    },
  },
};
