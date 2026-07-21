"use client";

import { AlertTriangle, Info, FileDown } from "lucide-react";
import { formatCents } from "@/lib/calculations/money";
import type { ContractFormData, PartyInfo } from "@/lib/contracts/types";
import type { ContractStatus } from "@/lib/contracts/types";

function dash(value: string | null | undefined): string {
  return value && value.trim() ? value : "—";
}

function partyLine(party: PartyInfo): string {
  const parts = [party.legalName, party.entityName ? `(${party.entityName})` : null].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "—";
}

type ReviewStepProps = {
  formData: ContractFormData;
  contractId: string;
  contractStatus: ContractStatus;
  issues: string[];
  warnings: string[];
  templateLabel: string;
  templateVersion: string;
};

export function ReviewStep({ formData, contractId, contractStatus, issues, warnings, templateLabel, templateVersion }: ReviewStepProps) {
  const canExport = issues.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Review</h2>
        <p className="text-xs text-muted">
          {templateLabel} · v{templateVersion}
        </p>
      </div>

      {issues.length > 0 ? (
        <div className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3.5 text-sm text-red-200">
          <p className="flex items-center gap-2 font-medium mb-2">
            <AlertTriangle className="h-4 w-4" />
            Fix these before marking this contract Ready for Review or downloading a PDF
          </p>
          <ul className="flex flex-col gap-1 text-xs list-disc pl-5">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3.5 text-sm text-amber-100">
          <p className="flex items-center gap-2 font-medium mb-2">
            <Info className="h-4 w-4" />
            Worth double-checking
          </p>
          <ul className="flex flex-col gap-1 text-xs list-disc pl-5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-surface-2 p-5 flex flex-col gap-5 text-sm text-white/85">
        <ReviewSection title="Property">
          <ReviewRow label="Address" value={`${dash(formData.property.addressLine1)}, ${dash(formData.property.city)}, ${dash(formData.property.state)} ${dash(formData.property.zip)}`} />
          <ReviewRow label="County" value={dash(formData.property.county)} />
          <ReviewRow label="Parcel #" value={dash(formData.property.parcelNumber)} />
          <ReviewRow label="Property type" value={dash(formData.property.propertyType)} />
          <ReviewRow label="Bedrooms" value={dash(formData.property.bedrooms !== null ? String(formData.property.bedrooms) : null)} />
          <ReviewRow label="Bathrooms" value={dash(formData.property.bathrooms !== null ? String(formData.property.bathrooms) : null)} />
          <ReviewRow label="Legal description" value={dash(formData.property.legalDescription)} />
        </ReviewSection>

        <ReviewSection title="Parties">
          <ReviewRow label="Buyer" value={partyLine(formData.buyer)} />
          {formData.additionalBuyers.map((p, i) => (
            <ReviewRow key={i} label={`Additional buyer ${i + 1}`} value={partyLine(p)} />
          ))}
          <ReviewRow label="Seller" value={partyLine(formData.seller)} />
          {formData.additionalSellers.map((p, i) => (
            <ReviewRow key={i} label={`Additional seller ${i + 1}`} value={partyLine(p)} />
          ))}
        </ReviewSection>

        <ReviewSection title="Purchase Terms">
          <ReviewRow label="Purchase price" value={formData.purchaseTerms.purchasePriceCents !== null ? formatCents(formData.purchaseTerms.purchasePriceCents) : "—"} />
          <ReviewRow label="Earnest money" value={formData.purchaseTerms.earnestMoneyCents !== null ? formatCents(formData.purchaseTerms.earnestMoneyCents) : "—"} />
          <ReviewRow label="Financing" value={dash(formData.purchaseTerms.financingType)} />
          <ReviewRow label="Closing date" value={dash(formData.purchaseTerms.closingDate)} />
          <ReviewRow label="Contingencies" value={[formData.purchaseTerms.financingContingency && "Financing", formData.purchaseTerms.appraisalContingency && "Appraisal"].filter(Boolean).join(", ") || "None"} />
        </ReviewSection>

        <ReviewSection title="Due Diligence">
          <ReviewRow label="Inspection period" value={formData.dueDiligence.inspectionPeriodDays !== null ? `${formData.dueDiligence.inspectionPeriodDays} days` : "—"} />
          <ReviewRow label="Inspection deadline" value={dash(formData.dueDiligence.inspectionDeadline)} />
          <ReviewRow label="Property condition" value={dash(formData.dueDiligence.propertyCondition)} />
        </ReviewSection>

        {formData.assignment ? (
          <ReviewSection title="Wholesaling and Assignment">
            <ReviewRow label="Assignment clause included" value={formData.assignment.includeAssignmentClause ? "Yes" : "No"} />
            <ReviewRow
              label="Assignable"
              value={formData.assignment.assignable === null ? "Not selected" : formData.assignment.assignable ? "Assignable" : "Non-assignable"}
            />
          </ReviewSection>
        ) : null}

        <ReviewSection title="Additional Terms">
          <ReviewRow label="Special stipulations" value={dash(formData.additionalTerms.specialStipulations)} />
          <ReviewRow label="Other terms" value={dash(formData.additionalTerms.otherTerms)} />
        </ReviewSection>
      </div>

      <div className="flex items-center gap-3">
        <a
          href={canExport ? `/api/contracts/${contractId}/pdf` : undefined}
          aria-disabled={!canExport}
          onClick={(e) => {
            if (!canExport) e.preventDefault();
          }}
          className={`inline-flex items-center gap-2 h-10 rounded-full px-5 text-sm font-medium transition-all duration-150 ${
            canExport ? "bg-white text-black hover:bg-white/90 active:scale-[0.98]" : "bg-white/10 text-white/40 cursor-not-allowed"
          }`}
        >
          <FileDown className="h-4 w-4" />
          Download PDF
        </a>
        {!canExport ? <span className="text-xs text-muted">Resolve the issues above to enable PDF export.</span> : null}
        {contractStatus === "exported" ? <span className="text-xs text-emerald-400">Previously exported</span> : null}
      </div>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted mb-2">{title}</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">{children}</dl>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm text-white/85 break-words">{value}</dd>
    </div>
  );
}
