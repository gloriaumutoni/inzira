import { COMBINATIONS, COMBINATION_MAP } from '@/constants/combinations'
import { PATHWAY_LEAVES, PATHWAY_LEAF_MAP, isPathwayCode } from '@/constants/pathways'

interface TrackedStudent {
  pathway?: string | null
  combination?: string | null
}

export const getTrackCode = (student?: TrackedStudent | null) =>
  student?.pathway ?? student?.combination ?? undefined

export const getTrackLabel = (student?: TrackedStudent | null) => {
  const code = getTrackCode(student)
  if (!code) return undefined
  return isPathwayCode(code) ? PATHWAY_LEAF_MAP[code]?.label : COMBINATION_MAP[code]?.name
}

export interface TrackOptgroupsProps {
  allLabel?: string
}

export const TrackOptgroups = ({ allLabel = 'All combinations/pathways' }: TrackOptgroupsProps) => (
  <>
    <option value="">{allLabel}</option>
    <optgroup label="A-Level Combinations (legacy)">
      {COMBINATIONS.map((c) => (
        <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
      ))}
    </optgroup>
    <optgroup label="Learning Pathways (new)">
      {PATHWAY_LEAVES.map((leaf) => (
        <option key={leaf.code} value={leaf.code}>{leaf.label}</option>
      ))}
    </optgroup>
  </>
)
