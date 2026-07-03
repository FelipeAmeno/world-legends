'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { mockApi } from '@/lib/api/mock-client';
import { ToastContainer } from '@/components/layout/toast';

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }));
  return (
    <QueryClientProvider client={qc}>
      <AuthInit />{children}<ToastContainer />
    </QueryClientProvider>
  );
}

function AuthInit() {
  const { setProfile, setLoading } = useAuthStore();
  useEffect(() => {
    mockApi.getMe().then(setProfile).catch(() => setProfile(null)).finally(() => setLoading(false));
  }, [setProfile, setLoading]);
  return null;
}
