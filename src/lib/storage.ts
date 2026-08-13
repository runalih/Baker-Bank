import { supabase } from './supabaseClient';
import type { Material, Recipe } from './types';

export type MaterialInput = Omit<Material, 'id' | 'createdAt' | 'updatedAt'>;
export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

interface MaterialRow {
  id: string;
  ingredient_name: string;
  name: string;
  vendor: string | null;
  package_amount: number;
  package_unit_id: string;
  package_cost: number;
  density_g_per_ml: number | null;
  grams_per_each: number | null;
  created_at: string;
  updated_at: string;
}

interface RecipeRow {
  id: string;
  name: string;
  yield_amount: number;
  yield_label: string;
  notes: string | null;
  ingredients: Recipe['ingredients'];
  created_at: string;
  updated_at: string;
}

function toMaterial(row: MaterialRow): Material {
  return {
    id: row.id,
    ingredientName: row.ingredient_name,
    name: row.name,
    vendor: row.vendor ?? undefined,
    packageAmount: row.package_amount,
    packageUnitId: row.package_unit_id,
    packageCost: row.package_cost,
    densityGPerMl: row.density_g_per_ml ?? undefined,
    gramsPerEach: row.grams_per_each ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMaterialRow(input: MaterialInput) {
  return {
    ingredient_name: input.ingredientName,
    name: input.name,
    vendor: input.vendor ?? null,
    package_amount: input.packageAmount,
    package_unit_id: input.packageUnitId,
    package_cost: input.packageCost,
    density_g_per_ml: input.densityGPerMl ?? null,
    grams_per_each: input.gramsPerEach ?? null,
  };
}

function toRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    name: row.name,
    yieldAmount: row.yield_amount,
    yieldLabel: row.yield_label,
    notes: row.notes ?? undefined,
    ingredients: row.ingredients ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRecipeRow(input: RecipeInput) {
  return {
    name: input.name,
    yield_amount: input.yieldAmount,
    yield_label: input.yieldLabel,
    notes: input.notes ?? null,
    ingredients: input.ingredients,
  };
}

// Materials

export async function listMaterials(): Promise<Material[]> {
  const { data, error } = await supabase.from('materials').select('*').order('name');
  if (error) throw error;
  return (data as MaterialRow[]).map(toMaterial);
}

export async function getMaterial(id: string): Promise<Material | undefined> {
  const { data, error } = await supabase.from('materials').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toMaterial(data as MaterialRow) : undefined;
}

export async function createMaterial(input: MaterialInput): Promise<Material> {
  const { data, error } = await supabase.from('materials').insert(toMaterialRow(input)).select().single();
  if (error) throw error;
  return toMaterial(data as MaterialRow);
}

export async function updateMaterial(id: string, input: MaterialInput): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .update({ ...toMaterialRow(input), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return toMaterial(data as MaterialRow);
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw error;
}

// Recipes

export async function listRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase.from('recipes').select('*').order('name');
  if (error) throw error;
  return (data as RecipeRow[]).map(toRecipe);
}

export async function getRecipe(id: string): Promise<Recipe | undefined> {
  const { data, error } = await supabase.from('recipes').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toRecipe(data as RecipeRow) : undefined;
}

export async function createRecipe(input: RecipeInput): Promise<Recipe> {
  const { data, error } = await supabase.from('recipes').insert(toRecipeRow(input)).select().single();
  if (error) throw error;
  return toRecipe(data as RecipeRow);
}

export async function updateRecipe(id: string, input: RecipeInput): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .update({ ...toRecipeRow(input), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return toRecipe(data as RecipeRow);
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}
