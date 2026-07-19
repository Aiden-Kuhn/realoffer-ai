import { contractFormDataSchema } from "@/lib/contracts/schema";
import { emptyContractFormData } from "@/lib/contracts/templates/generalPurchaseAgreement";
import type { Contract, ContractFormData, ContractStatus } from "@/lib/contracts/types";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Pure row <-> domain-type mapping, with no dependency on either the
 * browser or server Supabase client — shared by contractRepository.ts
 * (browser) and the PDF route handler (server) so both apply the exact
 * same defensive parsing instead of two copies drifting apart.
 */
export type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];

const VALID_STATUSES: readonly ContractStatus[] = ["draft", "ready_for_review", "exported", "archived"];

/** Corrupted/malformed stored form data degrades to a safe empty shape
 * rather than crashing the builder, PDF export, or contracts list — same
 * defensive pattern as dealMigration.ts's investmentAnalysis handling. */
function parseFormData(raw: unknown): ContractFormData {
  const result = contractFormDataSchema.safeParse(raw);
  return result.success ? (result.data as ContractFormData) : emptyContractFormData();
}

function parseSnapshot(raw: unknown): ContractFormData | null {
  if (raw === null || raw === undefined) return null;
  const result = contractFormDataSchema.safeParse(raw);
  return result.success ? (result.data as ContractFormData) : null;
}

export function rowToContract(row: ContractRow): Contract {
  return {
    id: row.id,
    userId: row.user_id,
    dealId: row.deal_id,
    templateId: row.template_id,
    templateVersion: row.template_version,
    jurisdictionState: row.jurisdiction_state,
    status: VALID_STATUSES.includes(row.status as ContractStatus) ? (row.status as ContractStatus) : "draft",
    formData: parseFormData(row.form_data),
    documentSnapshot: parseSnapshot(row.document_snapshot),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
