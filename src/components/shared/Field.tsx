import { type ReactNode } from "react";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function Field({ label, htmlFor, error, hint, required, children, className = "" }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-white/80 mb-1.5">
        {label}
        {required ? <span className="text-accent-3"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClasses =
  "w-full h-11 rounded-lg border border-border bg-surface px-3.5 text-[15px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/20";

export const selectClasses = inputClasses + " appearance-none";

export const textareaClasses =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[15px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/20";
