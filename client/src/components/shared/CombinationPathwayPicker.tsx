import { COMBINATIONS } from '@/constants/combinations'
import { PATHWAY_LEAVES } from '@/constants/pathways'

type Section = 'legacy' | 'pathway'

interface CombinationPathwayPickerProps {
  value: string[]
  onChange: (codes: string[]) => void
  mode: 'single' | 'multi'
  sections?: Section[]
  required?: boolean
}

function Pill({
  code,
  label,
  selected,
  onClick,
}: {
  code: string
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      key={code}
      type="button"
      onClick={onClick}
      className={[
        'text-xs px-3 py-1 rounded-full border font-medium transition-colors',
        selected
          ? 'bg-primary text-white border-primary'
          : 'bg-background border-border text-muted hover:border-primary hover:text-foreground',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export function CombinationPathwayPicker({
  value,
  onChange,
  mode,
  sections = ['legacy', 'pathway'],
  required = false,
}: CombinationPathwayPickerProps) {
  const pick = (code: string) => {
    if (mode === 'single') {
      if (value.includes(code)) return
      onChange([code])
      return
    }
    onChange(
      value.includes(code) ? value.filter((c) => c !== code) : [...value, code]
    )
  }

  return (
    <div className="space-y-4">
      {sections.includes('legacy') && (
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
            A-Level Combinations{required && <span className="text-error"> *</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {COMBINATIONS.map((c) => (
              <Pill
                key={c.code}
                code={c.code}
                label={c.code}
                selected={value.includes(c.code)}
                onClick={() => pick(c.code)}
              />
            ))}
          </div>
        </div>
      )}

      {sections.includes('pathway') && (
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
            Streams{required && <span className="text-error"> *</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {PATHWAY_LEAVES.map((leaf) => (
              <Pill
                key={leaf.code}
                code={leaf.code}
                label={leaf.label}
                selected={value.includes(leaf.code)}
                onClick={() => pick(leaf.code)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
