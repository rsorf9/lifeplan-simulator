import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { simulate } from '../lib/simulate';
import type { YearRow } from '../lib/simulate';
import { DynamicSlider, type SliderDef } from '../components/DynamicSlider';
import { ChildrenManager } from '../components/ChildrenManager';
import { SpouseToggle } from '../components/SpouseToggle';
import schema from '../config/sliderSchema.json';
import type {
  Scenario,
  SliderInputs,
  ScenarioExtraSettings,
  ChildInfo,
} from '../lib/types';

const SCHEMA = schema as (SliderDef & { requires?: string })[];

type InputGroup =
  | 'basic'
  | 'income'
  | 'housing'
  | 'expense'
  | 'savings'
  | 'investment'
  | 'family';

const INPUT_GROUPS: { key: InputGroup; label: string }[] = [
  { key: 'basic', label: '基本' },
  { key: 'income', label: '収入' },
  { key: 'housing', label: '住宅' },
  { key: 'expense', label: '支出' },
  { key: 'savings', label: '貯蓄' },
  { key: 'investment', label: '投資' },
  { key: 'family', label: '家族' },
];

type ChartTab =
  | 'asset'
  | 'cashflow-chart'
  | 'cashflow-table'
  | 'loan-chart'
  | 'loan-table';

const CHART_TABS: { key: ChartTab; label: string }[] = [
  { key: 'asset', label: '資産推移' },
  { key: 'cashflow-chart', label: 'キャッシュフロー（グラフ）' },
  { key: 'cashflow-table', label: 'キャッシュフロー（表）' },
  { key: 'loan-chart', label: '住宅ローン（グラフ）' },
  { key: 'loan-table', label: '住宅ローン（表）' },
];

const yen = (v: number) => `${v.toLocaleString()} 円`;

function formatYenShort(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 100000000) return `${(v / 100000000).toFixed(1)}億`;
  if (abs >= 10000) return `${Math.round(v / 10000).toLocaleString()}万`;
  return v.toLocaleString();
}

export function ScenarioEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [inputs, setInputs] = useState<SliderInputs>({});
  const [extra, setExtra] = useState<ScenarioExtraSettings>({
    has_spouse: false,
    children: [],
  });
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState<InputGroup>('basic');
  const [activeChart, setActiveChart] = useState<ChartTab>('asset');

  useEffect(() => {
    if (!id) return;
    supabase
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;
        const s = data as Scenario;
        setScenario(s);
        setInputs(s.inputs ?? {});
        setExtra(s.extra_settings ?? { has_spouse: false, children: [] });
      });
  }, [id]);

  const result = useMemo(() => simulate(inputs, extra), [inputs, extra]);

  const save = async () => {
    if (!scenario) return;
    setSaving(true);
    await supabase
      .from('scenarios')
      .update({ inputs, extra_settings: extra })
      .eq('id', scenario.id);
    setSaving(false);
  };

  const setChildren = (children: ChildInfo[]) =>
    setExtra((prev) => ({ ...prev, children }));

  if (!scenario) return <div className="container">読み込み中...</div>;

  const visibleSliders = SCHEMA.filter((s) => {
    if (s.group !== activeGroup) return false;
    if (s.requires === 'has_spouse' && !extra.has_spouse) return false;
    return true;
  });

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
            {INPUT_GROUPS.map((g) => (
              <button
                key={g.key}
                className={activeGroup === g.key ? 'active' : ''}
                onClick={() => setActiveGroup(g.key)}
              >
                {g.label}
              </button>
            ))}
          </nav>

          {(activeGroup === 'income' || activeGroup === 'basic') && (
            <SpouseToggle
              hasSpouse={!!extra.has_spouse}
              onChange={(v) => setExtra((prev) => ({ ...prev, has_spouse: v }))}
            />
          )}

          {activeGroup === 'family' ? (
            <ChildrenManager
              children={extra.children ?? []}
              onChange={setChildren}
            />
          ) : (
            visibleSliders.map((s) => (
              <DynamicSlider
                key={s.key}
                def={s}
                value={inputs[s.key] ?? s.default}
                onChange={(v) => setInputs((prev) => ({ ...prev, [s.key]: v }))}
              />
            ))
          )}

          {activeGroup !== 'family' && visibleSliders.length === 0 && (
            <p className="muted small">このタブには現在表示できる項目がありません。</p>
          )}
        </section>

        <section className="results">
          <div className="kpi-grid">
            <div className="kpi">
              <span className="muted">退職時純資産</span>
              <strong>{yen(result.summary.retirement_net_worth)}</strong>
            </div>
            <div className="kpi">
              <span className="muted">総ローン支払</span>
              <strong>{yen(result.summary.total_loan_payment)}</strong>
            </div>
            <div className="kpi">
              <span className="muted">完済予定</span>
              <strong>
                {result.summary.loan_paid_off_year
                  ? `${result.summary.loan_paid_off_year} 歳`
                  : '期間内に完済せず'}
              </strong>
            </div>
            <div className="kpi">
              <span className="muted">月々返済額</span>
              <strong>{yen(result.summary.monthly_loan_payment)}</strong>
            </div>
            <div className="kpi">
              <span className="muted">教育費合計</span>
              <strong>{yen(result.summary.total_education_expense)}</strong>
            </div>
            <div className="kpi">
              <span className="muted">最低キャッシュフロー</span>
              <strong className={result.summary.min_cashflow < 0 ? 'danger-text' : ''}>
                {yen(result.summary.min_cashflow)}
              </strong>
            </div>
          </div>

          <nav className="chart-tabs">
            {CHART_TABS.map((t) => (
              <button
                key={t.key}
                className={activeChart === t.key ? 'active' : ''}
                onClick={() => setActiveChart(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {activeChart === 'asset' && (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={result.rows} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" />
                <YAxis tickFormatter={formatYenShort} width={70} />
                <Tooltip formatter={(v: number) => yen(v)} />
                <Legend />
                <Line type="monotone" dataKey="investment" name="投資" stroke="#16a34a" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="savings" name="貯蓄" stroke="#f59e0b" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="loan_balance" name="ローン残高" stroke="#dc2626" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'cashflow-chart' && (
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={result.rows} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" />
                <YAxis tickFormatter={formatYenShort} width={70} />
                <Tooltip formatter={(v: number) => yen(v)} />
                <Legend />
                <Bar dataKey="income" name="収入" fill="#16a34a" />
                <Bar dataKey="living_expense" name="生活費" stackId="exp" fill="#94a3b8" />
                <Bar dataKey="loan_payment" name="ローン返済" stackId="exp" fill="#dc2626" />
                <Bar dataKey="education_expense" name="教育費" stackId="exp" fill="#a855f7" />
                <Line type="monotone" dataKey="cashflow" name="差額" stroke="#2563eb" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'cashflow-table' && <CashflowTable rows={result.rows} />}

          {activeChart === 'loan-chart' && (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={result.rows} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" />
                <YAxis tickFormatter={formatYenShort} width={70} />
                <Tooltip formatter={(v: number) => yen(v)} />
                <Legend />
                <Line type="monotone" dataKey="loan_balance" name="ローン残高" stroke="#dc2626" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="loan_payment" name="年間返済額" stroke="#f97316" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'loan-table' && (
            <LoanTable rows={result.rows} monthlyPayment={result.summary.monthly_loan_payment} />
          )}
        </section>
      </div>
    </div>
  );
}

function CashflowTable({ rows }: { rows: YearRow[] }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>年齢</th>
            <th>収入</th>
            <th>生活費</th>
            <th>ローン</th>
            <th>教育費</th>
            <th>差額</th>
            <th>貯蓄残高</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.year}>
              <td>{r.age}</td>
              <td className="num">{r.income.toLocaleString()}</td>
              <td className="num">{r.living_expense.toLocaleString()}</td>
              <td className="num">{r.loan_payment.toLocaleString()}</td>
              <td className="num">{r.education_expense.toLocaleString()}</td>
              <td className={'num ' + (r.cashflow < 0 ? 'danger-text' : '')}>{r.cashflow.toLocaleString()}</td>
              <td className="num">{r.savings.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">単位: 円</p>
    </div>
  );
}

function LoanTable({ rows, monthlyPayment }: { rows: YearRow[]; monthlyPayment: number }) {
  return (
    <div className="table-wrap">
      <p className="muted small">
        固定金利想定の月々の返済額: <strong>{monthlyPayment.toLocaleString()} 円</strong>
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th>年齢</th>
            <th>年間返済額</th>
            <th>うち利息</th>
            <th>うち元本</th>
            <th>残高</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.year}>
              <td>{r.age}</td>
              <td className="num">{r.loan_payment.toLocaleString()}</td>
              <td className="num">{r.loan_interest.toLocaleString()}</td>
              <td className="num">{r.loan_principal.toLocaleString()}</td>
              <td className="num">{r.loan_balance.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">単位: 円</p>
    </div>
  );
}
