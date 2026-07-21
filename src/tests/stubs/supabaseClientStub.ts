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
      // All .eq() calls AND together, matching real Postgrest chaining —
      // needed for tables keyed by more than one column (e.g.
      // contract_defaults' user_id + category).
      const eqFilters: Array<[string, unknown]> = [];

      const readBuilder = {
        select() {
          return readBuilder;
        },
        eq(col: string, val: unknown) {
          eqFilters.push([col, val]);
          return readBuilder;
        },
        order(col: string, opts?: { ascending?: boolean }) {
          const ascending = opts?.ascending ?? true;
          return awaitableList(col, ascending);
        },
        async maybeSingle(): Promise<Result<Row | null>> {
          if (fails(name, "select")) return { data: null, error: new Error(`mock select failure on ${name}`) };
          let rows = table(name);
          rows = applyRlsSelectFilter(rows);
          const match = eqFilters.length > 0 ? rows.find((r) => eqFilters.every(([c, v]) => r[c] === v)) : (rows[0] ?? null);
          return { data: match ?? null, error: null };
        },
      };

      // Mirrors real Postgres RLS on `deals` ("select own deals" — auth.uid()
      // = user_id): rows outside the current session are simply invisible
      // to select/list, even though application code never adds its own
      // `.eq("user_id", ...)` filter (it relies on RLS the same way the real
      // Supabase client does). Scoped to `deals` only — other tables in this
      // stub have their own ownership modeling (e.g. contractRlsAllows) or
      // don't need it for the tests that exist today.
      function applyRlsSelectFilter(rows: Row[]): Row[] {
        if (name !== "deals") return rows;
        if (!session) return [];
        return rows.filter((r) => r.user_id === session!.user.id);
      }

      function awaitableList(orderCol: string, ascending: boolean) {
        return {
          then<TResult>(onfulfilled: (value: Result<Row[]>) => TResult) {
            if (fails(name, "select")) return onfulfilled({ data: [], error: new Error(`mock select failure on ${name}`) });
            let rows = table(name);
            rows = applyRlsSelectFilter(rows);
            if (eqFilters.length > 0) rows = rows.filter((r) => eqFilters.every(([c, v]) => r[c] === v));
            rows = [...rows].sort((a, b) => {
              const av = String(a[orderCol]);
              const bv = String(b[orderCol]);
              return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
            });
            return onfulfilled({ data: rows, error: null });
          },
        };
      }

      // Which column(s) uniquely identify a row for upsert-matching
      // purposes — mirrors each table's real unique constraint. Composite
      // for contract_defaults since its constraint is (user_id, category).
      const idKeys: string[] =
        name === "user_settings" || name === "buyer_profiles" ? ["user_id"] : name === "contract_defaults" ? ["user_id", "category"] : ["id"];

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
              const idx = rows.findIndex((r) => idKeys.every((k) => r[k] === row[k]));
              const now = new Date().toISOString();
              const merged: Row =
                idx >= 0
                  ? { ...rows[idx], ...row, updated_at: now }
                  : { id: crypto.randomUUID(), created_at: now, updated_at: now, ...row };
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
          const filters: Array<[string, unknown]> = [];
          const builder = {
            eq(col: string, val: unknown) {
              filters.push([col, val]);
              return builder;
            },
            then<TResult>(onfulfilled: (value: Result<null>) => TResult) {
              if (fails(name, "delete")) return onfulfilled({ data: null, error: new Error(`mock delete failure on ${name}`) });
              const rows = table(name);
              const idx = rows.findIndex((r) => filters.every(([c, v]) => r[c] === v));
              if (idx >= 0) rows.splice(idx, 1);
              return onfulfilled({ data: null, error: null });
            },
          };
          return builder;
        },
      };
    },
  };
}
