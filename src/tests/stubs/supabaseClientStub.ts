/**
 * A minimal in-memory double for the exact Supabase query-builder call
 * shapes used by dealRepository.ts, settingsRepository.ts, and
 * contractRepository.ts — not a general-purpose supabase-js mock. Each
 * `.from(table)` chain returns a thenable (so `await` works the same way
 * it does on a real PostgrestBuilder) for the read/delete paths, and
 * insert/upsert/update return an object exposing `.select().single()`
 * matching how the repositories call them.
 *
 * For `contracts` specifically, insert/update simulate the real RLS
 * policy's deal-ownership subquery (see supabase/migrations/0002_contracts.sql)
 * by checking the `deals` table's own rows — this is what makes the
 * "can't attach a contract to someone else's deal" tests meaningful without
 * a live Postgres instance.
 */
type Row = Record<string, unknown>;
type Result<T> = { data: T; error: Error | null };

export type MockFailure = { table: string; op: "select" | "insert" | "upsert" | "update" | "delete" };

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;

const RLS_DENIED = new Error("new row violates row-level security policy");

export function createMockSupabaseClient(options: { session?: { user: { id: string } } | null; failures?: MockFailure[] } = {}) {
  const tables = new Map<string, Row[]>();
  const failures = options.failures ?? [];
  let session = options.session ?? null;

  function table(name: string): Row[] {
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name)!;
  }

  function fails(name: string, op: MockFailure["op"]): boolean {
    return failures.some((f) => f.table === name && f.op === op);
  }

  /** Mirrors "insert own contracts"/"update own contracts": the acting
   * user must own both the contract row itself and the deal it points at. */
  function contractRlsAllows(row: Row): boolean {
    if (!session) return false;
    if (row.user_id !== session.user.id) return false;
    const deals = table("deals");
    const deal = deals.find((d) => d.id === row.deal_id);
    return !!deal && deal.user_id === session.user.id;
  }

  return {
    __tables: tables,
    __setSession(next: { user: { id: string } } | null) {
      session = next;
    },
    auth: {
      async getSession() {
        return { data: { session }, error: null };
      },
    },
    from(name: string) {
      let eqFilter: [string, unknown] | null = null;

      const readBuilder = {
        select() {
          return readBuilder;
        },
        eq(col: string, val: unknown) {
          eqFilter = [col, val];
          return readBuilder;
        },
        order(col: string, opts?: { ascending?: boolean }) {
          const ascending = opts?.ascending ?? true;
          return awaitableList(col, ascending);
        },
        async maybeSingle(): Promise<Result<Row | null>> {
          if (fails(name, "select")) return { data: null, error: new Error(`mock select failure on ${name}`) };
          const rows = table(name);
          const match = eqFilter ? rows.find((r) => r[eqFilter![0]] === eqFilter![1]) : (rows[0] ?? null);
          return { data: match ?? null, error: null };
        },
      };

      function awaitableList(orderCol: string, ascending: boolean) {
        return {
          then<TResult>(onfulfilled: (value: Result<Row[]>) => TResult) {
            if (fails(name, "select")) return onfulfilled({ data: [], error: new Error(`mock select failure on ${name}`) });
            let rows = table(name);
            if (eqFilter) rows = rows.filter((r) => r[eqFilter![0]] === eqFilter![1]);
            rows = [...rows].sort((a, b) => {
              const av = String(a[orderCol]);
              const bv = String(b[orderCol]);
              return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
            });
            return onfulfilled({ data: rows, error: null });
          },
        };
      }

      const idKey = name === "user_settings" ? "user_id" : "id";

      return {
        select: readBuilder.select,
        insert(row: Row) {
          return {
            select() {
              return this;
            },
            async single(): Promise<Result<Row | null>> {
              if (fails(name, "insert")) return { data: null, error: new Error(`mock insert failure on ${name}`) };
              if (name === "contracts" && !contractRlsAllows(row)) return { data: null, error: RLS_DENIED };
              const now = new Date().toISOString();
              const id = (row.id as string | undefined) ?? crypto.randomUUID();
              const inserted: Row = { created_at: now, updated_at: now, ...row, id };
              table(name).push(inserted);
              return { data: inserted, error: null };
            },
          };
        },
        upsert(row: Row) {
          return {
            select() {
              return this;
            },
            async single(): Promise<Result<Row | null>> {
              if (fails(name, "upsert")) return { data: null, error: new Error(`mock upsert failure on ${name}`) };
              const rows = table(name);
              const idx = rows.findIndex((r) => r[idKey] === row[idKey]);
              const now = new Date().toISOString();
              const merged: Row = idx >= 0 ? { ...rows[idx], ...row, updated_at: now } : { created_at: now, updated_at: now, ...row };
              if (idx >= 0) rows[idx] = merged;
              else rows.push(merged);
              return { data: merged, error: null };
            },
          };
        },
        update(patch: Row) {
          let filterCol: string | null = null;
          let filterVal: unknown;
          const builder = {
            eq(col: string, val: unknown) {
              filterCol = col;
              filterVal = val;
              return builder;
            },
            select() {
              return builder;
            },
            async single(): Promise<Result<Row | null>> {
              if (fails(name, "update")) return { data: null, error: new Error(`mock update failure on ${name}`) };
              const rows = table(name);
              const idx = filterCol ? rows.findIndex((r) => r[filterCol!] === filterVal) : -1;
              if (idx < 0) return { data: null, error: new Error("no matching row") };
              const merged: Row = { ...rows[idx], ...patch, updated_at: new Date().toISOString() };
              if (name === "contracts" && !contractRlsAllows(merged)) return { data: null, error: RLS_DENIED };
              rows[idx] = merged;
              return { data: merged, error: null };
            },
          };
          return builder;
        },
        delete() {
          return {
            async eq(col: string, val: unknown): Promise<Result<null>> {
              if (fails(name, "delete")) return { data: null, error: new Error(`mock delete failure on ${name}`) };
              const rows = table(name);
              const idx = rows.findIndex((r) => r[col] === val);
              if (idx >= 0) rows.splice(idx, 1);
              return { data: null, error: null };
            },
          };
        },
      };
    },
  };
}
