import { toGrams, unitById } from './units';
import type { Material, Recipe, RecipeIngredientLine } from './types';

export type BaseUnitLabel = 'g' | 'mL' | 'each';

/**
 * Express an amount+unit in the same base unit as the material's package
 * (grams for weight, mL for volume, each for count), bridging across types
 * via the material's density and/or gramsPerEach when needed.
 */
export function toMaterialBaseAmount(material: Material, amount: number, unitId: string): number {
  const fromUnit = unitById(unitId);
  const packageUnit = unitById(material.packageUnitId);
  const targetType = packageUnit.type;

  if (fromUnit.type === targetType) {
    return amount * fromUnit.toBase;
  }

  let grams: number;
  if (fromUnit.type === 'weight') {
    grams = amount * fromUnit.toBase;
  } else if (fromUnit.type === 'volume') {
    if (material.densityGPerMl == null) {
      throw new Error(`"${material.name}" needs a density (g/mL) to convert from a volume unit`);
    }
    grams = toGrams(amount, unitId, material.densityGPerMl);
  } else {
    if (material.gramsPerEach == null) {
      throw new Error(`"${material.name}" needs a grams-per-each value to convert from a count unit`);
    }
    grams = amount * fromUnit.toBase * material.gramsPerEach;
  }

  if (targetType === 'weight') {
    return grams;
  }
  if (targetType === 'volume') {
    if (material.densityGPerMl == null) {
      throw new Error(`"${material.name}" needs a density (g/mL) to convert to volume`);
    }
    return grams / material.densityGPerMl;
  }
  if (material.gramsPerEach == null) {
    throw new Error(`"${material.name}" needs a grams-per-each value to convert to count`);
  }
  return grams / material.gramsPerEach;
}

export function materialBaseUnitLabel(material: Material): BaseUnitLabel {
  const type = unitById(material.packageUnitId).type;
  if (type === 'weight') return 'g';
  if (type === 'volume') return 'mL';
  return 'each';
}

export function materialCostPerBaseUnit(material: Material): number {
  const packageUnit = unitById(material.packageUnitId);
  const baseAmount = material.packageAmount * packageUnit.toBase;
  if (!(baseAmount > 0)) {
    throw new Error(`"${material.name}" has an invalid package amount`);
  }
  return material.packageCost / baseAmount;
}

export interface LineCostResult {
  baseAmount: number;
  baseUnitLabel: BaseUnitLabel;
  costPerBaseUnit: number;
  cost: number;
}

export function calculateLineCost(material: Material, amount: number, unitId: string): LineCostResult {
  const baseAmount = toMaterialBaseAmount(material, amount, unitId);
  const costPerBaseUnit = materialCostPerBaseUnit(material);
  return {
    baseAmount,
    baseUnitLabel: materialBaseUnitLabel(material),
    costPerBaseUnit,
    cost: baseAmount * costPerBaseUnit,
  };
}

export interface RecipeLineCost {
  line: RecipeIngredientLine;
  material: Material | undefined;
  cost: number;
  error?: string;
}

export interface RecipeCostSummary {
  lines: RecipeLineCost[];
  totalCost: number;
  costPerYieldUnit: number;
  yieldAmount: number;
  yieldLabel: string;
}

export function calculateRecipeCost(recipe: Recipe, materials: Material[]): RecipeCostSummary {
  const materialsById = new Map(materials.map((m) => [m.id, m]));

  const lines: RecipeLineCost[] = recipe.ingredients.map((line) => {
    if (!line.materialId) {
      return {
        line,
        material: undefined,
        cost: 0,
        error: `No product selected for "${line.ingredientName}"`,
      };
    }
    const material = materialsById.get(line.materialId);
    if (!material) {
      return { line, material: undefined, cost: 0, error: 'Product not found' };
    }
    try {
      const { cost } = calculateLineCost(material, line.amount, line.unitId);
      return { line, material, cost };
    } catch (err) {
      return { line, material, cost: 0, error: err instanceof Error ? err.message : 'Could not calculate cost' };
    }
  });

  const totalCost = lines.reduce((sum, l) => sum + l.cost, 0);
  const costPerYieldUnit = recipe.yieldAmount > 0 ? totalCost / recipe.yieldAmount : 0;

  return { lines, totalCost, costPerYieldUnit, yieldAmount: recipe.yieldAmount, yieldLabel: recipe.yieldLabel };
}
