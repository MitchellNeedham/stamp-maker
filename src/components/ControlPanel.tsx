import type { StampParams } from '../types';

interface ControlPanelProps {
  params: StampParams;
  onChange: (params: StampParams) => void;
}

interface SliderConfig {
  key: keyof Pick<
    StampParams,
    | 'levels'
    | 'maxHeight'
    | 'baseThickness'
    | 'width'
    | 'smoothing'
    | 'contrast'
    | 'edgeRounding'
  >;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

const SLIDERS: SliderConfig[] = [
  { key: 'levels', label: 'Levels', min: 2, max: 12, step: 1 },
  { key: 'maxHeight', label: 'Relief height', min: 0.5, max: 15, step: 0.5, unit: 'mm' },
  { key: 'baseThickness', label: 'Base thickness', min: 0.5, max: 10, step: 0.5, unit: 'mm' },
  { key: 'width', label: 'Model width', min: 10, max: 150, step: 1, unit: 'mm' },
  { key: 'smoothing', label: 'Smoothing', min: 0, max: 10, step: 1 },
  { key: 'contrast', label: 'Contrast', min: -10, max: 10, step: 1 },
  { key: 'edgeRounding', label: 'Edge rounding', min: 0, max: 3, step: 0.1, unit: 'mm' },
];

export default function ControlPanel({ params, onChange }: ControlPanelProps) {
  const set = <K extends keyof StampParams>(key: K, value: StampParams[K]) =>
    onChange({ ...params, [key]: value });

  return (
    <div className="control-panel">
      {SLIDERS.map(({ key, label, min, max, step, unit }) => (
        <label key={key} className="control-row">
          <span>
            {label}: {params[key]}
            {unit}
          </span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={params[key]}
            onChange={(e) => set(key, Number(e.target.value))}
          />
        </label>
      ))}

      <label className="control-row control-row-checkbox">
        <input
          type="checkbox"
          checked={params.invert}
          onChange={(e) => set('invert', e.target.checked)}
        />
        <span>Invert (light areas raised)</span>
      </label>

      <label className="control-row control-row-checkbox">
        <input
          type="checkbox"
          checked={params.mirror}
          onChange={(e) => set('mirror', e.target.checked)}
        />
        <span>Mirror (for pressing as a stamp)</span>
      </label>
    </div>
  );
}
