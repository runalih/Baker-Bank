import { useState } from 'react';
import type { MaterialInput } from '../lib/storage';
import { findDensityMatch } from '../data/densities';
import UnitSelect from './UnitSelect';

interface Draft {
  name: string;
  vendor: string;
  packageAmount: string;
  packageUnitId: string;
  packageCost: string;
  densityGPerMl: string;
  gramsPerEach: string;
}

function emptyDraft(defaultUnitId: string): Draft {
  return {
    name: '',
    vendor: '',
    packageAmount: '',
    packageUnitId: defaultUnitId,
    packageCost: '',
    densityGPerMl: '',
    gramsPerEach: '',
  };
}

interface ResolveIngredientsModalProps {
  ingredientNames: string[];
  defaultUnitIds?: Record<string, string>;
  onCancel: () => void;
  onConfirm: (materials: Record<string, MaterialInput>) => void;
}

export default function ResolveIngredientsModal({
  ingredientNames,
  defaultUnitIds,
  onCancel,
  onConfirm,
}: ResolveIngredientsModalProps) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(ingredientNames.map((n) => [n, emptyDraft(defaultUnitIds?.[n] ?? 'g')]))
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateDraft(ingredientName: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [ingredientName]: { ...prev[ingredientName], ...patch } }));
  }

  function handleConfirm() {
    const nextErrors: Record<string, string> = {};
    const materials: Record<string, MaterialInput> = {};

    for (const ingredientName of ingredientNames) {
      const draft = drafts[ingredientName];
      const isBlank = !draft.name.trim() && !draft.packageAmount.trim() && !draft.packageCost.trim();
      if (isBlank) continue;

      const amount = parseFloat(draft.packageAmount);
      const cost = parseFloat(draft.packageCost);
      if (!draft.name.trim()) {
        nextErrors[ingredientName] = 'Product name is required.';
        continue;
      }
      if (!(amount > 0)) {
        nextErrors[ingredientName] = 'Package amount must be greater than 0.';
        continue;
      }
      if (!(cost >= 0)) {
        nextErrors[ingredientName] = 'Package cost must be 0 or more.';
        continue;
      }
      materials[ingredientName] = {
        ingredientName,
        name: draft.name.trim(),
        vendor: draft.vendor.trim() || undefined,
        packageAmount: amount,
        packageUnitId: draft.packageUnitId,
        packageCost: cost,
        densityGPerMl: draft.densityGPerMl.trim() ? parseFloat(draft.densityGPerMl) : undefined,
        gramsPerEach: draft.gramsPerEach.trim() ? parseFloat(draft.gramsPerEach) : undefined,
      };
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onConfirm(materials);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-8">
      <div className="flex max-h-full w-full max-w-2xl flex-col rounded-lg border border-line bg-paper shadow-xl">
        <div className="border-b border-line px-6 py-4">
          <h3 className="font-display text-xl font-semibold text-ink">Add pricing</h3>
          <p className="mt-1 text-sm text-ink-2">
            These ingredients aren&apos;t in your materials yet. Add the specific product you buy for the ones
            you want costed — leave a card blank to skip it for now.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-6">
            {ingredientNames.map((ingredientName) => {
              const draft = drafts[ingredientName];
              const densityMatch = findDensityMatch(ingredientName);
              return (
                <div key={ingredientName} className="rounded-lg border border-line-strong p-4">
                  <h4 className="mb-3 font-display text-base font-semibold text-ink">{ingredientName}</h4>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ink">Specific product</label>
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(e) => updateDraft(ingredientName, { name: e.target.value })}
                          placeholder="Ardent Mills All-Purpose Flour"
                          className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink focus:border-saffron-deep"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ink">
                          Vendor <span className="text-ink-2">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={draft.vendor}
                          onChange={(e) => updateDraft(ingredientName, { vendor: e.target.value })}
                          placeholder="Costco"
                          className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink focus:border-saffron-deep"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ink">Package amount</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={draft.packageAmount}
                          onChange={(e) => updateDraft(ingredientName, { packageAmount: e.target.value })}
                          placeholder="25"
                          className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink focus:border-saffron-deep"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ink">Unit</label>
                        <UnitSelect
                          value={draft.packageUnitId}
                          onChange={(unitId) => updateDraft(ingredientName, { packageUnitId: unitId })}
                          className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink focus:border-saffron-deep"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-ink">Package cost ($)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={draft.packageCost}
                        onChange={(e) => updateDraft(ingredientName, { packageCost: e.target.value })}
                        placeholder="18.99"
                        className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink focus:border-saffron-deep"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ink">
                          Density (g/mL) <span className="text-ink-2">(optional)</span>
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={draft.densityGPerMl}
                          onChange={(e) => updateDraft(ingredientName, { densityGPerMl: e.target.value })}
                          placeholder="0.529"
                          className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink focus:border-saffron-deep"
                        />
                        {densityMatch && (
                          <button
                            type="button"
                            onClick={() =>
                              updateDraft(ingredientName, { densityGPerMl: densityMatch.densityGPerMl.toString() })
                            }
                            className="mt-1 rounded-md border border-line-strong px-2 py-1 text-xs font-medium text-ink-2 hover:bg-paper-2"
                          >
                            Use {densityMatch.name}: {densityMatch.densityGPerMl} g/mL
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ink">
                          Grams per each <span className="text-ink-2">(optional)</span>
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={draft.gramsPerEach}
                          onChange={(e) => updateDraft(ingredientName, { gramsPerEach: e.target.value })}
                          placeholder="50"
                          className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink focus:border-saffron-deep"
                        />
                      </div>
                    </div>

                    {errors[ingredientName] && <p className="text-xs text-clay">{errors[ingredientName]}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-line-strong px-4 py-2 text-sm font-medium text-ink-2 hover:bg-paper-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal/90"
          >
            Save pricing
          </button>
        </div>
      </div>
    </div>
  );
}
