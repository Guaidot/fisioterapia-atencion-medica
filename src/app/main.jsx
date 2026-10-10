import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { AppContainerProvider } from './container.jsx';
import { router } from './router.jsx';
import '../index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppContainerProvider>
        <RouterProvider router={router} />
      </AppContainerProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);