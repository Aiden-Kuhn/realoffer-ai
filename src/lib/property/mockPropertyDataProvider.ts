import {
  createSeededRandom,
  hashString,
  pickFrom,
  randomFloatBetween,
  randomIntBetween,
} from "@/lib/property/seededRandom";
import type {
  ComparableSale,
  NormalizedAddress,
  PropertyDataProvider,
  PropertyProfile,
  PropertyRecord,
  PropertyType,
} from "@/lib/property/types";

const PROFILES: PropertyProfile[] = ["strong", "borderline", "weak", "incomplete"];

const PROPERTY_TYPES: PropertyType[] = ["single_family", "townhouse", "condo", "multi_family"];

const STREET_NAMES = [
  "Maple Ridge Dr",
  "Oak Hollow Ln",
  "Cedar Point Ave",
  "Willow Creek Rd",
  "Sunset Terrace",
  "Birchwood Ct",
  "Magnolia St",
  "Prairie View Dr",
  "Harbor View Ln",
  "Stonebridge Way",
];

function centsToRoundedDollarsCents(cents: number, nearestDollars: number): number {
  const nearestCents = nearestDollars * 100;
  return Math.round(cents / nearestCents) * nearestCents;
}

function profileForAddress(address: NormalizedAddress): { profile: PropertyProfile; seed: number } {
  const seed = hashString(address.formatted);
  const profile = PROFILES[seed % PROFILES.length];
  return { profile, seed };
}

function buildComparables(
  rng: () => number,
  subjectAddress: NormalizedAddress,
  subjectSqft: number,
  arvExpectedCents: number,
  count: number,
): ComparableSale[] {
  const comps: ComparableSale[] = [];

  for (let i = 0; i < count; i++) {
    const sqftVariance = randomFloatBetween(rng, 0.85, 1.18);
    const squareFootage = Math.round(subjectSqft * sqftVariance);
    const pricePerSqftBase = arvExpectedCents / subjectSqft;
    const priceVariance = randomFloatBetween(rng, 0.92, 1.08);
    const pricePerSqftCents = Math.round(pricePerSqftBase * priceVariance);
    const salePriceCents = centsToRoundedDollarsCents(pricePerSqftCents * squareFootage, 500);

    const houseNumber = randomIntBetween(rng, 100, 9899);
    const street = pickFrom(rng, STREET_NAMES);

    const daysAgo = randomIntBetween(rng, 12, 210);
    const saleDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    comps.push({
      id: `comp-${i + 1}`,
      address: `${houseNumber} ${street}, ${subjectAddress.city || "Nearby"}, ${subjectAddress.state || "--"}`,
      salePriceCents,
      saleDate,
      distanceMiles: Math.round(randomFloatBetween(rng, 0.2, 2.9) * 10) / 10,
      squareFootage,
      pricePerSqftCents,
      bedrooms: randomIntBetween(rng, 2, 5),
      bathrooms: randomIntBetween(rng, 2, 4),
      similarityScore: randomIntBetween(rng, 62, 98),
      source: "simulated",
      included: true,
    });
  }

  return comps.sort((a, b) => b.similarityScore - a.similarityScore);
}

const PROFILE_DESCRIPTIONS: Record<PropertyProfile, string> = {
  strong: "Simulated listing showing meaningful spread between list price and estimated after-repair value.",
  borderline: "Simulated listing with a moderate spread — margins depend heavily on your assumptions.",
  weak: "Simulated listing priced close to or above estimated after-repair value once repairs are factored in.",
  incomplete: "Simulated listing with limited public data available — several fields could not be determined.",
};

function generateForProfile(
  profile: PropertyProfile,
  seed: number,
  address: NormalizedAddress,
): PropertyRecord {
  const rng = createSeededRandom(seed);

  const isIncomplete = profile === "incomplete";

  const squareFootage = isIncomplete && rng() < 0.6 ? null : randomIntBetween(rng, 1100, 3200);
  const bedrooms = isIncomplete && rng() < 0.5 ? null : randomIntBetween(rng, 2, 5);
  const bathrooms = isIncomplete && rng() < 0.5 ? null : randomIntBetween(rng, 1, 4);
  const yearBuilt = isIncomplete && rng() < 0.6 ? null : randomIntBetween(rng, 1948, 2019);
  const lotSizeSqft = randomIntBetween(rng, 4000, 12000);
  const daysOnMarket = isIncomplete && rng() < 0.4 ? null : randomIntBetween(rng, 1, 120);
  const propertyType = pickFrom(rng, PROPERTY_TYPES);

  const effectiveSqft = squareFootage ?? 1500;

  // Base $/sqft market value the simulated ARV is built from.
  const baseValuePerSqftCents = randomIntBetween(rng, 18000, 32000); // $180-$320/sqft
  const arvExpectedCents = centsToRoundedDollarsCents(baseValuePerSqftCents * effectiveSqft, 1000);
  const arvLowCents = Math.round(arvExpectedCents * 0.93);
  const arvHighCents = Math.round(arvExpectedCents * 1.07);

  let listPriceRatio: number;
  let repairPerSqftCents: number;

  switch (profile) {
    case "strong":
      listPriceRatio = randomFloatBetween(rng, 0.52, 0.63);
      repairPerSqftCents = randomIntBetween(rng, 1500, 2800);
      break;
    case "borderline":
      listPriceRatio = randomFloatBetween(rng, 0.68, 0.78);
      repairPerSqftCents = randomIntBetween(rng, 2800, 4200);
      break;
    case "weak":
      listPriceRatio = randomFloatBetween(rng, 0.88, 1.03);
      repairPerSqftCents = randomIntBetween(rng, 4200, 6500);
      break;
    case "incomplete":
    default:
      listPriceRatio = randomFloatBetween(rng, 0.65, 0.82);
      repairPerSqftCents = randomIntBetween(rng, 2500, 4500);
      break;
  }

  const listPriceCents =
    isIncomplete && rng() < 0.3 ? null : centsToRoundedDollarsCents(arvExpectedCents * listPriceRatio, 500);
  const suggestedRepairCostCents = centsToRoundedDollarsCents(repairPerSqftCents * effectiveSqft, 500);

  const comparables = buildComparables(rng, address, effectiveSqft, arvExpectedCents, 5);

  const confidence = isIncomplete ? "low" : profile === "borderline" ? "medium" : "high";

  const description = `${PROFILE_DESCRIPTIONS[profile]} ${
    squareFootage ? `Approximately ${squareFootage.toLocaleString()} sqft.` : "Square footage not available in public records."
  }`;

  return {
    address,
    listPriceCents,
    bedrooms,
    bathrooms,
    squareFootage,
    lotSizeSqft,
    yearBuilt,
    propertyType,
    daysOnMarket,
    description,
    source: "simulated",
    confidence,
    lastUpdated: new Date().toISOString(),
    arvLowCents,
    arvExpectedCents,
    arvHighCents,
    suggestedRepairCostCents,
    comparables,
    profile,
  };
}

export class MockPropertyDataProvider implements PropertyDataProvider {
  async getPropertyByAddress(address: NormalizedAddress): Promise<PropertyRecord> {
    const { profile, seed } = profileForAddress(address);
    return generateForProfile(profile, seed, address);
  }
}

export const propertyDataProvider: PropertyDataProvider = new MockPropertyDataProvider();
