import { MapPin } from "lucide-react";
import type { PropertyRecord } from "@/lib/property/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { PROPERTY_TYPE_LABELS, CONFIDENCE_LABELS } from "@/lib/property/labels";
import { resolveEffectiveBedsBaths } from "@/lib/property/bedsBathsOverride";
import type { DealPipelineStatus } from "@/types/deal";

type PropertyHeaderProps = {
  property: PropertyRecord;
  status: DealPipelineStatus;
  bedroomsOverride?: number | null;
  bathroomsOverride?: number | null;
};

export function PropertyHeader({ property, status, bedroomsOverride = null, bathroomsOverride = null }: PropertyHeaderProps) {
  const effective = resolveEffectiveBedsBaths({ property, bedroomsOverride, bathroomsOverride });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <MapPin className="h-5 w-5 text-accent-3 mt-0.5 shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">{property.address.line1}</h1>
            <p className="text-sm text-muted mt-0.5">
              {[property.address.city, [property.address.state, property.address.zip].filter(Boolean).join(" ")]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-white/60">
          {PROPERTY_TYPE_LABELS[property.propertyType]}
        </span>
        {effective.bedrooms !== null ? (
          <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-white/60">
            {effective.bedrooms} bd
            {effective.bedroomsIsOverridden ? <span className="ml-1 text-accent-3">•</span> : null}
          </span>
        ) : null}
        {effective.bathrooms !== null ? (
          <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-white/60">
            {effective.bathrooms} ba
            {effective.bathroomsIsOverridden ? <span className="ml-1 text-accent-3">•</span> : null}
          </span>
        ) : null}
        {property.squareFootage !== null ? (
          <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-white/60">
            {property.squareFootage.toLocaleString()} sqft
          </span>
        ) : null}
        {property.yearBuilt !== null ? (
          <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-white/60">Built {property.yearBuilt}</span>
        ) : null}
        {property.county ? (
          <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-white/60">{property.county} County</span>
        ) : null}
        <span className="rounded-full border border-accent-3/25 bg-accent-3/10 px-2.5 py-1 text-accent-3">
          {CONFIDENCE_LABELS[property.confidence]}
        </span>
        <SourceBadge kind={property.source === "rentcast" ? "provider_record" : "demo"} />
      </div>
    </div>
  );
}
