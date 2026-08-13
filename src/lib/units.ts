// All weight conversions resolve to grams; all volume conversions resolve to milliliters.
// Bridging volume <-> weight requires a density (g/mL) for the specific ingredient.

export type UnitType = 'weight' | 'volume' | 'count';

export interface UnitDef {
  id: string;
  label: string;
  type: UnitType;
  toBase: number; // multiply amount by this to get grams (weight) or mL (volume) or 1 (count)
}

export const UNITS: UnitDef[] = [
  // weight -> base gram
  { id: 'g', label: 'grams (g)', type: 'weight', toBase: 1 },
  { id: 'kg', label: 'kilograms (kg)', type: 'weight', toBase: 1000 },
  { id: 'oz', label: 'ounces (oz)', type: 'weight', toBase: 28.3495 },
  { id: 'lb', label: 'pounds (lb)', type: 'weight', toBase: 453.592 },

  // volume -> base mL
  { id: 'ml', label: 'milliliters (mL)', type: 'volume', toBase: 1 },
  { id: 'l', label: 'liters (L)', type: 'volume', toBase: 1000 },
  { id: 'tsp', label: 'teaspoons (tsp)', type: 'volume', toBase: 4.92892 },
  { id: 'tbsp', label: 'tablespoons (tbsp)', type: 'volume', toBase: 14.7868 },
  { id: 'fl_oz', label: 'fluid ounces (fl oz)', type: 'volume', toBase: 29.5735 },
  { id: 'cup', label: 'cups', type: 'volume', toBase: 236.588 },
  { id: 'pint', label: 'pints', type: 'volume', toBase: 473.176 },
  { id: 'quart', label: 'quarts', type: 'volume', toBase: 946.353 },
  { id: 'gallon', label: 'gallons', type: 'volume', toBase: 3785.41 },

  // count -> base "unit"
  { id: 'each', label: 'each / count', type: 'count', toBase: 1 },
];

export const unitById = (id: string): UnitDef => {
  const u = UNITS.find((u) => u.id === id);
  if (!u) throw new Error(`Unknown unit: ${id}`);
  return u;
};

export const unitsByType = (type: UnitType) => UNITS.filter((u) => u.type === type);

/**
 * Convert an amount from one unit to grams.
 * If fromUnit is volume, a density (g/mL) is required to bridge to weight.
 * If fromUnit is count, densityGPerMl is ignored and gramsPerEach must be used instead (handled by caller).
 */
export function toGrams(amount: number, fromUnitId: string, densityGPerMl?: number): number {
  const unit = unitById(fromUnitId);
  if (unit.type === 'weight') {
    return amount * unit.toBase;
  }
  if (unit.type === 'volume') {
    if (densityGPerMl == null) {
      throw new Error('Density (g/mL) is required to convert a volume unit to weight');
    }
    const mL = amount * unit.toBase;
    return mL * densityGPerMl;
  }
  throw new Error('Cannot convert a count unit to grams directly');
}

export function convertSameType(amount: number, fromUnitId: string, toUnitId: string): number {
  const from = unitById(fromUnitId);
  const to = unitById(toUnitId);
  if (from.type !== to.type) {
    throw new Error(`Cannot directly convert ${from.type} to ${to.type} without density`);
  }
  const base = amount * from.toBase;
  return base / to.toBase;
}
