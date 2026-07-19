import {
  GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
  GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
  GENERAL_TEMPLATE_DISCLAIMER,
  GENERAL_TEMPLATE_LABEL,
} from "@/lib/contracts/templates/generalPurchaseAgreement";

export type ContractTemplateMeta = {
  templateId: string;
  templateVersion: string;
  label: string;
  /** "general" = not tied to any state's specific legal requirements.
   * A future attorney-reviewed template would set this to a state code. */
  jurisdictionScope: "general" | string;
  disclaimer: string;
};

/**
 * The template registry. To add a state-specific template later: create a
 * sibling module (e.g. templates/texasPurchaseAgreement.ts) exporting the
 * same shape as generalPurchaseAgreement.ts with its own templateId and an
 * attorney-reviewed disclaimer, then add one entry here. Existing contracts
 * are unaffected — they keep referencing whichever templateId/version they
 * were created with.
 */
export const CONTRACT_TEMPLATES: Record<string, ContractTemplateMeta> = {
  [GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID]: {
    templateId: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID,
    templateVersion: GENERAL_PURCHASE_AGREEMENT_TEMPLATE_VERSION,
    label: GENERAL_TEMPLATE_LABEL,
    jurisdictionScope: "general",
    disclaimer: GENERAL_TEMPLATE_DISCLAIMER,
  },
};

export const DEFAULT_TEMPLATE_ID = GENERAL_PURCHASE_AGREEMENT_TEMPLATE_ID;

export function getTemplateMeta(templateId: string): ContractTemplateMeta | null {
  return CONTRACT_TEMPLATES[templateId] ?? null;
}

/** Every template today is "general" — no verified state-specific template
 * exists, so any state selection still needs the local-review disclaimer. */
export function requiresLocalReviewDisclaimer(templateId: string): boolean {
  const meta = getTemplateMeta(templateId);
  return !meta || meta.jurisdictionScope === "general";
}
