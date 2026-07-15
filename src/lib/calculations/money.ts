/**
 * All currency math in this app is done in integer cents to avoid
 * floating-point rounding errors. Dollars are only used at the UI edges.
 */

/** Shared ceiling between input clamping (UI) and engine validation. */
export const MAX_REASONABLE_CENTS = 1_000_000_000_00; // $1B
export const MAX_REASONABLE_DOLLARS = MAX_REASONABLE_CENTS / 100;
export const MAX_REASONABLE_PERCENTAGE = 2; // 200%, as a fraction

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Clamps a raw dollar input (from a number field) to a safe, finite, non-negative range. */
export function clampReasonableDollars(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, MAX_REASONABLE_DOLLARS);
}

/**
 * A tighter cap for rate-like inputs (e.g. $/sqft) that get multiplied by
 * another large number before validation — clamping only the rate to
 * MAX_REASONABLE_DOLLARS would still let the product overflow.
 */
export const MAX_REASONABLE_RATE_PER_SQFT_DOLLARS = 10_000;

export function clampReasonableRatePerSqft(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, MAX_REASONABLE_RATE_PER_SQFT_DOLLARS);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatCents(cents: number, options?: { showCents?: boolean }): string {
  const dollars = centsToDollars(cents);
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: options?.showCents ? 2 : 0,
    maximumFractionDigits: options?.showCents ? 2 : 0,
  });
}

export function formatPercent(fraction: number, fractionDigits = 1): string {
  return `${(fraction * 100).toFixed(fractionDigits)}%`;
}

export function clampNonNegativeCents(cents: number): number {
  return Number.isFinite(cents) && cents > 0 ? Math.round(cents) : 0;
}
