import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../store/authStore';

export function LoginPage() {
  const { signInWithPassword, signInWithOAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithPassword(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>ライフプラン・シミュレーター</h1>
        <p className="muted">サインイン</p>

        <form onSubmit={submit} className="auth-form">
          <label>
            メールアドレス
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            パスワード
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button type="submit">サインイン</button>
        </form>

        {error && <p className="err">{error}</p>}

        <div className="oauth">
          <button onClick={() => signInWithOAuth('google')}>Google でサインイン</button>
          <button onClick={() => signInWithOAuth('github')}>GitHub でサインイン</button>
        </div>

        <p className="muted small" style={{ marginTop: 20, textAlign: 'center' }}>
          アカウント発行は管理者にご依頼ください。
        </p>
      </div>
    </div>
  );
}
