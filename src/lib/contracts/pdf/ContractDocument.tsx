import "server-only";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCents } from "@/lib/calculations/money";
import type { ContractFormData, PartyInfo } from "@/lib/contracts/types";

/**
 * The document model for the general purchase agreement PDF. Every string
 * that appears here comes directly from ContractFormData or fixed template
 * labels — nothing is generated or rewritten by an AI model, matching the
 * "controlled, versioned templates" requirement. Layout uses @react-pdf/
 * renderer's own pagination (Page wraps content across pages automatically;
 * `wrap` on long text blocks prevents mid-word clipping).
 */

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111827", lineHeight: 1.4 },
  disclaimer: { fontSize: 8, color: "#7c2d12", backgroundColor: "#fef3c7", padding: 8, marginBottom: 16, borderRadius: 2 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#4b5563", marginBottom: 16 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6, borderBottom: "1 solid #d1d5db", paddingBottom: 3 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: "38%", color: "#4b5563" },
  value: { width: "62%" },
  paragraph: { marginBottom: 4 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 7, color: "#6b7280", flexDirection: "row", justifyContent: "space-between" },
  signatureBlock: { marginTop: 24, flexDirection: "row", justifyContent: "space-between" },
  signatureLine: { width: "45%" },
  signatureRule: { borderBottom: "1 solid #111827", marginTop: 24, marginBottom: 4 },
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row} wrap={false}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  );
}

function partyLine(party: PartyInfo): string {
  const parts = [party.legalName || "—"];
  if (party.entityName) parts.push(`(${party.entityName})`);
  return parts.join(" ");
}

function partyContact(party: PartyInfo): string {
  const address = [party.mailingAddressLine1, party.mailingCity, party.mailingState, party.mailingZip].filter(Boolean).join(", ");
  const contact = [party.email, party.phone].filter(Boolean).join(" · ");
  return [address, contact].filter(Boolean).join("  |  ") || "—";
}

export type ContractDocumentProps = {
  formData: ContractFormData;
  templateLabel: string;
  templateVersion: string;
  disclaimer: string;
  generatedAt: string;
  jurisdictionState: string | null;
};

export function ContractDocument({ formData, templateLabel, templateVersion, disclaimer, generatedAt, jurisdictionState }: ContractDocumentProps) {
  const p = formData.property;
  const pt = formData.purchaseTerms;
  const dd = formData.dueDiligence;
  const at = formData.additionalTerms;

  return (
    <Document title="Real Estate Purchase Agreement (Draft)">
      <Page size="LETTER" style={styles.page} wrap>
        <Text style={styles.disclaimer}>
          DRAFT — FOR INFORMATIONAL AND DRAFTING PURPOSES ONLY. {disclaimer} RealOffer AI is not a law firm and does not provide legal advice.
        </Text>

        <Text style={styles.title}>Real Estate Purchase Agreement</Text>
        <Text style={styles.subtitle}>
          {templateLabel} · v{templateVersion} · {jurisdictionState ? `Jurisdiction: ${jurisdictionState}` : "No jurisdiction selected"} · Generated{" "}
          {new Date(generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property</Text>
          <Row label="Address" value={`${p.addressLine1}, ${p.city}, ${p.state} ${p.zip}`} />
          <Row label="County" value={p.county} />
          <Row label="Parcel / APN" value={p.parcelNumber} />
          <Row label="Property type" value={p.propertyType} />
          <Row label="Bedrooms" value={p.bedrooms !== null ? String(p.bedrooms) : ""} />
          <Row label="Bathrooms" value={p.bathrooms !== null ? String(p.bathrooms) : ""} />
          <Row label="Legal description" value={p.legalDescription} />
          <Row label="Included personal property" value={p.includedPersonalProperty} />
          <Row label="Excluded items" value={p.excludedItems} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <Row label="Buyer" value={partyLine(formData.buyer)} />
          <Row label="Buyer contact" value={partyContact(formData.buyer)} />
          {formData.additionalBuyers.map((b, i) => (
            <Row key={`ab-${i}`} label={`Additional buyer ${i + 1}`} value={partyLine(b)} />
          ))}
          <Row label="Seller" value={partyLine(formData.seller)} />
          <Row label="Seller contact" value={partyContact(formData.seller)} />
          {formData.additionalSellers.map((s, i) => (
            <Row key={`as-${i}`} label={`Additional seller ${i + 1}`} value={partyLine(s)} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Price and Financing</Text>
          <Row label="Purchase price" value={pt.purchasePriceCents !== null ? formatCents(pt.purchasePriceCents) : ""} />
          <Row label="Earnest money deposit" value={pt.earnestMoneyCents !== null ? formatCents(pt.earnestMoneyCents) : ""} />
          <Row label="Earnest money due date" value={pt.earnestMoneyDueDate ?? ""} />
          <Row label="Financing type" value={pt.financingType ?? ""} />
          <Row label="Financing contingency" value={pt.financingContingency ? "Yes" : "No"} />
          <Row label="Appraisal contingency" value={pt.appraisalContingency ? "Yes" : "No"} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Closing</Text>
          <Row label="Closing date" value={pt.closingDate ?? ""} />
          <Row label="Possession date" value={pt.possessionDate ?? ""} />
          <Row label="Closing company / attorney" value={pt.closingCompanyOrAttorney} />
          <Row label="Closing-cost allocation" value={pt.closingCostAllocation} />
          <Row label="Proration settings" value={pt.prorationSettings} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Due Diligence</Text>
          <Row label="Inspection period" value={dd.inspectionPeriodDays !== null ? `${dd.inspectionPeriodDays} days` : ""} />
          <Row label="Inspection deadline" value={dd.inspectionDeadline ?? ""} />
          <Row label="Right to terminate during inspection" value={dd.rightToTerminateDuringInspection ? "Yes" : "No"} />
          <Row label="Property access terms" value={dd.propertyAccessTerms} />
          <Row label="Title review period" value={dd.titleReviewPeriodDays !== null ? `${dd.titleReviewPeriodDays} days` : ""} />
          <Row label="Survey required" value={dd.surveyRequired ? "Yes" : "No"} />
          <Row label="Property condition" value={dd.propertyCondition ?? ""} />
          <Row label="Required seller disclosures" value={dd.requiredSellerDisclosures} />
          <Row label="Due diligence notes" value={dd.dueDiligenceNotes} />
        </View>

        {formData.assignment && formData.assignment.includeAssignmentClause ? (
          <View style={styles.section} break={false}>
            <Text style={styles.sectionTitle}>Wholesaling and Assignment</Text>
            <Row label="Assignable" value={formData.assignment.assignable === null ? "" : formData.assignment.assignable ? "Assignable agreement" : "Non-assignable agreement"} />
            <Row label="Buyer may nominate another entity" value={formData.assignment.buyerMayNominate ? "Yes" : "No"} />
            <Row label="Assignment fee excluded from contract" value={formData.assignment.assignmentFeeExcludedFromContract ? "Yes" : "No"} />
            {formData.assignment.includeDoubleClosingNote ? (
              <Text style={styles.paragraph}>
                Note: this transaction may involve a double closing, where the buyer resells the property to an end buyer in a separate, simultaneous or
                near-simultaneous closing.
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Terms</Text>
          <Row label="Access before closing" value={at.accessBeforeClosing} />
          <Row label="Existing tenant or lease" value={at.existingTenantOrLease} />
          <Row label="Utilities" value={at.utilities} />
          <Row label="Repairs or credits" value={at.repairsOrCredits} />
          <Row label="Personal property notes" value={at.personalPropertyNotes} />
          <Row label="Special stipulations" value={at.specialStipulations} />
          <Row label="Other terms" value={at.otherTerms} />
        </View>

        <View style={styles.signatureBlock} wrap={false}>
          <View style={styles.signatureLine}>
            <View style={styles.signatureRule} />
            <Text>Buyer signature</Text>
            <View style={styles.signatureRule} />
            <Text>Date</Text>
          </View>
          <View style={styles.signatureLine}>
            <View style={styles.signatureRule} />
            <Text>Seller signature</Text>
            <View style={styles.signatureRule} />
            <Text>Date</Text>
          </View>
        </View>
        <Text style={{ fontSize: 7, color: "#6b7280", marginTop: 10 }}>
          Signature lines are blank fields for printing only — this milestone does not implement electronic signatures.
        </Text>

        <View style={styles.footer} fixed>
          <Text>
            {templateLabel} v{templateVersion} · Draft — not legally binding until reviewed and properly executed
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
