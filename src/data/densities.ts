// Approximate densities (g/mL) for common baking ingredients.
// These are reasonable defaults sourced from standard baking references —
// users can override with a measured value on any material for more precision
// (e.g. a specific brand of flour, sifted vs. scooped, etc).

export interface DensityRef {
  name: string;
  densityGPerMl: number;
  note?: string;
}

export const DENSITY_REFERENCE: DensityRef[] = [
  { name: 'All-purpose flour', densityGPerMl: 0.529 },
  { name: 'Bread flour', densityGPerMl: 0.543 },
  { name: 'Cake flour', densityGPerMl: 0.482 },
  { name: 'Granulated sugar', densityGPerMl: 0.845 },
  { name: 'Brown sugar (packed)', densityGPerMl: 0.965 },
  { name: 'Powdered sugar', densityGPerMl: 0.56 },
  { name: 'Butter', densityGPerMl: 0.911 },
  { name: 'Vegetable oil', densityGPerMl: 0.92 },
  { name: 'Honey', densityGPerMl: 1.42 },
  { name: 'Milk', densityGPerMl: 1.03 },
  { name: 'Heavy cream', densityGPerMl: 0.994 },
  { name: 'Buttermilk', densityGPerMl: 1.03 },
  { name: 'Baking soda', densityGPerMl: 2.2 },
  { name: 'Baking powder', densityGPerMl: 0.9 },
  { name: 'Salt (table)', densityGPerMl: 1.2 },
  { name: 'Cocoa powder', densityGPerMl: 0.51 },
  { name: 'Vanilla extract', densityGPerMl: 0.879 },
  { name: 'Cream cheese', densityGPerMl: 1.01 },
  { name: 'Sour cream', densityGPerMl: 1.02 },
  { name: 'Yogurt', densityGPerMl: 1.03 },
  { name: 'Cardamom (ground)', densityGPerMl: 0.45 },
  { name: 'Cinnamon (ground)', densityGPerMl: 0.56 },
  { name: 'Rose water', densityGPerMl: 0.99 },
  { name: 'Ghee', densityGPerMl: 0.91 },
  { name: 'Almond flour', densityGPerMl: 0.42 },
  { name: 'Cornstarch', densityGPerMl: 0.544 },
];

export function findDensityMatch(materialName: string): DensityRef | undefined {
  const lower = materialName.trim().toLowerCase();
  return DENSITY_REFERENCE.find(
    (d) => d.name.toLowerCase() === lower || lower.includes(d.name.toLowerCase())
  );
}
