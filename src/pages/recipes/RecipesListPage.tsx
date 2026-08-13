import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteRecipe, listMaterials, listRecipes } from '../../lib/storage';
import { calculateRecipeCost } from '../../lib/costing';
import type { Material, Recipe } from '../../lib/types';

export default function RecipesListPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    setLoading(true);
    Promise.all([listRecipes(), listMaterials()])
      .then(([r, m]) => {
        setRecipes(r);
        setMaterials(m);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load recipes'))
      .finally(() => setLoading(false));
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    try {
      await deleteRecipe(id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete recipe');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">Recipes</h2>
          <p className="mt-1 text-sm text-ink-2">Build recipes from your materials and see live costs.</p>
        </div>
        <Link
          to="/recipes/new"
          className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal/90"
        >
          New recipe
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-clay">{error}</p>}

      {loading ? (
        <p className="text-sm text-ink-2">Loading…</p>
      ) : recipes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-paper-2 px-6 py-12 text-center text-sm text-ink-2">
          No recipes yet. Build your first one — you can type ingredients freely and add pricing as you go.
        </div>
      ) : (
        <div className="grid gap-3">
          {recipes.map((r) => {
            const summary = calculateRecipeCost(r, materials);
            return (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-line bg-paper px-5 py-4"
              >
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">{r.name}</h3>
                  <p className="mt-0.5 text-sm text-ink-2">
                    Yields {r.yieldAmount} {r.yieldLabel} · {r.ingredients.length} ingredient
                    {r.ingredients.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-mono text-lg font-semibold text-ink">
                      ${summary.totalCost.toFixed(2)}
                    </div>
                    <div className="font-mono text-xs text-ink-2">
                      ${summary.costPerYieldUnit.toFixed(3)} / {r.yieldLabel}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Link to={`/recipes/${r.id}`} className="text-sm font-medium text-teal hover:underline">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id, r.name)}
                      className="text-sm font-medium text-clay hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
