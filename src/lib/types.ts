export interface Material {
  id: string;
  ingredientName: string; // generic ingredient category, e.g. "All-purpose flour" — links this product to recipe ingredient lines
  name: string;
  vendor?: string;
  packageAmount: number;
  packageUnitId: string; // unit id from units.ts
  packageCost: number;
  densityGPerMl?: number; // required if packageUnit is volume and recipes will reference it in weight (or vice versa)
  gramsPerEach?: number; // for count-based materials (e.g. "1 egg" = 50g), enables bridging to weight/volume
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredientLine {
  id: string;
  ingredientName: string; // generic ingredient typed in the recipe builder, e.g. "flour"
  materialId?: string; // specific material chosen to price this line; unset until resolved
  amount: number;
  unitId: string;
}

export interface Recipe {
  id: string;
  name: string;
  yieldAmount: number;
  yieldLabel: string; // e.g. "cookies", "cupcakes", "loaf"
  notes?: string;
  ingredients: RecipeIngredientLine[];
  createdAt: string;
  updatedAt: string;
}
