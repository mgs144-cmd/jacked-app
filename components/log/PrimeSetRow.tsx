'use client'

import { ChevronDown, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { SetEntry } from './types'

type PrimeField = 'weight_beginning' | 'weight_middle' | 'weight_end' | 'reps' | 'rpe' | 'note'

const SPOTS: { field: PrimeField; label: string }[] = [
  { field: 'weight_beginning', label: 'Beginning' },
  { field: 'weight_middle', label: 'Middle' },
  { field: 'weight_end', label: 'End' },
]

export function PrimeSetRow({
  set,
  setIndex,
  onUpdate,
  onRemove,
  canRemove,
}: {
  set: SetEntry
  setIndex: number
  onUpdate: (field: PrimeField, value: string) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden">
      <div className="px-3 pt-3 pb-2 border-b border-white/5">
        <span className="label-caps">Set {setIndex + 1}</span>
        <p className="ui-meta mt-1">Log stack weight at each range spot (lb)</p>
      </div>
      <div className="p-3 space-y-2">
        {SPOTS.map(({ field, label }) => (
          <div key={field} className="flex items-center gap-2">
            <span className="label-caps w-[4.5rem] shrink-0 text-white/40">{label}</span>
            <input
              type="number"
              value={set[field] ?? ''}
              onChange={(e) => onUpdate(field, e.target.value)}
              placeholder="lb"
              min="0"
              step="2.5"
              className="input-field flex-1 min-w-0 py-2.5 text-base tabular-nums"
            />
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1">
          <span className="label-caps w-[4.5rem] shrink-0 text-white/40">Reps</span>
          <input
            type="number"
            value={set.reps}
            onChange={(e) => onUpdate('reps', e.target.value)}
            placeholder="Reps"
            min="1"
            className="input-field flex-1 min-w-0 py-2.5 text-base tabular-nums"
          />
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors shrink-0"
            title="RPE & notes"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors shrink-0"
              aria-label="Remove set"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {showAdvanced && (
        <div className="px-3 pb-3 flex flex-wrap gap-2 border-t border-white/5 pt-2">
          <select
            value={set.rpe}
            onChange={(e) => onUpdate('rpe', e.target.value)}
            className="input-field w-24 text-sm py-1.5"
            title="RPE"
          >
            <option value="">RPE</option>
            {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={set.note ?? ''}
            onChange={(e) => onUpdate('note', e.target.value)}
            placeholder="Note (optional)"
            className="input-field flex-1 min-w-[120px] text-sm py-1.5"
          />
        </div>
      )}
    </div>
  )
}
