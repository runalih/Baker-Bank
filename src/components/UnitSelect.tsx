import { unitsByType } from '../lib/units';

interface UnitSelectProps {
  value: string;
  onChange: (unitId: string) => void;
  id?: string;
  className?: string;
}

const GROUPS: Array<{ label: string; type: 'weight' | 'volume' | 'count' }> = [
  { label: 'Weight', type: 'weight' },
  { label: 'Volume', type: 'volume' },
  { label: 'Count', type: 'count' },
];

export default function UnitSelect({ value, onChange, id, className }: UnitSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ??
        'rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink focus:border-saffron-deep'
      }
    >
      {GROUPS.map((group) => (
        <optgroup key={group.type} label={group.label}>
          {unitsByType(group.type).map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
