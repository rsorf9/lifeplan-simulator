import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { isAdminEmail } from '../lib/admin';

interface AdminRow {
  id: string;
  user_id: string;
  name: string;
  updated_at: string;
  created_at: string;
  is_archived: boolean;
}

interface AdminUser {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
}

async function callAdminFn(action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action, ...body },
  });
  if (error) {
    const msg = (data as { error?: string } | null)?.error ?? error.message;
    throw new Error(msg);
  }
  if ((data as { error?: string }).error) {
    throw new Error((data as { error: string }).error);
  }
  return data;
}

function isBanned(u: AdminUser): boolean {
  if (!u.banned_until) return false;
  const t = new Date(u.banned_until).getTime();
  return Number.isFinite(t) && t > Date.now();
}

export function AdminPage() {
  const { user, signOut } = useAuthStore();
  const [scenarios, setScenarios] = useState<AdminRow[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  const isAdmin = isAdminEmail(user?.email);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const { users: us } = (await callAdminFn('list')) as { users: AdminUser[] };
      setUsers(us);
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : String(e));
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from('scenarios')
      .select('id, user_id, name, updated_at, created_at, is_archived')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setScenarios((data ?? []) as AdminRow[]);
        setScenariosLoading(false);
      });
    loadUsers();
  }, [isAdmin, loadUsers]);

  if (!isAdmin) return <Navigate to="/" replace />;

  const grouped = scenarios.reduce<Record<string, AdminRow[]>>((acc, r) => {
    (acc[r.user_id] ||= []).push(r);
    return acc;
  }, {});

  const emailById = (uid: string) =>
    users.find((u) => u.id === uid)?.email ?? '(不明)';

  const toggleBan = async (u: AdminUser) => {
    if (u.id === user?.id) return;
    const banned = !isBanned(u);
    const msg = banned ? 'このアカウントの利用を停止しますか？' : 'このアカウントの利用を再開しますか？';
    if (!window.confirm(`${u.email}\n${msg}`)) return;
    try {
      await callAdminFn('set_banned', { userId: u.id, banned });
      await loadUsers();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e));
    }
  };

  const deleteUser = async (u: AdminUser) => {
    if (u.id === user?.id) return;
    if (!window.confirm(`${u.email}\nこのアカウントを完全に削除しますか？（取り消し不可）`)) return;
    try {
      await callAdminFn('delete', { userId: u.id });
      await loadUsers();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>
          <Link to="/">← 戻る</Link> 管理者ページ
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="muted">{user?.email}</span>
          <button onClick={signOut} className="secondary">サインアウト</button>
        </div>
      </header>

      <CreateUserSection onCreated={loadUsers} />

      <section className="admin-card">
        <div className="admin-card-header">
          <h2>発行済みアカウント一覧</h2>
          <button onClick={loadUsers} className="secondary small">再読込</button>
        </div>
        {usersError && <p className="err">{usersError}</p>}
        {usersLoading ? (
          <p className="muted">読み込み中...</p>
        ) : users.length === 0 ? (
          <p className="muted">アカウントがありません。</p>
        ) : (
          <div className="table-wrap" style={{ maxHeight: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>メール</th>
                  <th>状態</th>
                  <th>作成日</th>
                  <th>最終ログイン</th>
                  <th>メール確認</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const banned = isBanned(u);
                  const self = u.id === user?.id;
                  return (
                    <tr key={u.id}>
                      <td>{u.email}{self && <span className="badge">あなた</span>}</td>
                      <td>
                        {banned ? (
                          <span className="status-banned">利用停止</span>
                        ) : (
                          <span className="status-active">利用可</span>
                        )}
                      </td>
                      <td>{new Date(u.created_at).toLocaleString('ja-JP')}</td>
                      <td>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString('ja-JP') : '—'}</td>
                      <td>{u.email_confirmed_at ? '✓' : '未'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className={banned ? '' : 'secondary'}
                            disabled={self}
                            onClick={() => toggleBan(u)}
                            style={{ fontSize: 12, padding: '4px 10px' }}
                          >
                            {banned ? '利用再開' : '利用停止'}
                          </button>
                          <button
                            className="danger"
                            disabled={self}
                            onClick={() => deleteUser(u)}
                            style={{ fontSize: 12, padding: '4px 10px' }}
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <h2 className="admin-section-title">全シナリオ履歴</h2>
      <p className="muted small">user_id 別に表示します。各シナリオはクリックで内容を閲覧できます。</p>

      {scenariosLoading ? (
        <p>読み込み中...</p>
      ) : scenarios.length === 0 ? (
        <p className="muted">シナリオが見つかりません。</p>
      ) : (
        <div>
          <p className="muted small">合計 {scenarios.length} 件 / {Object.keys(grouped).length} ユーザー</p>
          {Object.entries(grouped).map(([uid, list]) => (
            <div key={uid} className="admin-group">
              <h3 className="admin-user-id">
                {emailById(uid)} <code>{uid.slice(0, 8)}…</code>（{list.length}件）
              </h3>
              <ul className="scenario-list">
                {list.map((r) => (
                  <li key={r.id} className="scenario-card">
                    <div>
                      <Link to={`/scenario/${r.id}`}>
                        <strong>{r.name}</strong>
                      </Link>
                      <p className="muted small">
                        作成: {new Date(r.created_at).toLocaleString('ja-JP')}　/　
                        更新: {new Date(r.updated_at).toLocaleString('ja-JP')}
                        {r.is_archived && <span className="badge">アーカイブ済み</span>}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateUserSection({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    if (!email.trim()) {
      setResult({ type: 'err', msg: 'メールアドレスを入力してください' });
      return;
    }
    if (password.length < 12) {
      setResult({ type: 'err', msg: 'パスワードは 12 文字以上にしてください' });
      return;
    }
    setBusy(true);
    try {
      const tmp = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const { error } = await tmp.auth.signUp({ email: email.trim(), password });
      if (error) {
        setResult({ type: 'err', msg: error.message });
      } else {
        setResult({
          type: 'ok',
          msg: `アカウントを作成しました: ${email.trim()}（メール確認設定が ON の場合、確認メールが送信されます）`,
        });
        setEmail('');
        setPassword('');
        onCreated();
      }
    } catch (err) {
      setResult({ type: 'err', msg: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <h2>アカウント作成</h2>
        <button onClick={() => setOpen((v) => !v)} className="secondary small">
          {open ? '閉じる' : '開く'}
        </button>
      </div>
      {open && (
        <form onSubmit={submit} className="create-user-form">
          <p className="muted small">
            新規ユーザーのメールアドレスと初期パスワード（12 文字以上）を入力してください。
          </p>
          <label>
            メールアドレス
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
          </label>
          <label>
            初期パスワード
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} autoComplete="new-password" />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? '作成中...' : '作成する'}
          </button>
          {result && <p className={result.type === 'ok' ? 'info' : 'err'}>{result.msg}</p>}
        </form>
      )}
    </section>
  );
}
