/**
 * Remembers which Property Workspace section (Deal Analysis, ARV &
 * Comparables, etc.) was last open for a given deal, keyed by deal id, so
 * returning to a saved deal reopens where the user left off instead of
 * always resetting to the default. Purely view state — never touches deal
 * data, never synced to Supabase, safe to lose (falls back to the default
 * section) if storage is unavailable or corrupted.
 */

const KEY_PREFIX = "realoffer_workspace_section_";

const WORKSPACE_SECTION_KEYS = ["dealAnalysis", "arvComparables", "repairEstimate", "propertyDetails", "risks", "contract"] as const;

export type WorkspaceSectionKey = (typeof WORKSPACE_SECTION_KEYS)[number];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isWorkspaceSectionKey(value: unknown): value is WorkspaceSectionKey {
  return typeof value === "string" && (WORKSPACE_SECTION_KEYS as readonly string[]).includes(value);
}

/** Returns `null` (never a fabricated default) when nothing is stored, the
 * value doesn't match a known section, or storage can't be read at all. */
export function getStoredWorkspaceSection(dealId: string): WorkspaceSectionKey | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(`${KEY_PREFIX}${dealId}`);
    return isWorkspaceSectionKey(raw) ? raw : null;
  } catch {
    return null;
  }
}

/** Best-effort — a failed write (quota exceeded, private browsing) just
 * means the preference isn't remembered next time, never a thrown error
 * that could interrupt switching sections. */
export function saveWorkspaceSection(dealId: string, key: WorkspaceSectionKey): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(`${KEY_PREFIX}${dealId}`, key);
  } catch {
    // Ignored — see doc comment above.
  }
}
