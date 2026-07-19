"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounced autosave: calls `save(value)` `delayMs` after the last change,
 * coalescing rapid edits into a single write (and re-running once more if
 * an edit lands while a save is already in flight, rather than dropping
 * it). Tracks saving/saved/error state for UI feedback, and exposes
 * `hasUnsavedChanges` for a beforeunload guard.
 *
 * `enabled: false` (e.g. before the initial fetch resolves) suppresses
 * autosave entirely so it never fires on stale/default data.
 */
export function useAutosave<T>(value: T, save: (value: T) => Promise<unknown>, options?: { delayMs?: number; enabled?: boolean }) {
  const delayMs = options?.delayMs ?? 900;
  const enabled = options?.enabled ?? true;

  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  // The last successfully-saved value, as JSON — state (not a ref) because
  // it's read during render (hasUnsavedChanges) and refs can't be read or
  // written during render.
  const [lastSavedJson, setLastSavedJson] = useState(() => JSON.stringify(value));

  // Kept in sync via an effect (not during render) so runSave always closes
  // over the latest value without needing `value` in its own deps.
  const latestValue = useRef(value);
  useEffect(() => {
    latestValue.current = value;
  });

  const savingRef = useRef(false);
  const dirtyDuringSaveRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const currentJson = JSON.stringify(value);
  const hasUnsavedChanges = currentJson !== lastSavedJson;

  // A while-loop rather than "save, then recursively call runSave() again
  // if dirty" — a self-referencing useCallback confuses React Compiler's
  // memoization analysis (it can't preserve identity for a function that
  // calls itself), and a loop expresses "keep saving until nothing changed
  // during the last save" just as directly without the self-reference.
  const runSave = useCallback(async () => {
    if (savingRef.current) {
      dirtyDuringSaveRef.current = true;
      return;
    }
    savingRef.current = true;
    let runAgain = true;
    while (runAgain) {
      runAgain = false;
      if (mountedRef.current) {
        setStatus("saving");
        setError(null);
      }
      const toSaveJson = JSON.stringify(latestValue.current);
      try {
        await save(latestValue.current);
        setLastSavedJson(toSaveJson);
        if (mountedRef.current) setStatus("saved");
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Couldn't save your changes.");
          setStatus("error");
        }
      }
      if (dirtyDuringSaveRef.current) {
        dirtyDuringSaveRef.current = false;
        runAgain = true;
      }
    }
    savingRef.current = false;
  }, [save]);

  useEffect(() => {
    if (!enabled) return;
    if (currentJson === lastSavedJson) return;
    const timer = setTimeout(() => {
      void runSave();
    }, delayMs);
    return () => clearTimeout(timer);
  }, [currentJson, enabled, delayMs, runSave, lastSavedJson]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  /** Forces an immediate save, bypassing the debounce — used before
   * navigating away via an in-app link/button rather than a hard reload. */
  const saveNow = useCallback(async () => {
    if (currentJson === lastSavedJson) return;
    await runSave();
  }, [currentJson, lastSavedJson, runSave]);

  return { status, error, hasUnsavedChanges, saveNow };
}
