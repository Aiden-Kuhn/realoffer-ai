import "server-only";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { rowToContract, type ContractRow } from "@/lib/contracts/mapRow";
import { contractFormDataSchema, collectReadyForReviewIssues } from "@/lib/contracts/schema";
import { getTemplateMeta } from "@/lib/contracts/templates/index";
import { ContractDocument } from "@/lib/contracts/pdf/ContractDocument";

/**
 * Server-verified PDF export. Ownership is enforced two ways: RLS on the
 * `contracts` select (a foreign user's contract simply returns no row, not
 * an error — so this 404s rather than leaking existence), and the fact
 * that `createClient()` here reads the session from the request's own
 * cookies via getUser(), never a client-supplied id.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await supabase.from("contracts").select("*").eq("id", id).maybeSingle();
  if (error) {
    return NextResponse.json({ error: "Couldn't load this contract." }, { status: 500 });
  }
  if (!data) {
    // Deliberately identical response whether the id doesn't exist or
    // belongs to another user — RLS already filtered it out above.
    return NextResponse.json({ error: "Contract not found." }, { status: 404 });
  }

  const contract = rowToContract(data as ContractRow);
  const parsed = contractFormDataSchema.safeParse(contract.formData);
  if (!parsed.success) {
    return NextResponse.json({ error: "This contract's data couldn't be validated. Please review it in the builder and try again." }, { status: 422 });
  }

  const issues = collectReadyForReviewIssues(parsed.data, contract.createdAt);
  if (issues.length > 0) {
    return NextResponse.json({ error: "This contract is missing required information.", issues }, { status: 422 });
  }

  const templateMeta = getTemplateMeta(contract.templateId);
  const generatedAt = new Date().toISOString();

  const buffer = await renderToBuffer(
    ContractDocument({
      formData: parsed.data,
      templateLabel: templateMeta?.label ?? contract.templateId,
      templateVersion: contract.templateVersion,
      disclaimer: templateMeta?.disclaimer ?? "Have a licensed attorney review this document before use.",
      generatedAt,
      jurisdictionState: contract.jurisdictionState,
    }),
  );

  // Freeze the snapshot and mark exported — RLS on this update requires
  // the same ownership (auth.uid() = user_id and deal_id still owned by
  // that user), so this fails closed if anything about ownership changed
  // between the read above and this write.
  await supabase
    .from("contracts")
    .update({ document_snapshot: parsed.data, status: "exported" })
    .eq("id", id);

  const fileSafeAddress = (parsed.data.property.addressLine1 || "purchase-agreement").replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileSafeAddress}-purchase-agreement.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
