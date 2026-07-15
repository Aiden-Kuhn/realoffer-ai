"use client";

import { Field, inputClasses } from "@/components/shared/Field";
import { centsToDollars, clampReasonableDollars, dollarsToCents, MAX_REASONABLE_PERCENTAGE } from "@/lib/calculations/money";

type CurrencyFieldProps = {
  id: string;
  label: string;
  valueCents: number;
  onChangeCents: (cents: number) => void;
  hint?: string;
};

export function CurrencyField({ id, label, valueCents, onChangeCents, hint }: CurrencyFieldProps) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35">$</span>
        <input
          id={id}
          type="number"
          min={0}
          step={1}
          className={`${inputClasses} pl-7`}
          value={centsToDollars(valueCents)}
          onChange={(e) => {
            onChangeCents(dollarsToCents(clampReasonableDollars(Number(e.target.value))));
          }}
        />
      </div>
    </Field>
  );
}

type PercentFieldProps = {
  id: string;
  label: string;
  valueFraction: number;
  onChangeFraction: (fraction: number) => void;
  hint?: string;
};

export function PercentField({ id, label, valueFraction, onChangeFraction, hint }: PercentFieldProps) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={0}
          max={200}
          step={0.5}
          className={`${inputClasses} pr-9`}
          value={Math.round(valueFraction * 1000) / 10}
          onChange={(e) => {
            const raw = Number(e.target.value);
            const safe = Number.isFinite(raw) ? raw : 0;
            const clampedPercent = Math.min(Math.max(safe, 0), MAX_REASONABLE_PERCENTAGE * 100);
            onChangeFraction(clampedPercent / 100);
          }}
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-white/35">%</span>
      </div>
    </Field>
  );
}
