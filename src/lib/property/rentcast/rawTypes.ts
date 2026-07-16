/**
 * Minimal typed shapes for the RentCast fields this app actually reads.
 * These intentionally do NOT model every field RentCast returns (e.g. owner
 * contact info, which this milestone does not retrieve or display) — see
 * docs/RENTCAST.md for the endpoints and fields in scope.
 */

export type RentCastTaxAssessment = {
  year: number;
  value: number;
  land?: number;
  improvements?: number;
};

export type RentCastPropertyTax = {
  year: number;
  total: number;
};

export type RentCastPropertyRecord = {
  id: string;
  formattedAddress: string;
  addressLine1?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  lastSaleDate?: string;
  lastSalePrice?: number;
  taxAssessments?: Record<string, RentCastTaxAssessment>;
  propertyTaxes?: Record<string, RentCastPropertyTax>;
};

export type RentCastSaleListing = {
  id: string;
  formattedAddress: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  price?: number;
  status?: string;
  listedDate?: string;
  daysOnMarket?: number;
  mlsNumber?: string;
  hoa?: { fee?: number };
};

export type RentCastComparable = {
  id?: string;
  formattedAddress: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
  price?: number;
  status?: string;
  daysOnMarket?: number;
  distance?: number;
  correlation?: number;
  listedDate?: string;
  lastSeenDate?: string;
};

export type RentCastValueEstimate = {
  price?: number;
  priceRangeLow?: number;
  priceRangeHigh?: number;
  comparables?: RentCastComparable[];
};
