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
}

export function DynamicSlider({ def, value, onChange }: Props) {
  const handle = (e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value));
  const display =
    def.valueType === 'integer' ? Math.round(value).toLocaleString() : value.toFixed(2);
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
        max={def.max}
        step={def.step}
        value={value}
        onChange={handle}
      />
    </div>
  );
}
