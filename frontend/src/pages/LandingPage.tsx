import { useState } from 'react';

interface Props {
  onProceedToLogin: () => void;
}

export function LandingPage({ onProceedToLogin }: Props) {
  const [agreed, setAgreed] = useState(false);

  const handleProceed = () => {
    if (!agreed) return;
    onProceedToLogin();
  };

  return (
    <div className="landing-wrap">
      <header className="landing-hero">
        <h1 className="landing-title">🏠 賃貸 vs 購入 30秒比較</h1>
        <p className="landing-sub">
          内見中にスマホで開いて、家賃と物件価格を入力するだけ。
          ログイン不要でその場で比較できます。
        </p>
      </header>

      <section className="landing-tool">
        <div className="landing-tool-actions">
          <a
            href="/rent-vs-buy.html"
            target="_blank"
            rel="noopener"
            className="open-link"
          >
            別タブで開く ↗
          </a>
        </div>
        <iframe
          src="/rent-vs-buy.html"
          className="landing-iframe"
          title="賃貸 vs 購入 比較ツール"
        />
      </section>

      <section className="landing-cta">
        <div className="landing-cta-inner">
          <h2>もっと詳しくシミュレーションしませんか？</h2>
          <p className="muted">
            40年先までの資産推移・キャッシュフロー・住宅ローン残高を一括で確認。
            退職金・物価上昇率・賃貸継続・教育費まで反映できる本格ライフプランツール。
          </p>

          <details className="privacy-details">
            <summary>📜 プライバシーポリシーを開く</summary>
            <div className="privacy-body">
              <h3>プライバシーポリシー</h3>
              <p className="privacy-updated">最終更新日: 2026年5月</p>

              <h4>1. 取得する情報</h4>
              <p>
                本サービス「ライフプラン・シミュレーター」（以下「本サービス」）では、サインイン時にメールアドレス・OAuth プロバイダ（Google / GitHub）から提供される基本プロフィール情報を取得します。シミュレーションのために入力いただいた年齢・年収・住宅価格・家族構成・支出・貯蓄・投資額などの数値情報（以下「ライフプラン情報」）はサーバ上に保管されます。
              </p>

              <h4>2. 利用目的</h4>
              <p>
                取得した情報は (a) シミュレーション結果の表示・保存、(b) シナリオの複数管理、(c) サービスの不具合調査・改善、(d) 管理者による利用状況の把握、にのみ利用します。第三者への販売・広告利用は行いません。
              </p>

              <h4>3. データの保管と削除</h4>
              <p>
                ライフプラン情報は Supabase（PostgreSQL）上に暗号化通信を介して保管され、Row Level Security により本人および管理者のみアクセス可能です。アカウント削除をご希望の際は管理者へご依頼ください。原則として削除依頼から 30 日以内に該当データを物理削除します。
              </p>

              <h4>4. 第三者提供・外部送信</h4>
              <p>
                法令に基づく開示要請を除き、本人の同意なくライフプラン情報を第三者に提供することはありません。なお Google / GitHub OAuth を利用される場合、それぞれのプライバシーポリシーに従って認証情報が送信されます。
              </p>

              <h4>5. Cookie・ローカルストレージ</h4>
              <p>
                セッション維持のため Supabase 認証クッキー・LocalStorage を使用します。賃貸 vs 購入 30秒比較ツールでは入力値の利便性のためブラウザの LocalStorage に値を保存します。これらは本人のブラウザ内のみに保持されます。
              </p>

              <h4>6. 免責</h4>
              <p>
                本サービスは簡易計算ツールであり、将来の経済情勢・税制・金利・物価変動を完全に予測するものではありません。シミュレーション結果は意思決定の参考情報としてご利用いただき、重要な意思決定には FP・税理士等の専門家にご相談ください。
              </p>

              <h4>7. お問い合わせ</h4>
              <p>
                本ポリシーに関するお問い合わせは管理者（rsorf9@gmail.com）までご連絡ください。
              </p>
            </div>
          </details>

          <label className="privacy-agree">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>プライバシーポリシーを確認し、同意します</span>
          </label>

          <button
            className="landing-cta-btn"
            onClick={handleProceed}
            disabled={!agreed}
            title={!agreed ? 'プライバシーポリシーに同意してください' : undefined}
          >
            詳しくライフプランを作成してみる →
          </button>

          <p className="muted small">
            ※ ログインが必要です。アカウント発行は管理者にご依頼ください。
          </p>
        </div>
      </section>

      <footer className="landing-foot muted small">
        ※ 簡易計算ツールです。詳細なご相談は FP までお問い合わせください。
      </footer>
    </div>
  );
}
