import { useState } from 'react';

interface TutorialStep {
  title: string;
  body: string;
  tip?: string;
}

const STEPS: TutorialStep[] = [
  {
    title: '1. ようこそ！',
    body:
      'ライフプラン・シミュレーターは、40年先までの家計を「年齢・収入・支出・住宅・家族構成」から自動計算するツールです。3分で初回入力 → 5分で全グラフ確認できます。',
    tip: '操作に迷ったら、いつでも右上の「📖 チュートリアル」ボタンから再表示できます。',
  },
  {
    title: '2. 入力タブの使い方',
    body:
      '左側に「基本 / 収入 / 住宅 / 支出 / 貯蓄 / 投資 / 家族」のタブがあります。各タブのスライダーをドラッグするだけで、右側のグラフがリアルタイムに更新されます。',
    tip: '入力が分からない場合は、右上の「💡 入力サポート」から家族構成プリセットで一括入力もできます。',
  },
  {
    title: '3. 基本タブ',
    body:
      '「現在の年齢」「退職予定年齢」を設定します。配偶者ありにチェックを入れると、配偶者の年齢・退職年齢を別途設定できます。',
    tip: '65歳以降は本人・配偶者ともに公的年金（平均月14.5万円）を自動加算します。',
  },
  {
    title: '4. 収入タブ',
    body:
      '「手取り年収」（社会保険料・税金控除後）を入力。額面しか分からない場合は 額面 × 0.78〜0.82 が目安です。「退職金あり」にチェックを入れると一時金スライダーも表示されます。',
  },
  {
    title: '5. 住宅タブ',
    body:
      '「賃貸継続」にチェックすると家賃のみの想定。チェックなしの場合は購入想定で、購入年齢・物件価格・頭金・金利・返済年数を設定。購入年齢が現在年齢より前なら過去購入として残債を自動計算します。',
    tip: '一般に住宅予算は手取り年収 × 5〜7 倍が無理のないレンジと言われます。',
  },
  {
    title: '6. 支出タブ',
    body:
      '「月々の支出」と「年間の特別支出」を入力。物価上昇率反映にチェックを入れると、毎年の生活費・教育費を複利で増加させます（日銀目標 2%）。',
  },
  {
    title: '7. 貯蓄・投資タブ',
    body:
      '収入と支出の差額はすべて預貯金に積み上がり、そこから「毎月の投資額」で投資に振り替えます。現在の貯蓄・投資・運用利回りを設定するだけで、複利成長を自動シミュレーションします。',
  },
  {
    title: '8. 家族タブ',
    body:
      '子供を追加して、現在の年齢と進路（公立／私立／混合）を選択。教育費は文部科学省「子供の学習費調査」を参考に自動計算されます。年齢にマイナス値を入れると未来の出生も想定可能です。',
  },
  {
    title: '9. グラフを確認',
    body:
      '右側のタブで「資産推移 / キャッシュフロー / 住宅ローン」をグラフと表で切り替え確認できます。表モードでは年度ごとの詳細数値も見られます。',
  },
  {
    title: '10. 保存・印刷',
    body:
      '右上の「保存」ボタンでクラウドに自動保存。「印刷」ボタンで A4 横向き・表紙付きの PDF を出力できます。複数シナリオを比較してご活用ください。',
    tip: 'お疲れ様でした！「閉じる」を押して入力を始めましょう。',
  },
];

const STORAGE_KEY = 'lps_tutorial_seen_v1';

export function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTutorialSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* noop */
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Tutorial({ open, onClose }: Props) {
  const [step, setStep] = useState(0);

  if (!open) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const close = () => {
    markTutorialSeen();
    setStep(0);
    onClose();
  };

  return (
    <div className="tutorial-back" onClick={close}>
      <div className="tutorial-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tutorial-header">
          <span className="tutorial-progress">
            {step + 1} / {STEPS.length}
          </span>
          <button className="tutorial-close" onClick={close}>
            ✕
          </button>
        </div>

        <div className="tutorial-body">
          <h3>{s.title}</h3>
          <p>{s.body}</p>
          {s.tip && <p className="tutorial-tip">💡 {s.tip}</p>}
        </div>

        <div className="tutorial-progress-bar">
          <div
            className="tutorial-progress-fill"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="tutorial-actions">
          <button
            className="secondary"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={isFirst}
          >
            ← 戻る
          </button>
          {isLast ? (
            <button className="primary" onClick={close}>
              閉じる
            </button>
          ) : (
            <button className="primary" onClick={() => setStep(step + 1)}>
              次へ →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
