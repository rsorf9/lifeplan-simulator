import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { LoginPage } from '../pages/LoginPage';
import { LandingPage } from '../pages/LandingPage';

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading, init } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    void init();
  }, [init]);

  if (loading) return <div className="centered">読み込み中...</div>;
  if (!session) {
    return showLogin ? (
      <LoginPage onBackToLanding={() => setShowLogin(false)} />
    ) : (
      <LandingPage onProceedToLogin={() => setShowLogin(true)} />
    );
  }
  return <>{children}</>;
}
