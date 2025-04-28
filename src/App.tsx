import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import AppRouter from './components/AppRouter';
import { VulnerabilityProvider } from './contexts/VulnerabilityContext';
import './App.css';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green for security
    },
    secondary: {
      main: '#5c6bc0', // Indigo for AI 
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif'
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <VulnerabilityProvider>
          <AppRouter />
        </VulnerabilityProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
