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
      <div className="auth-grid">
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

        <div className="tool-card">
          <div className="tool-card-header">
            <h2>🏠 ログイン不要：賃貸 vs 購入 30秒比較</h2>
            <p className="muted small">
              内見中にスマホで開いて、家賃と物件価格を入力するだけ。
              <a href="/rent-vs-buy.html" target="_blank" rel="noopener" className="open-link">
                別タブで開く ↗
              </a>
            </p>
          </div>
          <iframe
            src="/rent-vs-buy.html"
            className="tool-iframe"
            title="賃貸 vs 購入 比較ツール"
          />
        </div>
      </div>
    </div>
  );
}
