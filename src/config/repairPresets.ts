export const REPAIR_CATEGORIES = [
  "roof",
  "hvac",
  "plumbing",
  "electrical",
  "kitchen",
  "bathrooms",
  "flooring",
  "interiorPaint",
  "windows",
  "foundation",
  "exterior",
  "landscaping",
  "miscellaneous",
] as const;

export type RepairCategory = (typeof REPAIR_CATEGORIES)[number];

export const REPAIR_CATEGORY_LABELS: Record<RepairCategory, string> = {
  roof: "Roof",
  hvac: "HVAC",
  plumbing: "Plumbing",
  electrical: "Electrical",
  kitchen: "Kitchen",
  bathrooms: "Bathrooms",
  flooring: "Flooring",
  interiorPaint: "Interior Paint",
  windows: "Windows",
  foundation: "Foundation",
  exterior: "Exterior",
  landscaping: "Landscaping",
  miscellaneous: "Miscellaneous",
};

export type ConditionPresetKey =
  | "light_cosmetic"
  | "moderate_renovation"
  | "heavy_renovation"
  | "full_gut";

export type ConditionPreset = {
  label: string;
  description: string;
  costPerSqftCentsLow: number;
  costPerSqftCentsHigh: number;
  categoryDefaultsCents: Record<RepairCategory, number>;
};

/**
 * Rough, editable starting points only. Actual repair costs vary heavily by
 * location, labor market, materials, and the true condition of the property.
 */
export const CONDITION_PRESETS: Record<ConditionPresetKey, ConditionPreset> = {
  light_cosmetic: {
    label: "Light Cosmetic",
    description: "Paint, flooring touch-ups, fixtures, landscaping cleanup.",
    costPerSqftCentsLow: 800,
    costPerSqftCentsHigh: 1_500,
    categoryDefaultsCents: {
      roof: 0,
      hvac: 0,
      plumbing: 50_000,
      electrical: 30_000,
      kitchen: 300_000,
      bathrooms: 200_000,
      flooring: 400_000,
      interiorPaint: 250_000,
      windows: 0,
      foundation: 0,
      exterior: 150_000,
      landscaping: 100_000,
      miscellaneous: 100_000,
    },
  },
  moderate_renovation: {
    label: "Moderate Renovation",
    description: "Kitchen and bath updates, some systems work, full paint and flooring.",
    costPerSqftCentsLow: 2_000,
    costPerSqftCentsHigh: 3_500,
    categoryDefaultsCents: {
      roof: 300_000,
      hvac: 400_000,
      plumbing: 250_000,
      electrical: 200_000,
      kitchen: 1_200_000,
      bathrooms: 700_000,
      flooring: 700_000,
      interiorPaint: 350_000,
      windows: 300_000,
      foundation: 0,
      exterior: 400_000,
      landscaping: 150_000,
      miscellaneous: 200_000,
    },
  },
  heavy_renovation: {
    label: "Heavy Renovation",
    description: "Major systems replacement, full kitchen and bath overhaul, structural touch-ups.",
    costPerSqftCentsLow: 4_000,
    costPerSqftCentsHigh: 6_000,
    categoryDefaultsCents: {
      roof: 900_000,
      hvac: 800_000,
      plumbing: 700_000,
      electrical: 600_000,
      kitchen: 2_000_000,
      bathrooms: 1_400_000,
      flooring: 1_000_000,
      interiorPaint: 450_000,
      windows: 700_000,
      foundation: 500_000,
      exterior: 800_000,
      landscaping: 250_000,
      miscellaneous: 400_000,
    },
  },
  full_gut: {
    label: "Full Gut Renovation",
    description: "Down-to-the-studs rebuild: all systems, structure, and finishes.",
    costPerSqftCentsLow: 6_500,
    costPerSqftCentsHigh: 9_000,
    categoryDefaultsCents: {
      roof: 1_200_000,
      hvac: 1_200_000,
      plumbing: 1_100_000,
      electrical: 950_000,
      kitchen: 2_800_000,
      bathrooms: 2_000_000,
      flooring: 1_500_000,
      interiorPaint: 550_000,
      windows: 1_100_000,
      foundation: 900_000,
      exterior: 1_200_000,
      landscaping: 350_000,
      miscellaneous: 600_000,
    },
  },
};
