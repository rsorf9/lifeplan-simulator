import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../store/authStore';

export function LoginPage() {
  const { signInWithPassword, signUp, signInWithOAuth } = useAuthStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signin') {
        await signInWithPassword(email, password);
      } else {
        if (password.length < 12) {
          setError('パスワードは12文字以上にしてください');
          return;
        }
        await signUp(email, password);
        setInfo('確認メールを送信しました。リンクをクリックしてサインインしてください。');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>ライフプラン・シミュレーター</h1>
        <p className="muted">{mode === 'signin' ? 'サインイン' : '新規登録'}</p>

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
              minLength={mode === 'signup' ? 12 : 1}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>
          <button type="submit">{mode === 'signin' ? 'サインイン' : '登録'}</button>
        </form>

        {error && <p className="err">{error}</p>}
        {info && <p className="info">{info}</p>}

        <div className="oauth">
          <button onClick={() => signInWithOAuth('google')}>Google でサインイン</button>
          <button onClick={() => signInWithOAuth('github')}>GitHub でサインイン</button>
        </div>

        <p className="switch">
          {mode === 'signin' ? (
            <button className="link" onClick={() => setMode('signup')}>
              アカウントを作成
            </button>
          ) : (
            <button className="link" onClick={() => setMode('signin')}>
              サインインへ戻る
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
