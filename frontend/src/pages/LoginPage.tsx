import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../store/authStore';

interface Props {
  onBackToLanding?: () => void;
}

export function LoginPage({ onBackToLanding }: Props) {
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
    <div className="auth-wrap auth-wrap-solo">
      <div className="login-line-qr no-print">
        <p className="login-line-text">
          IDの発行を依頼する場合は<br />こちらから
        </p>
        <img
          src="/line-qr.jpg"
          alt="LINE QR"
          className="login-line-img"
          onError={(e) => {
            const t = e.currentTarget;
            // .jpg がなければ .png にフォールバック
            if (t.src.endsWith('.jpg')) {
              t.src = '/line-qr.png';
              return;
            }
            // どちらもなければプレースホルダー表示
            t.style.display = 'none';
            const sib = t.nextElementSibling as HTMLElement | null;
            if (sib) sib.style.display = 'block';
          }}
        />
        <span className="login-line-fallback" style={{ display: 'none' }}>
          📱 LINE QR
        </span>
      </div>

      <div className="auth-card">
        {onBackToLanding && (
          <button className="auth-back" onClick={onBackToLanding}>
            ← 30秒比較に戻る
          </button>
        )}
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
