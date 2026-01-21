/**
 * Theme Configuration
 * Color palette and design tokens
 */

export const theme = {
  colors: {
    primary: '#1a472a',      // Islamic dark green
    accent: '#26d07c',       // Bright Islamic green
    light: '#f0f9f5',        // Very light green
    dark: '#0d1f15',         // Very dark green
    
    // Grayscale
    gray: {
      50: '#fafafa',
      100: '#f1f1f1',
      200: '#e0e0e0',
      300: '#d0d0d0',
      400: '#999',
      500: '#666',
      600: '#555',
      700: '#333',
      800: '#1a1a1a',
      900: '#000',
    },

    // Status
    error: '#dc2626',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#3b82f6',
  },

  fonts: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    arabic: '"Noto Naskh Arabic", "Arabic Typesetting", serif',
  },

  sizes: {
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
  },

  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
  },

  animations: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    timing: 'ease-in-out',
  },
}

export const getThemeColor = (colorName: string) => {
  const parts = colorName.split('.')
  let value: any = theme.colors
  for (const part of parts) {
    value = value[part]
  }
  return value
}
