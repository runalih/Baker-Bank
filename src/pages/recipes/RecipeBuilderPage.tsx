import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { MaterialInput, RecipeInput } from '../../lib/storage';
import { createMaterial, createRecipe, getRecipe, listMaterials, updateRecipe } from '../../lib/storage';
import { calculateRecipeCost } from '../../lib/costing';
import type { Material, Recipe, RecipeIngredientLine } from '../../lib/types';
import { unitById } from '../../lib/units';
import UnitSelect from '../../components/UnitSelect';
import ResolveIngredientsModal from '../../components/ResolveIngredientsModal';
import { useAutosave } from '../../lib/useAutosave';

function baseUnitIdForLineUnit(unitId: string): string {
  const type = unitById(unitId).type;
  if (type === 'weight') return 'g';
  if (type === 'volume') return 'ml';
  return 'each';
}

export default function RecipeBuilderPage() {
  const { id } = useParams();
  const [existing, setExisting] = useState<Recipe | null | undefined>(id ? undefined : null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setExisting(null);
      return;
    }
    setExisting(undefined);
    getRecipe(id)
      .then((r) => setExisting(r ?? null))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load recipe'));
  }, [id]);

  if (loadError) {
    return <p className="text-sm text-clay">{loadError}</p>;
  }

  if (existing === undefined) {
    return <p className="text-sm text-ink-2">Loading…</p>;
  }

  if (id && !existing) {
    return (
      <div className="text-sm text-ink-2">
        Recipe not found. <Link to="/recipes" className="text-teal hover:underline">Back to recipes</Link>
      </div>
    );
  }

  return <RecipeBuilder key={id ?? 'new'} id={id} existing={existing ?? undefined} />;
}

interface RecipeBuilderProps {
  id: string | undefined;
  existing: Recipe | undefined;
}

function RecipeBuilder({ id, existing }: RecipeBuilderProps) {
  const navigate = useNavigate();
  const [recordId, setRecordId] = useState<string | undefined>(id);
  const isEdit = Boolean(recordId);
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    listMaterials()
      .then(setMaterials)
      .catch(() => setMaterials([]));
  }, []);

  const [name, setName] = useState(existing?.name ?? '');
  const [yieldAmount, setYieldAmount] = useState(existing?.yieldAmount.toString() ?? '1');
  const [yieldLabel, setYieldLabel] = useState(existing?.yieldLabel ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [ingredients, setIngredients] = useState<RecipeIngredientLine[]>(
    () => (existing?.ingredients ?? []).map((line) => ({ ...line, ingredientName: line.ingredientName ?? '' }))
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resolveNames, setResolveNames] = useState<string[] | null>(null);
  const [resolveDefaultUnits, setResolveDefaultUnits] = useState<Record<string, string>>({});

  const ingredientNameOptions = useMemo(
    () => Array.from(new Set(materials.map((m) => m.ingredientName))).filter(Boolean).sort(),
    [materials]
  );

  const draftRecipe = {
    id: existing?.id ?? 'draft',
    name,
    yieldAmount: parseFloat(yieldAmount) || 0,
    yieldLabel,
    notes,
    ingredients,
    createdAt: existing?.createdAt ?? '',
    updatedAt: existing?.updatedAt ?? '',
  };
  const summary = calculateRecipeCost(draftRecipe, materials);
  const unresolvedCount = ingredients.filter((l) => l.ingredientName.trim() && !l.materialId).length;

  function addIngredient() {
    setIngredients((prev) => [...prev, { id: uuidv4(), ingredientName: '', materialId: undefined, amount: 0, unitId: 'g' }]);
  }

  function updateIngredient(lineId: string, patch: Partial<RecipeIngredientLine>) {
    setIngredients((prev) => prev.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  }

  function removeIngredient(lineId: string) {
    setIngredients((prev) => prev.filter((line) => line.id !== lineId));
  }

  function openResolveModalForNames(names: string[]) {
    const defaultUnits: Record<string, string> = {};
    for (const targetName of names) {
      const key = targetName.trim().toLowerCase();
      const line = ingredients.find((l) => !l.materialId && l.ingredientName.trim().toLowerCase() === key);
      if (line) defaultUnits[targetName] = baseUnitIdForLineUnit(line.unitId);
    }
    setResolveDefaultUnits(defaultUnits);
    setResolveNames(names);
  }

  function openResolveModalForAllUnresolved() {
    const unresolved = new Map<string, string>();
    for (const line of ingredients) {
      if (line.materialId || !line.ingredientName.trim()) continue;
      const key = line.ingredientName.trim().toLowerCase();
      if (!unresolved.has(key)) unresolved.set(key, line.ingredientName.trim());
    }
    if (unresolved.size === 0) return;
    openResolveModalForNames(Array.from(unresolved.values()));
  }

  function buildInput(): RecipeInput | null {
    const yieldNum = parseFloat(yieldAmount);
    if (!name.trim() || !(yieldNum > 0) || !yieldLabel.trim()) return null;
    if (ingredients.some((line) => !line.ingredientName.trim())) return null;
    return {
      name: name.trim(),
      yieldAmount: yieldNum,
      yieldLabel: yieldLabel.trim(),
      notes: notes.trim() || undefined,
      ingredients,
    };
  }

  async function persist(input: RecipeInput) {
    if (recordId) {
      await updateRecipe(recordId, input);
    } else {
      const created = await createRecipe(input);
      setRecordId(created.id);
      window.history.replaceState(null, '', `/recipes/${created.id}`);
    }
  }

  const autosaveInput = buildInput();
  const { status: saveStatus, error: saveError, flush } = useAutosave(autosaveInput, {
    enabled: autosaveInput != null,
    onSave: (input) => persist(input!),
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!(parseFloat(yieldAmount) > 0)) {
      setError('Yield amount must be greater than 0.');
      return;
    }
    if (!yieldLabel.trim()) {
      setError('Yield unit is required (e.g. "cookies", "loaf").');
      return;
    }
    if (ingredients.some((line) => !line.ingredientName.trim())) {
      setError('Every ingredient needs a name.');
      return;
    }

    setSubmitting(true);
    try {
      await flush();
      navigate('/recipes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save recipe');
      setSubmitting(false);
    }
  }

  async function handleResolveConfirm(newMaterials: Record<string, MaterialInput>) {
    try {
      const createdIdByKey = new Map<string, string>();
      for (const [ingredientName, materialInput] of Object.entries(newMaterials)) {
        const created = await createMaterial(materialInput);
        createdIdByKey.set(ingredientName.trim().toLowerCase(), created.id);
      }
      if (createdIdByKey.size > 0) {
        setMaterials(await listMaterials());
        setIngredients((prev) =>
          prev.map((line) =>
            line.materialId ? line : { ...line, materialId: createdIdByKey.get(line.ingredientName.trim().toLowerCase()) }
          )
        );
      }
      setResolveNames(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save product');
      setResolveNames(null);
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-ink">
          {isEdit ? 'Edit recipe' : 'New recipe'}
        </h2>
        <span className="text-xs text-ink-2">
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && <span className="text-clay">Not saved: {saveError}</span>}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-3 sm:col-span-1">
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink">
              Recipe name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cardamom shortbread"
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-saffron-deep"
            />
          </div>
          <div>
            <label htmlFor="yieldAmount" className="mb-1 block text-sm font-medium text-ink">
              Yield amount
            </label>
            <input
              id="yieldAmount"
              type="number"
              step="any"
              min="0"
              value={yieldAmount}
              onChange={(e) => setYieldAmount(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-saffron-deep"
            />
          </div>
          <div>
            <label htmlFor="yieldLabel" className="mb-1 block text-sm font-medium text-ink">
              Yield unit
            </label>
            <input
              id="yieldLabel"
              type="text"
              value={yieldLabel}
              onChange={(e) => setYieldLabel(e.target.value)}
              placeholder="cookies"
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-saffron-deep"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-ink">
            Notes <span className="text-ink-2">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-saffron-deep"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-ink">Ingredients</h3>
            <button
              type="button"
              onClick={addIngredient}
              className="rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-paper-2"
            >
              Add ingredient
            </button>
          </div>

          <datalist id="ingredient-name-options">
            {ingredientNameOptions.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>

          {ingredients.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-strong bg-paper-2 px-4 py-8 text-center text-sm text-ink-2">
              No ingredients yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line bg-paper-2 text-left text-xs uppercase tracking-wide text-ink-2">
                    <th className="px-3 py-2 font-medium">Ingredient</th>
                    <th className="px-3 py-2 font-medium">Product</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Unit</th>
                    <th className="px-3 py-2 font-medium text-right">Cost</th>
                    <th className="px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((line) => {
                    const lineCost = summary.lines.find((l) => l.line.id === line.id);
                    return (
                      <tr key={line.id} className="border-b border-line last:border-b-0">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            list="ingredient-name-options"
                            value={line.ingredientName}
                            onChange={(e) => updateIngredient(line.id, { ingredientName: e.target.value })}
                            placeholder="e.g. All-purpose flour"
                            className="w-40 rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink focus:border-saffron-deep"
                          />
                        </td>
                        <td className="px-3 py-2">
                          {line.ingredientName.trim() ? (
                            <select
                              value={line.materialId ?? ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '__add_product__') {
                                  openResolveModalForNames([line.ingredientName.trim()]);
                                  return;
                                }
                                updateIngredient(line.id, { materialId: value || undefined });
                              }}
                              className="w-56 rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink focus:border-saffron-deep"
                            >
                              <option value="">Choose a product…</option>
                              {materials.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.ingredientName}: {m.name}
                                  {m.vendor ? ` — ${m.vendor}` : ''}
                                </option>
                              ))}
                              <option value="__add_product__">+ Add product…</option>
                            </select>
                          ) : (
                            <span className="block w-40 text-xs italic text-ink-2">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={line.amount || ''}
                            onChange={(e) =>
                              updateIngredient(line.id, { amount: parseFloat(e.target.value) || 0 })
                            }
                            className="w-24 rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink focus:border-saffron-deep"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <UnitSelect
                            value={line.unitId}
                            onChange={(unitId) => updateIngredient(line.id, { unitId })}
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {!line.materialId ? (
                            <span className="text-xs italic text-ink-2">not priced</span>
                          ) : lineCost?.error ? (
                            <span className="text-xs text-clay" title={lineCost.error}>
                              error
                            </span>
                          ) : (
                            <span className="text-ink">${lineCost?.cost.toFixed(3) ?? '0.000'}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeIngredient(line.id)}
                            className="whitespace-nowrap text-xs font-medium text-clay hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {unresolvedCount > 0 && (
            <div className="mt-2 flex items-center justify-between rounded-md bg-paper-2 px-3 py-2 text-xs text-ink-2">
              <span>
                {unresolvedCount} ingredient{unresolvedCount === 1 ? '' : 's'} without a priced product yet — the
                recipe will save fine, but won&apos;t be fully costed until you add one.
              </span>
              <button
                type="button"
                onClick={openResolveModalForAllUnresolved}
                className="ml-3 shrink-0 font-medium text-teal hover:underline"
              >
                Add pricing
              </button>
            </div>
          )}

          {summary.lines.some((l) => l.line.materialId && l.error) && (
            <ul className="mt-2 list-inside list-disc text-xs text-clay">
              {summary.lines
                .filter((l) => l.line.materialId && l.error)
                .map((l) => (
                  <li key={l.line.id}>
                    {l.material?.name ?? l.line.ingredientName}: {l.error}
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg bg-teal-light px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-teal">Total cost</div>
            <div className="font-mono text-2xl font-semibold text-teal">
              ${summary.totalCost.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-teal">Per {yieldLabel || 'unit'}</div>
            <div className="font-mono text-lg font-medium text-teal">
              ${summary.costPerYieldUnit.toFixed(3)}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-clay">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal/90 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create recipe'}
          </button>
          <Link
            to="/recipes"
            className="rounded-md border border-line-strong px-4 py-2 text-sm font-medium text-ink-2 hover:bg-paper-2"
          >
            Cancel
          </Link>
        </div>
      </form>

      {resolveNames && (
        <ResolveIngredientsModal
          ingredientNames={resolveNames}
          defaultUnitIds={resolveDefaultUnits}
          onCancel={() => setResolveNames(null)}
          onConfirm={handleResolveConfirm}
        />
      )}
    </div>
  );
}
