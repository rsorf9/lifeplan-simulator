interface Props {
  hasSpouse: boolean;
  onChange: (v: boolean) => void;
}

export function SpouseToggle({ hasSpouse, onChange }: Props) {
  return (
    <label className="spouse-toggle">
      <input
        type="checkbox"
        checked={hasSpouse}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>配偶者あり（手取り年収を合算してシミュレーション）</span>
    </label>
  );
}
