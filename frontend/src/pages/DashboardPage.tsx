import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useScenarios } from '../hooks/useScenarios';
import { isAdminEmail } from '../lib/admin';
import schema from '../config/sliderSchema.json';
import type { SliderDef } from '../components/DynamicSlider';

const SCHEMA = schema as SliderDef[];

function defaultInputs() {
  return Object.fromEntries(SCHEMA.map((s) => [s.key, s.default]));
}

export function DashboardPage() {
  const { user, signOut } = useAuthStore();
  const { scenarios, loading, create, remove, duplicate } = useScenarios();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const isAdmin = isAdminEmail(user?.email);

  const submitNew = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await create(name, defaultInputs());
      setNewName('');
      setShowNew(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>マイ・シナリオ</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAdmin && (
            <Link to="/admin" className="admin-badge">
              管理者ページ
            </Link>
          )}
          <span className="muted">{user?.email}</span>
          <button onClick={signOut} className="secondary">サインアウト</button>
        </div>
      </header>

      <div className="actions">
        <button onClick={() => setShowNew(true)}>+ 新規シナリオ</button>
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : scenarios.length === 0 ? (
        <p className="muted">まだシナリオがありません。「新規シナリオ」から作成してください。</p>
      ) : (
        <ul className="scenario-list">
          {scenarios.map((s) => (
            <li key={s.id} className="scenario-card">
              <div>
                <Link to={`/scenario/${s.id}`}>
                  <strong>{s.name}</strong>
                </Link>
                <p className="muted">
                  更新: {new Date(s.updated_at).toLocaleString('ja-JP')}
                </p>
              </div>
              <div className="card-actions">
                <button onClick={() => duplicate(s)} className="secondary">複製</button>
                <button onClick={() => remove(s.id)} className="danger">
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showNew && (
        <div className="modal-back" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>新規シナリオ</h3>
            <p className="muted small">分かりやすい名前を付けてください（後から変更可能）。</p>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例：マイホーム購入プラン"
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNew();
              }}
              className="text-input"
            />
            <div className="modal-actions">
              <button className="secondary" onClick={() => setShowNew(false)}>キャンセル</button>
              <button onClick={submitNew} disabled={busy || !newName.trim()}>
                {busy ? '作成中...' : '作成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
