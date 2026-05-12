import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
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

export function AdminPage() {
  const { user, signOut } = useAuthStore();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from('scenarios')
      .select('id, user_id, name, updated_at, created_at, is_archived')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as AdminRow[]);
        setLoading(false);
      });
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/" replace />;

  // user_id 別にグループ化
  const grouped = rows.reduce<Record<string, AdminRow[]>>((acc, r) => {
    (acc[r.user_id] ||= []).push(r);
    return acc;
  }, {});

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

      <p className="muted">全ユーザーのシナリオ履歴を閲覧できます。シナリオ本文の表示はクリックで遷移してください。</p>

      {loading ? (
        <p>読み込み中...</p>
      ) : rows.length === 0 ? (
        <p className="muted">シナリオが見つかりません。</p>
      ) : (
        <div>
          <p className="muted small">合計 {rows.length} 件 / {Object.keys(grouped).length} ユーザー</p>
          {Object.entries(grouped).map(([uid, list]) => (
            <div key={uid} className="admin-group">
              <h3 className="admin-user-id">user_id: <code>{uid}</code> （{list.length}件）</h3>
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
