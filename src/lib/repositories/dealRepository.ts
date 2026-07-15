import type { Deal, DealPipelineStatus } from "@/types/deal";

export type DealSortField = "date" | "arv" | "assignmentFee" | "profit";
export type SortDirection = "asc" | "desc";

export interface DealRepository {
  list(): Deal[];
  get(id: string): Deal | null;
  save(deal: Deal): Deal;
  delete(id: string): void;
  duplicate(id: string): Deal | null;
  search(deals: Deal[], query: string): Deal[];
  filterByStatus(deals: Deal[], status: DealPipelineStatus | "all"): Deal[];
  sort(deals: Deal[], by: DealSortField, direction: SortDirection): Deal[];
}

const STORAGE_KEY = "realoffer_demo_deals_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

type Listener = () => void;
let listeners: Listener[] = [];

function emitChange(): void {
  for (const listener of listeners) listener();
}

/** Subscribe to deal-store changes (same-tab writes and cross-tab storage events). */
export function subscribeToDeals(onChange: Listener): () => void {
  listeners = [...listeners, onChange];
  window.addEventListener("storage", onChange);
  return () => {
    listeners = listeners.filter((l) => l !== onChange);
    window.removeEventListener("storage", onChange);
  };
}

let cachedRaw: string | null = null;
let cachedDeals: Deal[] = [];

/** Stable-reference snapshot for useSyncExternalStore — only reparses when the underlying JSON changes. */
export function getDealsSnapshot(): Deal[] {
  if (!isBrowser()) return cachedDeals;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedDeals;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedDeals = Array.isArray(parsed) ? (parsed as Deal[]) : [];
  } catch {
    cachedDeals = [];
  }
  return cachedDeals;
}

export function getServerDealsSnapshot(): Deal[] {
  return [];
}

function readAll(): Deal[] {
  return getDealsSnapshot();
}

function writeAll(deals: Deal[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  emitChange();
}

export class LocalStorageDealRepository implements DealRepository {
  list(): Deal[] {
    return [...readAll()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  get(id: string): Deal | null {
    return readAll().find((d) => d.id === id) ?? null;
  }

  save(deal: Deal): Deal {
    const all = [...readAll()];
    const index = all.findIndex((d) => d.id === deal.id);
    const now = new Date().toISOString();
    const toSave: Deal = { ...deal, updatedAt: now, createdAt: deal.createdAt ?? now };

    if (index >= 0) {
      all[index] = toSave;
    } else {
      all.push(toSave);
    }
    writeAll(all);
    return toSave;
  }

  delete(id: string): void {
    const all = readAll().filter((d) => d.id !== id);
    writeAll(all);
  }

  duplicate(id: string): Deal | null {
    const original = this.get(id);
    if (!original) return null;

    const now = new Date().toISOString();
    const copy: Deal = {
      ...original,
      id: crypto.randomUUID(),
      status: "draft",
      createdAt: now,
      updatedAt: now,
      notes: original.notes,
      property: { ...original.property, address: { ...original.property.address } },
    };
    return this.save(copy);
  }

  search(deals: Deal[], query: string): Deal[] {
    const q = query.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter((d) => d.property.address.formatted.toLowerCase().includes(q) || d.notes.toLowerCase().includes(q));
  }

  filterByStatus(deals: Deal[], status: DealPipelineStatus | "all"): Deal[] {
    if (status === "all") return deals;
    return deals.filter((d) => d.status === status);
  }

  sort(deals: Deal[], by: DealSortField, direction: SortDirection): Deal[] {
    const factor = direction === "asc" ? 1 : -1;
    const sorted = [...deals].sort((a, b) => {
      switch (by) {
        case "date":
          return factor * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case "arv":
          return factor * (resolveArv(a) - resolveArv(b));
        case "assignmentFee":
          return factor * (a.assumptions.desiredAssignmentFeeCents - b.assumptions.desiredAssignmentFeeCents);
        case "profit":
          return factor * (a.results.projectedInvestorProfitCents - b.results.projectedInvestorProfitCents);
        default:
          return 0;
      }
    });
    return sorted;
  }
}

function resolveArv(deal: Deal): number {
  return deal.assumptions.arvOverrideCents ?? deal.property.arvExpectedCents;
}

export const dealRepository: DealRepository = new LocalStorageDealRepository();
