'use client';
import { useId } from 'react';

export function NumberField({
  label,
  hint,
  value,
  onChange,
  min = 0,
  step = 'any',
  suffix,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  step?: number | 'any';
  suffix?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className="field tabular-nums"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          step={step}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        />
        {suffix ? <span className="shrink-0 text-sm text-muted">{suffix}</span> : null}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="hint mt-1">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
