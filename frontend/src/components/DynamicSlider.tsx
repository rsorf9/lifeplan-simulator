import type { ChangeEvent } from 'react';

export interface SliderDef {
  key: string;
  label: string;
  group: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  tooltip?: string;
  valueType: 'integer' | 'float';
}

interface Props {
  def: SliderDef;
  value: number;
  onChange: (v: number) => void;
  /** Optional dynamic max (e.g., based on cashflow allocation) */
  maxOverride?: number;
  /** Optional helper text under the slider */
  helper?: string;
}

export function DynamicSlider({ def, value, onChange, maxOverride, helper }: Props) {
  const effectiveMax =
    typeof maxOverride === 'number' && maxOverride < def.max ? Math.max(def.min, maxOverride) : def.max;
  const clamped = Math.min(value, effectiveMax);
  const handle = (e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value));
  const display =
    def.valueType === 'integer' ? Math.round(clamped).toLocaleString() : clamped.toFixed(2);
  return (
    <div className="slider-row" title={def.tooltip ?? ''}>
      <div className="slider-label">
        <span>{def.label}</span>
        <span className="slider-value">
          {display} {def.unit}
        </span>
      </div>
      <input
        type="range"
        min={def.min}
        max={effectiveMax}
        step={def.step}
        value={clamped}
        onChange={handle}
      />
      {helper && <p className="slider-helper">{helper}</p>}
    </div>
  );
}
