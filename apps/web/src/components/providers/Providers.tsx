'use client';

import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { store } from '@/lib/store';
import { muiTheme } from '@/lib/theme';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={muiTheme}>
          <CssBaseline />
          {children}
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1E293B',
                color: '#F1F5F9',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              },
              success: {
                iconTheme: { primary: '#10B981', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#EF4444', secondary: '#fff' },
              },
            }}
          />
        </ThemeProvider>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </Provider>
  );
}
