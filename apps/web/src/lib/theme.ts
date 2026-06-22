import { createTheme, alpha } from '@mui/material/styles';

export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366F1',
      light: '#818CF8',
      dark: '#4338CA',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8B5CF6',
      light: '#A78BFA',
      dark: '#7C3AED',
    },
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    error:   { main: '#EF4444' },
    info:    { main: '#3B82F6' },
    background: {
      default: '#F8FAFC',
      paper:   '#FFFFFF',
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
    h1: { fontFamily: "'Outfit', sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Outfit', sans-serif", fontWeight: 700 },
    h3: { fontFamily: "'Outfit', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    h5: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    h6: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '8px 20px',
        },
        containedPrimary: {
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
          backgroundColor: '#1E293B',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4 },
      },
    },
  },
});
