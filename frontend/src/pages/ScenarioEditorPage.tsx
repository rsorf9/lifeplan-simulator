import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { simulate, PENSION_START_AGE } from '../lib/simulate';
import type { YearRow } from '../lib/simulate';
import { DynamicSlider, type SliderDef } from '../components/DynamicSlider';
import { ChildrenManager } from '../components/ChildrenManager';
import { SpouseToggle } from '../components/SpouseToggle';
import schema from '../config/sliderSchema.json';
import { GROUP_HINTS } from '../config/groupHints';
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

// 印刷用の固定サイズ（横向きA4 ≈ 1100x700 描画領域）
const PRINT_W = 980;
const PRINT_H = 460;

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
  const [renaming, setRenaming] = useState(false);
  const [tmpName, setTmpName] = useState('');
  const [printOpen, setPrintOpen] = useState(false);
  const [printCoverEnabled, setPrintCoverEnabled] = useState(true);
  const [printSelection, setPrintSelection] = useState<Record<ChartTab, boolean>>({
    asset: true,
    'cashflow-chart': true,
    'cashflow-table': false,
    'loan-chart': false,
    'loan-table': true,
  });

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
        setTmpName(s.name);
        setInputs(s.inputs ?? {});
        setExtra(s.extra_settings ?? { has_spouse: false, children: [] });
      });
  }, [id]);

  const result = useMemo(() => simulate(inputs, extra), [inputs, extra]);
  const monthlyAllocMax = result.summary.monthly_alloc_max_year0;

  const save = async () => {
    if (!scenario) return;
    setSaving(true);
    await supabase
      .from('scenarios')
      .update({ inputs, extra_settings: extra, name: scenario.name })
      .eq('id', scenario.id);
    setSaving(false);
  };

  const renameScenario = async () => {
    if (!scenario || !tmpName.trim()) return;
    const newName = tmpName.trim();
    setScenario({ ...scenario, name: newName });
    setRenaming(false);
    await supabase.from('scenarios').update({ name: newName }).eq('id', scenario.id);
  };

  const setChildren = (children: ChildInfo[]) =>
    setExtra((prev) => ({ ...prev, children }));

  if (!scenario) return <div className="container">読み込み中...</div>;

  const visibleSliders = SCHEMA.filter((s) => {
    if (s.group !== activeGroup) return false;
    if (s.requires === 'has_spouse' && !extra.has_spouse) return false;
    return true;
  });

  const monthlySavings = inputs.monthly_savings ?? 0;
  const monthlyInvest = inputs.monthly_investment ?? 0;

  const sliderMaxOverride = (key: string): number | undefined => {
    if (key === 'monthly_savings') {
      return Math.max(0, monthlyAllocMax - monthlyInvest);
    }
    if (key === 'monthly_investment') {
      return Math.max(0, monthlyAllocMax - monthlySavings);
    }
    return undefined;
  };

  const sliderHelper = (key: string): string | undefined => {
    if (key === 'monthly_savings' || key === 'monthly_investment') {
      const used = monthlySavings + monthlyInvest;
      const remain = Math.max(0, monthlyAllocMax - used);
      return `月間の差額: ${monthlyAllocMax.toFixed(1)} 万円　/　残り: ${remain.toFixed(1)} 万円`;
    }
    return undefined;
  };

  const togglePrintTab = (k: ChartTab) =>
    setPrintSelection((s) => ({ ...s, [k]: !s[k] }));

  const doPrint = () => {
    setPrintOpen(false);
    setTimeout(() => window.print(), 100);
  };

  const selectedTabs = CHART_TABS.filter((t) => printSelection[t.key]);

  return (
    <div className="container">
      <header className="header no-print">
        <h1>
          <Link to="/">← 戻る</Link>{' '}
          {renaming ? (
            <input
              autoFocus
              value={tmpName}
              onChange={(e) => setTmpName(e.target.value)}
              onBlur={renameScenario}
              onKeyDown={(e) => {
                if (e.key === 'Enter') renameScenario();
                if (e.key === 'Escape') {
                  setTmpName(scenario.name);
                  setRenaming(false);
                }
              }}
              className="title-edit"
            />
          ) : (
            <span
              onClick={() => setRenaming(true)}
              title="クリックで改名"
              style={{ cursor: 'pointer' }}
            >
              {scenario.name} ✎
            </span>
          )}
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPrintOpen(true)} className="secondary">印刷</button>
          <button onClick={save} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      <div className="editor-layout">
        <section className="sliders no-print">
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
                maxOverride={sliderMaxOverride(s.key)}
                helper={sliderHelper(s.key)}
              />
            ))
          )}

          {activeGroup !== 'family' && visibleSliders.length === 0 && (
            <p className="muted small">このタブには現在表示できる項目がありません。</p>
          )}

          <div className="hints">
            <div className="hints-title">💡 入力のポイント</div>
            <ul>
              {(GROUP_HINTS[activeGroup] ?? []).map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="results">
          <div className="kpi-grid">
            <Kpi label="退職時純資産" value={yen(result.summary.retirement_net_worth)} />
            <Kpi label="総ローン支払" value={yen(result.summary.total_loan_payment)} />
            <Kpi
              label="完済予定"
              value={
                result.summary.loan_paid_off_year
                  ? `${result.summary.loan_paid_off_year} 歳`
                  : '期間内に完済せず'
              }
            />
            <Kpi label="月々返済額" value={yen(result.summary.monthly_loan_payment)} />
            <Kpi label="教育費合計" value={yen(result.summary.total_education_expense)} />
            <Kpi label="受給年金合計" value={yen(result.summary.total_pension_received)} />
            <Kpi
              label="月間の余剰（差額）"
              value={`${result.summary.monthly_alloc_max_year0.toFixed(1)} 万円`}
            />
            <Kpi
              label="最低キャッシュフロー"
              value={yen(result.summary.min_cashflow)}
              danger={result.summary.min_cashflow < 0}
            />
          </div>

          <nav className="chart-tabs no-print">
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

          {/* 画面表示用：レスポンシブ */}
          <div className="chart-area screen-only">
            <ScreenChartView
              tab={activeChart}
              rows={result.rows}
              hasSpouse={!!extra.has_spouse}
              monthlyPayment={result.summary.monthly_loan_payment}
              purchaseAge={result.summary.purchase_age}
            />
          </div>

          {/* 印刷用：表紙＋各シミュレーションを1ページずつ */}
          <div className="print-only print-sheets">
            {printCoverEnabled && (
              <div className="print-cover">
                <div className="print-cover-inner">
                  <h1>ライフプランシミュレーション（概算）</h1>
                  <h2>{scenario.name}</h2>
                  <p className="print-cover-date">
                    出力日：{new Date().toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            )}
            {selectedTabs.map((t) => (
              <div key={t.key} className="print-section">
                <div className="print-section-header">
                  <h2>{t.label}</h2>
                  <span className="print-scenario-name">{scenario.name}</span>
                </div>
                <PrintChartView
                  tab={t.key}
                  rows={result.rows}
                  hasSpouse={!!extra.has_spouse}
                  monthlyPayment={result.summary.monthly_loan_payment}
                  purchaseAge={result.summary.purchase_age}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {printOpen && (
        <div className="modal-back" onClick={() => setPrintOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>印刷する項目を選択</h3>
            <label className="print-cover-toggle">
              <input
                type="checkbox"
                checked={printCoverEnabled}
                onChange={(e) => setPrintCoverEnabled(e.target.checked)}
              />
              表紙を含める（ライフプランシミュレーション 概算）
            </label>
            <ul className="print-list">
              {CHART_TABS.map((t) => (
                <li key={t.key}>
                  <label>
                    <input
                      type="checkbox"
                      checked={printSelection[t.key]}
                      onChange={() => togglePrintTab(t.key)}
                    />
                    {t.label}
                  </label>
                </li>
              ))}
            </ul>
            <p className="muted small">
              ※ 1 シミュレーション 1 ページで横向き印刷されます。ブラウザの印刷ダイアログで「横」を選択してください。
            </p>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setPrintOpen(false)}>キャンセル</button>
              <button onClick={doPrint}>印刷する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="kpi">
      <span className="muted">{label}</span>
      <strong className={danger ? 'danger-text' : ''}>{value}</strong>
    </div>
  );
}

// 画面表示用（ResponsiveContainer）
function ScreenChartView({
  tab,
  rows,
  hasSpouse,
  monthlyPayment,
  purchaseAge,
}: {
  tab: ChartTab;
  rows: YearRow[];
  hasSpouse: boolean;
  monthlyPayment: number;
  purchaseAge: number;
}) {
  if (tab === 'asset') {
    return (
      <ResponsiveContainer width="100%" height={380}>
        <AreaChart data={rows} margin={{ top: 36, right: 30, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="age" />
          <YAxis tickFormatter={formatYenShort} width={70} />
          <Tooltip formatter={(v: number) => yen(v)} />
          <Legend />
          <ReferenceLine
            x={PENSION_START_AGE}
            stroke="#94a3b8"
            strokeDasharray="3 3"
            label={{ value: '年金開始', position: 'insideTop', fill: '#94a3b8', fontSize: 11, offset: 6 }}
          />
          <ReferenceLine
            x={purchaseAge}
            stroke="#a78bfa"
            strokeDasharray="3 3"
            label={{ value: '住宅購入', position: 'insideTop', fill: '#a78bfa', fontSize: 11, offset: 22 }}
          />
          <Area type="monotone" dataKey="savings" name="貯蓄" stackId="assets" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.55} />
          <Area type="monotone" dataKey="investment" name="投資" stackId="assets" stroke="#16a34a" fill="#16a34a" fillOpacity={0.55} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  if (tab === 'cashflow-chart') {
    return (
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={rows} margin={{ top: 30, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="age" />
          <YAxis tickFormatter={formatYenShort} width={70} />
          <Tooltip formatter={(v: number) => yen(v)} />
          <Legend />
          <ReferenceLine x={PENSION_START_AGE} stroke="#94a3b8" strokeDasharray="3 3" />
          <Bar dataKey="own_salary" name="給与（本人）" stackId="inc" fill="#16a34a" />
          {hasSpouse && <Bar dataKey="spouse_salary" name="給与（配偶者）" stackId="inc" fill="#65a30d" />}
          <Bar dataKey="own_pension" name="年金（本人）" stackId="inc" fill="#22d3ee" />
          {hasSpouse && <Bar dataKey="spouse_pension" name="年金（配偶者）" stackId="inc" fill="#0ea5e9" />}
          <Bar dataKey="living_expense" name="生活費" stackId="exp" fill="#94a3b8" />
          <Bar dataKey="loan_payment" name="ローン返済" stackId="exp" fill="#dc2626" />
          <Bar dataKey="education_expense" name="教育費" stackId="exp" fill="#a855f7" />
          <Line type="monotone" dataKey="cashflow" name="差額" stroke="#2563eb" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }
  if (tab === 'cashflow-table') return <CashflowTable rows={rows} hasSpouse={hasSpouse} />;
  if (tab === 'loan-chart') {
    return (
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={rows} margin={{ top: 30, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="age" />
          <YAxis tickFormatter={formatYenShort} width={70} />
          <Tooltip formatter={(v: number) => yen(v)} />
          <Legend />
          <ReferenceLine
            x={purchaseAge}
            stroke="#a78bfa"
            strokeDasharray="3 3"
            label={{ value: '購入', position: 'insideTop', fill: '#a78bfa', fontSize: 11, offset: 8 }}
          />
          <Line type="monotone" dataKey="loan_balance" name="ローン残高" stroke="#dc2626" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="loan_payment" name="年間返済額" stroke="#f97316" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  return <LoanTable rows={rows} monthlyPayment={monthlyPayment} />;
}

// 印刷用：固定サイズ Recharts（ResponsiveContainer なし）
function PrintChartView({
  tab,
  rows,
  hasSpouse,
  monthlyPayment,
  purchaseAge,
}: {
  tab: ChartTab;
  rows: YearRow[];
  hasSpouse: boolean;
  monthlyPayment: number;
  purchaseAge: number;
}) {
  if (tab === 'asset') {
    return (
      <AreaChart width={PRINT_W} height={PRINT_H} data={rows} margin={{ top: 40, right: 30, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="age" />
        <YAxis tickFormatter={formatYenShort} width={80} />
        <Legend />
        <ReferenceLine x={PENSION_START_AGE} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '年金開始', position: 'insideTop', fill: '#475569', fontSize: 12, offset: 8 }} />
        <ReferenceLine x={purchaseAge} stroke="#a78bfa" strokeDasharray="3 3" label={{ value: '住宅購入', position: 'insideTop', fill: '#7c3aed', fontSize: 12, offset: 26 }} />
        <Area type="monotone" dataKey="savings" name="貯蓄" stackId="assets" stroke="#f59e0b" fill="#fbbf24" fillOpacity={0.55} />
        <Area type="monotone" dataKey="investment" name="投資" stackId="assets" stroke="#16a34a" fill="#4ade80" fillOpacity={0.55} />
      </AreaChart>
    );
  }
  if (tab === 'cashflow-chart') {
    return (
      <ComposedChart width={PRINT_W} height={PRINT_H} data={rows} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="age" />
        <YAxis tickFormatter={formatYenShort} width={80} />
        <Legend />
        <ReferenceLine x={PENSION_START_AGE} stroke="#94a3b8" strokeDasharray="3 3" />
        <Bar dataKey="own_salary" name="給与（本人）" stackId="inc" fill="#16a34a" />
        {hasSpouse && <Bar dataKey="spouse_salary" name="給与（配偶者）" stackId="inc" fill="#65a30d" />}
        <Bar dataKey="own_pension" name="年金（本人）" stackId="inc" fill="#22d3ee" />
        {hasSpouse && <Bar dataKey="spouse_pension" name="年金（配偶者）" stackId="inc" fill="#0ea5e9" />}
        <Bar dataKey="living_expense" name="生活費" stackId="exp" fill="#94a3b8" />
        <Bar dataKey="loan_payment" name="ローン返済" stackId="exp" fill="#dc2626" />
        <Bar dataKey="education_expense" name="教育費" stackId="exp" fill="#a855f7" />
        <Line type="monotone" dataKey="cashflow" name="差額" stroke="#2563eb" strokeWidth={2} dot={false} />
      </ComposedChart>
    );
  }
  if (tab === 'cashflow-table') return <CashflowTable rows={rows} hasSpouse={hasSpouse} />;
  if (tab === 'loan-chart') {
    return (
      <LineChart width={PRINT_W} height={PRINT_H} data={rows} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="age" />
        <YAxis tickFormatter={formatYenShort} width={80} />
        <Legend />
        <ReferenceLine x={purchaseAge} stroke="#a78bfa" strokeDasharray="3 3" label={{ value: '購入', position: 'insideTop', fill: '#7c3aed', fontSize: 12, offset: 10 }} />
        <Line type="monotone" dataKey="loan_balance" name="ローン残高" stroke="#dc2626" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="loan_payment" name="年間返済額" stroke="#f97316" dot={false} />
      </LineChart>
    );
  }
  return <LoanTable rows={rows} monthlyPayment={monthlyPayment} />;
}

function CashflowTable({ rows, hasSpouse }: { rows: YearRow[]; hasSpouse: boolean }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          {hasSpouse ? (
            <tr>
              <th>年齢</th>
              <th>収入（本人）</th>
              <th>収入（配偶者）</th>
              <th>生活費</th>
              <th>ローン</th>
              <th>教育費</th>
              <th>差額</th>
              <th>投資残高</th>
              <th>貯蓄残高</th>
            </tr>
          ) : (
            <tr>
              <th>年齢</th>
              <th>給与</th>
              <th>年金</th>
              <th>生活費</th>
              <th>ローン</th>
              <th>教育費</th>
              <th>差額</th>
              <th>投資残高</th>
              <th>貯蓄残高</th>
            </tr>
          )}
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.year}>
              <td>{r.age}</td>
              {hasSpouse ? (
                <>
                  <td className="num">{r.own_income.toLocaleString()}</td>
                  <td className="num">{r.spouse_income.toLocaleString()}</td>
                </>
              ) : (
                <>
                  <td className="num">{r.own_salary.toLocaleString()}</td>
                  <td className="num">{r.own_pension.toLocaleString()}</td>
                </>
              )}
              <td className="num">{r.living_expense.toLocaleString()}</td>
              <td className="num">{r.loan_payment.toLocaleString()}</td>
              <td className="num">{r.education_expense.toLocaleString()}</td>
              <td className={'num ' + (r.cashflow < 0 ? 'danger-text' : '')}>{r.cashflow.toLocaleString()}</td>
              <td className="num">{r.investment.toLocaleString()}</td>
              <td className="num">{r.savings.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">単位: 円　/　収入は給与＋年金。65 歳以降は年金を自動加算。投資残高は運用利回り反映後の累計評価額</p>
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
      <p className="muted small">単位: 円　/　元利均等返済。完済後は 0 円</p>
    </div>
  );
}
