import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { simulate } from '../lib/simulate';
import { DynamicSlider, type SliderDef } from '../components/DynamicSlider';
import schema from '../config/sliderSchema.json';
import type { Scenario, SliderInputs } from '../lib/types';

const SCHEMA = schema as SliderDef[];
const GROUPS: { key: string; label: string }[] = [
  { key: 'housing', label: '住宅' },
  { key: 'savings', label: '貯蓄' },
  { key: 'investment', label: '投資' },
  { key: 'income', label: '収入' },
];

export function ScenarioEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [inputs, setInputs] = useState<SliderInputs>({});
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('housing');

  useEffect(() => {
    if (!id) return;
    supabase
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;
        setScenario(data as Scenario);
        setInputs((data as Scenario).inputs ?? {});
      });
  }, [id]);

  const result = useMemo(() => simulate(inputs), [inputs]);

  const save = async () => {
    if (!scenario) return;
    setSaving(true);
    await supabase.from('scenarios').update({ inputs }).eq('id', scenario.id);
    setSaving(false);
  };

  if (!scenario) return <div className="container">読み込み中...</div>;

  return (
    <div className="container">
      <header className="header">
        <h1>
          <Link to="/">← 戻る</Link> {scenario.name}
        </h1>
        <button onClick={save} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </button>
      </header>

      <div className="editor-layout">
        <section className="sliders">
          <nav className="group-tabs">
            {GROUPS.map((g) => (
              <button
                key={g.key}
                className={activeGroup === g.key ? 'active' : ''}
                onClick={() => setActiveGroup(g.key)}
              >
                {g.label}
              </button>
            ))}
          </nav>
          {SCHEMA.filter((s) => s.group === activeGroup).map((s) => (
            <DynamicSlider
              key={s.key}
              def={s}
              value={inputs[s.key] ?? s.default}
              onChange={(v) => setInputs((prev) => ({ ...prev, [s.key]: v }))}
            />
          ))}
        </section>

        <section className="results">
          <div className="kpi-grid">
            <div className="kpi">
              <span className="muted">退職時純資産</span>
              <strong>{result.summary.retirement_net_worth.toLocaleString()} 円</strong>
            </div>
            <div className="kpi">
              <span className="muted">総ローン支払</span>
              <strong>{result.summary.total_loan_payment.toLocaleString()} 円</strong>
            </div>
            <div className="kpi">
              <span className="muted">完済予定</span>
              <strong>
                {result.summary.loan_paid_off_year
                  ? `${result.summary.loan_paid_off_year} 歳`
                  : '退職までに完済せず'}
              </strong>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={result.rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="net_worth" name="純資産" stroke="#2563eb" />
              <Line type="monotone" dataKey="investment" name="投資" stroke="#16a34a" />
              <Line type="monotone" dataKey="loan_balance" name="ローン残高" stroke="#dc2626" />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );
}
