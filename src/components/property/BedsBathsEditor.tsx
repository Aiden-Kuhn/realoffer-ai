"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { inputClasses } from "@/components/shared/Field";
import { parseBedroomsOverride, parseBathroomsOverride } from "@/lib/property/bedsBathsOverride";

type BedsBathsEditorProps = {
  providerBedrooms: number | null;
  providerBathrooms: number | null;
  bedroomsOverride: number | null;
  bathroomsOverride: number | null;
  onChangeBedroomsOverride: (value: number | null) => void;
  onChangeBathroomsOverride: (value: number | null) => void;
};

/** The one place in the app a bedroom/bathroom correction can be entered —
 * intentionally not duplicated elsewhere (see PropertyOverview.tsx, the
 * only caller). Saving/removing here updates the deal's local override
 * state immediately; persisting it to Supabase still requires the normal
 * "Save" action on the deal, exactly like every other editable field on
 * this page (assumptions, repair estimate, comps). */
export function BedsBathsEditor({
  providerBedrooms,
  providerBathrooms,
  bedroomsOverride,
  bathroomsOverride,
  onChangeBedroomsOverride,
  onChangeBathroomsOverride,
}: BedsBathsEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [bedroomsInput, setBedroomsInput] = useState(bedroomsOverride !== null ? String(bedroomsOverride) : "");
  const [bathroomsInput, setBathroomsInput] = useState(bathroomsOverride !== null ? String(bathroomsOverride) : "");
  const [error, setError] = useState<string | null>(null);

  const isOverridden = bedroomsOverride !== null || bathroomsOverride !== null;

  function openEditor() {
    setBedroomsInput(bedroomsOverride !== null ? String(bedroomsOverride) : "");
    setBathroomsInput(bathroomsOverride !== null ? String(bathroomsOverride) : "");
    setError(null);
    setIsOpen(true);
  }

  function handleSave() {
    const bedroomsResult = parseBedroomsOverride(bedroomsInput);
    if (!bedroomsResult.ok) {
      setError(bedroomsResult.error);
      return;
    }
    const bathroomsResult = parseBathroomsOverride(bathroomsInput);
    if (!bathroomsResult.ok) {
      setError(bathroomsResult.error);
      return;
    }
    onChangeBedroomsOverride(bedroomsResult.value);
    onChangeBathroomsOverride(bathroomsResult.value);
    setError(null);
    setIsOpen(false);
  }

  function handleRemove() {
    onChangeBedroomsOverride(null);
    onChangeBathroomsOverride(null);
    setBedroomsInput("");
    setBathroomsInput("");
    setError(null);
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={openEditor}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-accent-3 hover:text-accent-3/80 transition-colors"
      >
        <Pencil className="h-3 w-3" />
        {isOverridden ? "Edit correction" : "Correct bd/ba"}
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-accent-3/25 bg-accent-3/[0.05] p-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-white">Correct bedrooms / bathrooms</p>
        <button type="button" onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors" aria-label="Close">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-xs text-muted mb-3">
        Enter the correct count if RentCast&apos;s data looks wrong for this property. Leave a field blank to use RentCast&apos;s value.
      </p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-white/70 mb-1" htmlFor="bedrooms-override-input">
            Bedrooms
          </label>
          <input
            id="bedrooms-override-input"
            type="number"
            min={0}
            step={1}
            placeholder={providerBedrooms !== null ? String(providerBedrooms) : "—"}
            value={bedroomsInput}
            onChange={(e) => setBedroomsInput(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label className="block text-xs text-white/70 mb-1" htmlFor="bathrooms-override-input">
            Bathrooms
          </label>
          <input
            id="bathrooms-override-input"
            type="number"
            min={0}
            step={0.5}
            placeholder={providerBathrooms !== null ? String(providerBathrooms) : "—"}
            value={bathroomsInput}
            onChange={(e) => setBathroomsInput(e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>
      {error ? <p className="text-xs text-red-400 mb-3">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="h-9 rounded-full bg-white px-4 text-xs font-medium text-black hover:bg-white/90 active:scale-[0.98] transition-all duration-150"
        >
          Save correction
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="h-9 rounded-full px-4 text-xs font-medium text-white/70 hover:text-white transition-colors"
        >
          Cancel
        </button>
        {isOverridden ? (
          <button
            type="button"
            onClick={handleRemove}
            className="ml-auto h-9 rounded-full px-4 text-xs font-medium text-white/50 hover:text-red-300 transition-colors"
          >
            Remove correction
          </button>
        ) : null}
      </div>
    </div>
  );
}
