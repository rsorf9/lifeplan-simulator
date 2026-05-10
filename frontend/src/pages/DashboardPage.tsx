import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useScenarios } from '../hooks/useScenarios';
import schema from '../config/sliderSchema.json';
import type { SliderDef } from '../components/DynamicSlider';

const SCHEMA = schema as SliderDef[];

function defaultInputs() {
  return Object.fromEntries(SCHEMA.map((s) => [s.key, s.default]));
}

export function DashboardPage() {
  const { user, signOut } = useAuthStore();
  const { scenarios, loading, create, remove, duplicate } = useScenarios();

  const handleCreate = async () => {
    const name = window.prompt('シナリオ名を入力', '新しいシナリオ');
    if (!name) return;
    await create(name, defaultInputs());
  };

  return (
    <div className="container">
      <header className="header">
        <h1>マイ・シナリオ</h1>
        <div>
          <span className="muted">{user?.email}</span>
          <button onClick={signOut}>サインアウト</button>
        </div>
      </header>

      <div className="actions">
        <button onClick={handleCreate}>+ 新規シナリオ</button>
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
                <button onClick={() => duplicate(s)}>複製</button>
                <button onClick={() => remove(s.id)} className="danger">
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
