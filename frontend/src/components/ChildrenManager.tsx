import type { ChildInfo } from '../lib/types';
import { EDUCATION_PATH_LABELS, type EducationPath } from '../lib/educationCosts';

interface Props {
  children: ChildInfo[];
  onChange: (next: ChildInfo[]) => void;
}

const PATHS: EducationPath[] = ['public', 'private', 'mixed'];

export function ChildrenManager({ children, onChange }: Props) {
  const add = () => onChange([...children, { age: 0, path: 'public' }]);
  const remove = (idx: number) =>
    onChange(children.filter((_, i) => i !== idx));
  const update = (idx: number, patch: Partial<ChildInfo>) =>
    onChange(children.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  return (
    <div className="children-mgr">
      <div className="children-header">
        <span className="muted">登録済み {children.length} 人</span>
        <button onClick={add} className="small">
          + 子供を追加
        </button>
      </div>
      {children.length === 0 && (
        <p className="muted small">
          子供を追加すると教育費が自動でシミュレーションに反映されます。
        </p>
      )}
      <ul className="children-list">
        {children.map((c, idx) => (
          <li key={idx} className="child-row">
            <span className="child-no">#{idx + 1}</span>
            <label>
              <span className="muted small">現在の年齢</span>
              <input
                type="number"
                min={0}
                max={25}
                value={c.age}
                onChange={(e) =>
                  update(idx, { age: Math.max(0, Number(e.target.value)) })
                }
              />
            </label>
            <label>
              <span className="muted small">進路</span>
              <select
                value={c.path}
                onChange={(e) =>
                  update(idx, { path: e.target.value as EducationPath })
                }
              >
                {PATHS.map((p) => (
                  <option key={p} value={p}>
                    {EDUCATION_PATH_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => remove(idx)} className="small danger">
              削除
            </button>
          </li>
        ))}
      </ul>
      <p className="muted small">
        ※ 教育費は文部科学省「子供の学習費調査」を参考にした概算値です。
      </p>
    </div>
  );
}
