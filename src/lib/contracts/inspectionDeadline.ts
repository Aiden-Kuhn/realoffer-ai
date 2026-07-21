/**
 * Pure date math for the inspection deadline — kept separate from
 * DueDiligenceStep.tsx so it's unit-testable without mounting a form.
 *
 * Never guesses an effective date: the caller must supply one (in practice
 * always `contract.createdAt`, which exists for every saved contract) or
 * this returns null rather than inventing a starting point.
 */
export function calculateInspectionDeadline(effectiveDateIso: string | null, periodDays: number | null): string | null {
  if (!effectiveDateIso || periodDays === null || periodDays < 0) return null;
  const effective = new Date(effectiveDateIso);
  if (Number.isNaN(effective.getTime())) return null;
  // UTC calendar-date arithmetic, not local-time — adding N days should
  // never shift by an hour/day due to DST or the viewer's timezone.
  const deadline = new Date(Date.UTC(effective.getUTCFullYear(), effective.getUTCMonth(), effective.getUTCDate() + periodDays));
  return deadline.toISOString().slice(0, 10);
}
