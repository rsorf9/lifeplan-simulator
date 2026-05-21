interface Props {
  onProceedToLogin: () => void;
}

export function LandingPage({ onProceedToLogin }: Props) {
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
          <button className="landing-cta-btn" onClick={onProceedToLogin}>
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
