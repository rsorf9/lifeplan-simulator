import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { LoginPage } from '../pages/LoginPage';

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading, init } = useAuthStore();

  useEffect(() => {
    void init();
  }, [init]);

  if (loading) return <div className="centered">読み込み中...</div>;
  if (!session) return <LoginPage />;
  return <>{children}</>;
}
