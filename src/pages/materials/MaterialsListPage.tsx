import { useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteMaterial, listMaterials } from '../../lib/storage';
import { materialBaseUnitLabel, materialCostPerBaseUnit } from '../../lib/costing';
import { unitById } from '../../lib/units';

export default function MaterialsListPage() {
  const [materials, setMaterials] = useState(() => listMaterials());

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    deleteMaterial(id);
    setMaterials(listMaterials());
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">Materials</h2>
          <p className="mt-1 text-sm text-ink-2">Ingredients and supplies, priced per package.</p>
        </div>
        <Link
          to="/materials/new"
          className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal/90"
        >
          Add material
        </Link>
      </div>

      {materials.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-paper-2 px-6 py-12 text-center text-sm text-ink-2">
          No materials yet. Add flour, sugar, butter, or anything else you buy by weight, volume, or
          count.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-2 text-left text-xs uppercase tracking-wide text-ink-2">
                <th className="px-4 py-3 font-medium">Ingredient</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Package</th>
                <th className="px-4 py-3 font-medium">Cost</th>
                <th className="px-4 py-3 font-medium">Unit cost</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => {
                const packageUnit = unitById(m.packageUnitId);
                let unitCostLabel = '—';
                try {
                  const cost = materialCostPerBaseUnit(m);
                  unitCostLabel = `$${cost.toFixed(4)} / ${materialBaseUnitLabel(m)}`;
                } catch {
                  unitCostLabel = '—';
                }
                return (
                  <tr key={m.id} className="border-b border-line last:border-b-0 hover:bg-paper-2">
                    <td className="px-4 py-3 font-medium text-ink">{m.ingredientName}</td>
                    <td className="px-4 py-3">
                      <div className="text-ink">{m.name}</div>
                      {m.vendor && <div className="text-xs text-ink-2">{m.vendor}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink-2">
                      {m.packageAmount} {packageUnit.label}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink">${m.packageCost.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-ink-2">{unitCostLabel}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/materials/${m.id}`}
                        className="mr-3 text-sm font-medium text-teal hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id, m.name)}
                        className="text-sm font-medium text-clay hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
