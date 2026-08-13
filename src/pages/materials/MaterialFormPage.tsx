import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createMaterial, getMaterial, listMaterials, updateMaterial } from '../../lib/storage';
import { materialBaseUnitLabel, materialCostPerBaseUnit } from '../../lib/costing';
import { unitById } from '../../lib/units';
import { findDensityMatch } from '../../data/densities';
import UnitSelect from '../../components/UnitSelect';
import type { Material } from '../../lib/types';

export default function MaterialFormPage() {
  const { id } = useParams();
  const [existing, setExisting] = useState<Material | null | undefined>(id ? undefined : null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setExisting(null);
      return;
    }
    setExisting(undefined);
    getMaterial(id)
      .then((m) => setExisting(m ?? null))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load material'));
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
        Material not found. <Link to="/materials" className="text-teal hover:underline">Back to materials</Link>
      </div>
    );
  }

  return <MaterialForm key={id ?? 'new'} id={id} existing={existing ?? undefined} />;
}

interface MaterialFormProps {
  id: string | undefined;
  existing: Material | undefined;
}

function MaterialForm({ id, existing }: MaterialFormProps) {
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [ingredientNameOptions, setIngredientNameOptions] = useState<string[]>([]);
  useEffect(() => {
    listMaterials()
      .then((materials) =>
        setIngredientNameOptions(Array.from(new Set(materials.map((m) => m.ingredientName))).filter(Boolean).sort())
      )
      .catch(() => setIngredientNameOptions([]));
  }, []);

  const [ingredientName, setIngredientName] = useState(existing?.ingredientName ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [vendor, setVendor] = useState(existing?.vendor ?? '');
  const [packageAmount, setPackageAmount] = useState(existing?.packageAmount.toString() ?? '');
  const [packageUnitId, setPackageUnitId] = useState(existing?.packageUnitId ?? 'g');
  const [packageCost, setPackageCost] = useState(existing?.packageCost.toString() ?? '');
  const [densityGPerMl, setDensityGPerMl] = useState(existing?.densityGPerMl?.toString() ?? '');
  const [gramsPerEach, setGramsPerEach] = useState(existing?.gramsPerEach?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const packageUnitType = unitById(packageUnitId).type;
  const densityMatch = ingredientName.trim() ? findDensityMatch(ingredientName) : undefined;

  const previewCost = (() => {
    const amount = parseFloat(packageAmount);
    const cost = parseFloat(packageCost);
    if (!(amount > 0) || !(cost >= 0)) return null;
    try {
      const previewMaterial = {
        id: 'preview',
        ingredientName,
        name,
        packageAmount: amount,
        packageUnitId,
        packageCost: cost,
        createdAt: '',
        updatedAt: '',
      };
      const perBase = materialCostPerBaseUnit(previewMaterial);
      return `$${perBase.toFixed(4)} / ${materialBaseUnitLabel(previewMaterial)}`;
    } catch {
      return null;
    }
  })();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(packageAmount);
    const cost = parseFloat(packageCost);
    if (!ingredientName.trim()) {
      setError('Ingredient is required (e.g. "All-purpose flour").');
      return;
    }
    if (!name.trim()) {
      setError('Specific product name is required.');
      return;
    }
    if (!(amount > 0)) {
      setError('Package amount must be greater than 0.');
      return;
    }
    if (!(cost >= 0)) {
      setError('Package cost must be 0 or more.');
      return;
    }

    const input = {
      ingredientName: ingredientName.trim(),
      name: name.trim(),
      vendor: vendor.trim() || undefined,
      packageAmount: amount,
      packageUnitId,
      packageCost: cost,
      densityGPerMl: densityGPerMl.trim() ? parseFloat(densityGPerMl) : undefined,
      gramsPerEach: gramsPerEach.trim() ? parseFloat(gramsPerEach) : undefined,
    };

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateMaterial(id, input);
      } else {
        await createMaterial(input);
      }
      navigate('/materials');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save material');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-2xl font-semibold text-ink">
        {isEdit ? 'Edit material' : 'Add material'}
      </h2>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <div>
          <label htmlFor="ingredientName" className="mb-1 block text-sm font-medium text-ink">
            Ingredient
          </label>
          <input
            id="ingredientName"
            type="text"
            list="ingredient-name-options"
            value={ingredientName}
            onChange={(e) => setIngredientName(e.target.value)}
            placeholder="All-purpose flour"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-saffron-deep"
          />
          <datalist id="ingredient-name-options">
            {ingredientNameOptions.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-ink-2">
            The general ingredient this product fulfills — used to match it against recipes.
          </p>
        </div>

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink">
            Specific product
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ardent Mills All-Purpose Flour"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-saffron-deep"
          />
        </div>

        <div>
          <label htmlFor="vendor" className="mb-1 block text-sm font-medium text-ink">
            Vendor <span className="text-ink-2">(optional)</span>
          </label>
          <input
            id="vendor"
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Costco"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-saffron-deep"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="packageAmount" className="mb-1 block text-sm font-medium text-ink">
              Package amount
            </label>
            <input
              id="packageAmount"
              type="number"
              step="any"
              min="0"
              value={packageAmount}
              onChange={(e) => setPackageAmount(e.target.value)}
              placeholder="25"
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-saffron-deep"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="packageUnit" className="mb-1 block text-sm font-medium text-ink">
              Unit
            </label>
            <UnitSelect
              id="packageUnit"
              value={packageUnitId}
              onChange={setPackageUnitId}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-saffron-deep"
            />
          </div>
        </div>

        <div>
          <label htmlFor="packageCost" className="mb-1 block text-sm font-medium text-ink">
            Package cost ($)
          </label>
          <input
            id="packageCost"
            type="number"
            step="any"
            min="0"
            value={packageCost}
            onChange={(e) => setPackageCost(e.target.value)}
            placeholder="18.99"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-saffron-deep"
          />
        </div>

        {previewCost && (
          <div className="rounded-md bg-teal-light px-3 py-2 text-sm text-teal">
            Unit cost: <span className="font-mono">{previewCost}</span>
          </div>
        )}

        <div>
          <label htmlFor="density" className="mb-1 block text-sm font-medium text-ink">
            Density (g/mL) <span className="text-ink-2">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="density"
              type="number"
              step="any"
              min="0"
              value={densityGPerMl}
              onChange={(e) => setDensityGPerMl(e.target.value)}
              placeholder="0.529"
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-saffron-deep"
            />
            {densityMatch && (
              <button
                type="button"
                onClick={() => setDensityGPerMl(densityMatch.densityGPerMl.toString())}
                className="shrink-0 rounded-md border border-line-strong px-3 py-2 text-xs font-medium text-ink-2 hover:bg-paper-2"
              >
                Use {densityMatch.name}: {densityMatch.densityGPerMl} g/mL
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-2">
            Needed to convert between weight and volume in recipes
            {packageUnitType === 'volume' ? ' — this package is measured by volume.' : '.'}
          </p>
        </div>

        <div>
          <label htmlFor="gramsPerEach" className="mb-1 block text-sm font-medium text-ink">
            Grams per each <span className="text-ink-2">(optional)</span>
          </label>
          <input
            id="gramsPerEach"
            type="number"
            step="any"
            min="0"
            value={gramsPerEach}
            onChange={(e) => setGramsPerEach(e.target.value)}
            placeholder="50"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-saffron-deep"
          />
          <p className="mt-1 text-xs text-ink-2">
            e.g. 1 egg ≈ 50g. Needed to convert to/from a count unit
            {packageUnitType === 'count' ? ' — this package is measured by count.' : '.'}
          </p>
        </div>

        {error && <p className="text-sm text-clay">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal/90 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add material'}
          </button>
          <Link
            to="/materials"
            className="rounded-md border border-line-strong px-4 py-2 text-sm font-medium text-ink-2 hover:bg-paper-2"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
