import { v4 as uuidv4 } from 'uuid';
import type { Material, Recipe } from './types';

const MATERIALS_KEY = 'baker-costing:materials';
const RECIPES_KEY = 'baker-costing:recipes';

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

// Materials

export type MaterialInput = Omit<Material, 'id' | 'createdAt' | 'updatedAt'>;

export function listMaterials(): Material[] {
  return readList<Material>(MATERIALS_KEY).sort((a, b) => a.name.localeCompare(b.name));
}

export function getMaterial(id: string): Material | undefined {
  return readList<Material>(MATERIALS_KEY).find((m) => m.id === id);
}

export function createMaterial(input: MaterialInput): Material {
  const now = new Date().toISOString();
  const material: Material = { ...input, id: uuidv4(), createdAt: now, updatedAt: now };
  const materials = readList<Material>(MATERIALS_KEY);
  materials.push(material);
  writeList(MATERIALS_KEY, materials);
  return material;
}

export function updateMaterial(id: string, input: MaterialInput): Material {
  const materials = readList<Material>(MATERIALS_KEY);
  const index = materials.findIndex((m) => m.id === id);
  if (index === -1) throw new Error(`Material not found: ${id}`);
  const updated: Material = { ...input, id, createdAt: materials[index].createdAt, updatedAt: new Date().toISOString() };
  materials[index] = updated;
  writeList(MATERIALS_KEY, materials);
  return updated;
}

export function deleteMaterial(id: string): void {
  writeList(
    MATERIALS_KEY,
    readList<Material>(MATERIALS_KEY).filter((m) => m.id !== id)
  );
}

// Recipes

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

export function listRecipes(): Recipe[] {
  return readList<Recipe>(RECIPES_KEY).sort((a, b) => a.name.localeCompare(b.name));
}

export function getRecipe(id: string): Recipe | undefined {
  return readList<Recipe>(RECIPES_KEY).find((r) => r.id === id);
}

export function createRecipe(input: RecipeInput): Recipe {
  const now = new Date().toISOString();
  const recipe: Recipe = { ...input, id: uuidv4(), createdAt: now, updatedAt: now };
  const recipes = readList<Recipe>(RECIPES_KEY);
  recipes.push(recipe);
  writeList(RECIPES_KEY, recipes);
  return recipe;
}

export function updateRecipe(id: string, input: RecipeInput): Recipe {
  const recipes = readList<Recipe>(RECIPES_KEY);
  const index = recipes.findIndex((r) => r.id === id);
  if (index === -1) throw new Error(`Recipe not found: ${id}`);
  const updated: Recipe = { ...input, id, createdAt: recipes[index].createdAt, updatedAt: new Date().toISOString() };
  recipes[index] = updated;
  writeList(RECIPES_KEY, recipes);
  return updated;
}

export function deleteRecipe(id: string): void {
  writeList(
    RECIPES_KEY,
    readList<Recipe>(RECIPES_KEY).filter((r) => r.id !== id)
  );
}
