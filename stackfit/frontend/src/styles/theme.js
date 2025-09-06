// Theme configuration for StackFit
const baseTheme = {
  colors: {
    // Background colors
    background: {
      primary: '#0D0D0D',
      card: 'rgba(255, 255, 255, 0.05)', // bg-white/5
      overlay: 'rgba(0, 0, 0, 0.7)',
      muted: '#1F2937', // bg-gray-800
      accent: '#4B5563', // bg-gray-600
    },
    // Text colors
    text: {
      primary: '#F3F4F6', // text-gray-100
      secondary: '#D1D5DB', // text-gray-300
      muted: '#6B7280', // text-gray-500
      accent: '#FB923C', // text-orange-400
      inverse: '#FFFFFF', // white text
    },
    // Border colors
    border: {
      primary: 'rgba(249, 115, 22, 0.2)', // border-orange-500/20
      secondary: 'rgba(249, 115, 22, 0.1)', // border-orange-500/10
      muted: 'rgba(107, 114, 128, 0.2)', // border-gray-500/20
      default: '#374151', // border-gray-700
      accent: '#FB923C', // border-orange-400
    },
    // Status colors
    status: {
      success: {
        bg: '#DEF7EC', // bg-green-100
        text: '#03543F', // text-green-800
      },
      error: {
        bg: '#FDE8E8', // bg-red-100
        text: '#9B1C1C', // text-red-800
      },
      warning: {
        bg: '#FEF3C7', // bg-yellow-100
        text: '#92400E', // text-yellow-800
      },
      info: {
        bg: '#E1F5FE', // bg-blue-50
        text: '#0369A1', // text-blue-800
      },
    },
    // Button variants
    button: {
      primary: {
        bg: '#2563EB', // bg-blue-600
        hover: '#1D4ED8', // hover:bg-blue-700
        text: '#FFFFFF',
      },
      secondary: {
        bg: '#4B5563', // bg-gray-600
        hover: '#374151', // hover:bg-gray-700
        text: '#FFFFFF',
      },
      danger: {
        bg: '#DC2626', // bg-red-600
        hover: '#B91C1C', // hover:bg-red-700
        text: '#FFFFFF',
      },
      success: {
        bg: '#059669', // bg-green-600
        hover: '#047857', // hover:bg-green-700
        text: '#FFFFFF',
      },
    },
    // Input styles
    input: {
      background: '#111827', // bg-gray-900
      border: '#374151', // border-gray-700
      placeholder: '#6B7280', // text-gray-500
      focus: {
        border: '#FB923C', // border-orange-400
        shadow: 'rgba(249, 115, 22, 0.2)', // shadow-orange-500/20
      },
    },
  },
  // Glass effect styles
  glass: {
    background: 'backdrop-blur-md bg-white/5',
    border: 'border border-orange-500/20',
    shadow: 'shadow-md',
  },
  // Layout constants
  layout: {
    sidebar: {
      width: '16rem', // w-64
      zIndex: 'z-50',
    },
    header: {
      height: '4rem', // h-16
      zIndex: 'z-40',
    },
  },
  // Typography
  typography: {
    fontFamily: {
      primary: "'Manrope', sans-serif",
    },
    sizes: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    },
    weights: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
  },
  // Common border radius values
  borderRadius: {
    sm: 'rounded-md',
    default: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
  },
};

// Add missing properties to avoid errors
const addMissingProperties = (theme) => {
  // Deep clone the theme to avoid modifying the original
  const clonedTheme = JSON.parse(JSON.stringify(theme));
  
  // Ensure all commonly used properties exist
  if (!clonedTheme.colors.card) {
    clonedTheme.colors.card = { background: 'rgba(255, 255, 255, 0.05)' };
  }
  
  if (!clonedTheme.colors.border.accent) {
    clonedTheme.colors.border.accent = clonedTheme.colors.text.accent;
  }
  
  if (!clonedTheme.colors.input) {
    clonedTheme.colors.input = {
      background: '#111827',
      border: '#374151',
      placeholder: '#6B7280'
    };
  }
  
  return clonedTheme;
};

// Export the theme with missing properties added
export const theme = addMissingProperties(baseTheme); 