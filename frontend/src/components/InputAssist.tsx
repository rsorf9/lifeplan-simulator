import { useState } from 'react';
import type { SliderInputs, ScenarioExtraSettings, ChildInfo } from '../lib/types';

interface Preset {
  id: string;
  emoji: string;
  label: string;
  description: string;
  inputs: Partial<SliderInputs>;
  extra: Partial<ScenarioExtraSettings>;
}

// 一般家庭の代表的プリセット（手取り・生活費は厚労省/家計調査の平均を参考）
const PRESETS: Preset[] = [
  {
    id: 'single',
    emoji: '🧑',
    label: '独身（一人暮らし）',
    description: '30代独身、手取り 400 万円、家賃あり、貯蓄優先型',
    inputs: {
      current_age: 30,
      retirement_age: 65,
      annual_income: 400,
      monthly_rent: 9,
      monthly_expense: 18,
      annual_expense: 40,
      current_savings: 300,
      monthly_investment: 3,
      savings_return: 0.05,
      expected_return: 5.0,
    },
    extra: {
      has_spouse: false,
      is_renter: true,
      children: [],
    },
  },
  {
    id: 'dink',
    emoji: '👫',
    label: '夫婦・子供なし（DINKs）',
    description: '30代夫婦、世帯手取り 750 万円、住宅購入予定',
    inputs: {
      current_age: 32,
      retirement_age: 65,
      spouse_age: 30,
      spouse_retirement_age: 65,
      annual_income: 450,
      spouse_income: 300,
      house_purchase_age: 35,
      house_price: 4500,
      down_payment: 500,
      interest_rate: 1.2,
      loan_years: 35,
      monthly_expense: 24,
      annual_expense: 50,
      current_savings: 600,
      monthly_investment: 6,
      savings_return: 0.05,
      expected_return: 5.0,
    },
    extra: {
      has_spouse: true,
      is_renter: false,
      children: [],
    },
  },
  {
    id: 'family-1',
    emoji: '👨‍👩‍👦',
    label: '夫婦＋子供1人',
    description: '30代夫婦、子供 3 歳、手取り合計 720 万、住宅購入済',
    inputs: {
      current_age: 35,
      retirement_age: 65,
      spouse_age: 33,
      spouse_retirement_age: 65,
      annual_income: 480,
      spouse_income: 240,
      house_purchase_age: 33,
      house_price: 4500,
      down_payment: 500,
      interest_rate: 1.2,
      loan_years: 35,
      monthly_expense: 25,
      annual_expense: 55,
      current_savings: 800,
      monthly_investment: 5,
      savings_return: 0.05,
      expected_return: 5.0,
    },
    extra: {
      has_spouse: true,
      is_renter: false,
      children: [{ age: 3, path: 'public' } as ChildInfo],
    },
  },
  {
    id: 'family-2',
    emoji: '👨‍👩‍👧‍👦',
    label: '夫婦＋子供2人',
    description: '30代後半夫婦、子供 5 歳・2 歳、住宅購入済、教育費考慮',
    inputs: {
      current_age: 38,
      retirement_age: 65,
      spouse_age: 36,
      spouse_retirement_age: 65,
      annual_income: 520,
      spouse_income: 200,
      house_purchase_age: 35,
      house_price: 4800,
      down_payment: 600,
      interest_rate: 1.2,
      loan_years: 35,
      monthly_expense: 28,
      annual_expense: 60,
      current_savings: 1000,
      monthly_investment: 5,
      savings_return: 0.05,
      expected_return: 5.0,
    },
    extra: {
      has_spouse: true,
      is_renter: false,
      children: [
        { age: 5, path: 'public' } as ChildInfo,
        { age: 2, path: 'public' } as ChildInfo,
      ],
    },
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (inputs: SliderInputs, extra: ScenarioExtraSettings) => void;
  currentInputs: SliderInputs;
  currentExtra: ScenarioExtraSettings;
}

export function InputAssist({
  open,
  onClose,
  onApply,
  currentInputs,
  currentExtra,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!open) return null;

  const apply = () => {
    const p = PRESETS.find((x) => x.id === selected);
    if (!p) return;
    // 既存値はベースとして残し、プリセットの値で上書き
    const nextInputs: SliderInputs = { ...currentInputs, ...p.inputs } as SliderInputs;
    const nextExtra: ScenarioExtraSettings = { ...currentExtra, ...p.extra };
    onApply(nextInputs, nextExtra);
    onClose();
    setSelected(null);
  };

  return (
    <div className="assist-back" onClick={onClose}>
      <div className="assist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="assist-header">
          <h3>💡 入力サポート</h3>
          <button className="assist-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="muted small">
          あなたの状況に近いプリセットを選ぶと、年齢・収入・住宅・支出・子供などの一般的な目安値を自動入力します。後から各スライダーで微調整できます。
        </p>

        <div className="assist-presets">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={'assist-preset ' + (selected === p.id ? 'active' : '')}
              onClick={() => setSelected(p.id)}
            >
              <span className="assist-emoji">{p.emoji}</span>
              <span className="assist-label">{p.label}</span>
              <span className="assist-desc">{p.description}</span>
            </button>
          ))}
        </div>

        <div className="assist-warning muted small">
          ⚠️ 適用すると、現在の入力値が一部上書きされます（保存していない場合はやり直しできません）。
        </div>

        <div className="assist-actions">
          <button className="secondary" onClick={onClose}>
            キャンセル
          </button>
          <button className="primary" onClick={apply} disabled={!selected}>
            このプリセットを適用
          </button>
        </div>
      </div>
    </div>
  );
}
