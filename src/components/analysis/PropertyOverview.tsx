import { BedDouble, Bath, Home, Ruler, CalendarDays, LandPlot, Tag, Clock3, Receipt, Gauge, type LucideIcon } from "lucide-react";
import { formatCents } from "@/lib/calculations/money";
import { SourceBadge, type SourceBadgeKind } from "@/components/shared/SourceBadge";
import { PROPERTY_TYPE_LABELS } from "@/lib/property/labels";
import type { PropertyRecord } from "@/lib/property/types";

type FactCard = { icon: LucideIcon; label: string; value: string; badge: SourceBadgeKind; title?: string };
type DetailRow = { label: string; value: string; badge: SourceBadgeKind; title?: string };
type QuickFacts = { typeLabel: string; statsLine: string | null; metaLine: string | null };

/** Explains *why* a field reads "Not available" rather than leaving it
 * ambiguous whether that's a provider gap, a demo-data limitation, or an
 * app bug — shown as a hover title so the compact fact cards stay compact. */
function unavailableTitle(isReal: boolean): string {
  return isReal
    ? "Not available from the property data provider."
    : "Not available in this simulated demo data.";
}

/** Shared shape for a present-or-unavailable field: picks the display value,
 * badge, and (when unavailable) hover title in one place instead of
 * repeating the same three-way ternary at every call site. */
function field(present: boolean, value: string, badgeWhenPresent: SourceBadgeKind, isReal: boolean): { value: string; badge: SourceBadgeKind; title?: string } {
  if (present) return { value, badge: isReal ? badgeWhenPresent : "demo" };
  return { value: "Not available", badge: "unavailable", title: unavailableTitle(isReal) };
}

function buildQuickFacts(property: PropertyRecord): QuickFacts {
  const statsParts: string[] = [];
  if (property.bedrooms !== null) statsParts.push(`${property.bedrooms} ${property.bedrooms === 1 ? "Bed" : "Beds"}`);
  if (property.bathrooms !== null) statsParts.push(`${property.bathrooms} ${property.bathrooms === 1 ? "Bath" : "Baths"}`);
  if (property.squareFootage !== null) statsParts.push(`${property.squareFootage.toLocaleString()} sqft`);

  const metaParts: string[] = [];
  if (property.yearBuilt !== null) metaParts.push(`Built ${property.yearBuilt}`);
  const cityState = [property.address.city, property.address.state].filter(Boolean).join(", ");
  if (cityState) metaParts.push(cityState);

  return {
    typeLabel: PROPERTY_TYPE_LABELS[property.propertyType],
    statsLine: statsParts.length > 0 ? statsParts.join(" • ") : null,
    metaLine: metaParts.length > 0 ? metaParts.join(" • ") : null,
  };
}

function buildKeyFacts(property: PropertyRecord): FactCard[] {
  const isReal = property.source === "rentcast";

  return [
    { icon: BedDouble, label: "Bedrooms", ...field(property.bedrooms !== null, String(property.bedrooms), "provider_record", isReal) },
    { icon: Bath, label: "Bathrooms", ...field(property.bathrooms !== null, String(property.bathrooms), "provider_record", isReal) },
    {
      icon: Home,
      label: "Property type",
      value: PROPERTY_TYPE_LABELS[property.propertyType],
      badge: isReal ? "provider_record" : "demo",
    },
    {
      icon: Ruler,
      label: "Square footage",
      ...field(property.squareFootage !== null, `${property.squareFootage?.toLocaleString()} sqft`, "provider_record", isReal),
    },
    { icon: CalendarDays, label: "Year built", ...field(property.yearBuilt !== null, String(property.yearBuilt), "provider_record", isReal) },
    {
      icon: LandPlot,
      label: "Lot size",
      ...field(property.lotSizeSqft !== null, `${property.lotSizeSqft?.toLocaleString()} sqft`, "provider_record", isReal),
    },
    {
      icon: Tag,
      label: "List price",
      ...field(property.listPriceCents !== null, formatCents(property.listPriceCents ?? 0), "active_listing", isReal),
    },
    {
      icon: Clock3,
      label: "Days on market",
      ...field(property.daysOnMarket !== null, String(property.daysOnMarket), "active_listing", isReal),
    },
    {
      icon: Receipt,
      label: "HOA fee",
      ...field(property.hoaFeeCents !== null, `${formatCents(property.hoaFeeCents ?? 0)}/mo`, "active_listing", isReal),
    },
    {
      icon: Gauge,
      label: "Current estimated value (AVM)",
      ...field(property.currentValueCents !== null, formatCents(property.currentValueCents ?? 0), "automated_estimate", isReal),
    },
  ];
}

function buildAdditionalDetails(property: PropertyRecord): DetailRow[] {
  const isReal = property.source === "rentcast";

  return [
    {
      label: "Listing status",
      value: property.listingStatus ?? "No active listing found",
      badge: property.listingStatus !== null ? (isReal ? "active_listing" : "demo") : "unavailable",
      title: property.listingStatus === null ? "No active listing was found for this property from the property data provider." : undefined,
    },
    {
      label: "Last sale",
      ...field(
        property.lastSaleDate !== null && property.lastSalePriceCents !== null,
        property.lastSaleDate && property.lastSalePriceCents !== null
          ? `${formatCents(property.lastSalePriceCents)} (${new Date(property.lastSaleDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })})`
          : "",
        "provider_record",
        isReal,
      ),
    },
    {
      label: "Tax assessed value",
      ...field(property.taxAssessedValueCents !== null, formatCents(property.taxAssessedValueCents ?? 0), "provider_record", isReal),
    },
    {
      label: "MLS #",
      ...field(property.mlsId !== null, property.mlsId ?? "", "active_listing", isReal),
    },
    {
      label: "Data last retrieved",
      value: new Date(property.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      badge: isReal ? "provider_record" : "demo",
    },
  ];
}

export function PropertyOverview({ property }: { property: PropertyRecord }) {
  const keyFacts = buildKeyFacts(property);
  const details = buildAdditionalDetails(property);
  const quickFacts = buildQuickFacts(property);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold text-white mb-1">Property overview</h2>
      <p className="text-xs text-muted mb-5">A snapshot of this property&apos;s key details and provenance.</p>

      <div className="mb-6">
        <p className="text-base font-semibold tracking-tight text-white">{quickFacts.typeLabel}</p>
        {quickFacts.statsLine ? <p className="mt-1 text-sm text-white/70">{quickFacts.statsLine}</p> : null}
        {quickFacts.metaLine ? <p className="mt-1 text-sm text-muted">{quickFacts.metaLine}</p> : null}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 auto-rows-fr gap-2.5 sm:gap-3 mb-6">
        {keyFacts.map((fact) => (
          <div
            key={fact.label}
            className="group flex min-w-0 flex-col justify-between rounded-xl border border-border bg-surface-2 p-3.5 transition-colors duration-200 hover:border-border-strong"
          >
            <div className="flex items-center gap-1.5 text-muted">
              <fact.icon className="h-3.5 w-3.5 shrink-0 text-white/40 transition-colors duration-200 group-hover:text-white/60" strokeWidth={1.75} />
              <span className="text-[11px] leading-tight">{fact.label}</span>
            </div>
            <p className="mt-2 text-sm sm:text-base font-semibold text-white tabular-nums leading-snug break-words" title={fact.title}>
              {fact.value}
            </p>
            <div className="mt-2">
              <SourceBadge kind={fact.badge} />
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-border mb-5" />

      <h3 className="text-xs font-medium uppercase tracking-wide text-muted mb-3">Additional details</h3>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
        {details.map((row) => (
          <div key={row.label}>
            <dt className="text-xs text-muted mb-1">{row.label}</dt>
            <dd className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-white" title={row.title}>
              {row.value}
              <SourceBadge kind={row.badge} />
            </dd>
          </div>
        ))}
      </dl>

      {property.valuationRangeLowCents !== null && property.valuationRangeHighCents !== null ? (
        <p className="mt-5 text-xs text-muted">
          AVM range: {formatCents(property.valuationRangeLowCents)} – {formatCents(property.valuationRangeHighCents)}
        </p>
      ) : null}
    </section>
  );
}
