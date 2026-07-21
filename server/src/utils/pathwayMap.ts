// Combination -> pathway-leaf mapping.
// Mirrors the fixed taxonomy in client/src/constants/pathways.ts (4 leaf codes).
// Used by career reachability (P1), pathway supply (P2) and coverage/seed (P5).
// Keep leaf codes in sync with the client PATHWAY_LEAVES.

export const PATHWAY_LEAF_CODES = [
  'PATH_MS_NATURAL',
  'PATH_MS_APPLIED',
  'PATH_ARTS_HUMANITIES',
  'PATH_LANGUAGES',
] as const

export type PathwayLeafCode = (typeof PATHWAY_LEAF_CODES)[number]

export const PATHWAY_LABELS: Record<string, string> = {
  PATH_MS_NATURAL: 'Mathematics & Sciences — Natural Sciences',
  PATH_MS_APPLIED: 'Mathematics & Sciences — Mathematical & Applied Sciences',
  PATH_ARTS_HUMANITIES: 'Arts & Humanities',
  PATH_LANGUAGES: 'Languages',
}

// Every Rwanda A-level combination code seen in the product (client constants +
// seed data) mapped to its primary pathway leaf. Judgement call where a combo
// straddles two leaves — assigned by the dominant subject group.
const COMBINATION_TO_PATHWAY: Record<string, PathwayLeafCode> = {
  // Natural sciences (biology/chemistry, health & agriculture)
  PCB: 'PATH_MS_NATURAL',
  MCB: 'PATH_MS_NATURAL',
  BCG: 'PATH_MS_NATURAL',
  PCG: 'PATH_MS_NATURAL',
  AEG: 'PATH_MS_NATURAL',
  // Mathematical & applied sciences (physics/maths/economics/geography/CS)
  MPC: 'PATH_MS_APPLIED',
  PCM: 'PATH_MS_APPLIED',
  MPG: 'PATH_MS_APPLIED',
  MEG: 'PATH_MS_APPLIED',
  MCE: 'PATH_MS_APPLIED',
  // Arts & humanities (history/economics/geography/literature/psychology)
  HEG: 'PATH_ARTS_HUMANITIES',
  HEL: 'PATH_ARTS_HUMANITIES',
  HGL: 'PATH_ARTS_HUMANITIES',
  HLP: 'PATH_ARTS_HUMANITIES',
  // Languages
  KEL: 'PATH_LANGUAGES',
  KGL: 'PATH_LANGUAGES',
  LFK: 'PATH_LANGUAGES',
  LKF: 'PATH_LANGUAGES',
  HEK: 'PATH_LANGUAGES',
  // Non-standard legacy codes seen in existing career/story data — classified by
  // dominant subject group so they still roll up to a stream (never left untagged).
  PCE: 'PATH_MS_APPLIED',
  MPE: 'PATH_MS_APPLIED',
  MEd: 'PATH_MS_APPLIED',
  AGL: 'PATH_ARTS_HUMANITIES',
  HGK: 'PATH_ARTS_HUMANITIES',
  HLE: 'PATH_ARTS_HUMANITIES',
  MHE: 'PATH_ARTS_HUMANITIES',
  KEG: 'PATH_LANGUAGES',
}

export const VALID_COMBINATION_CODES = Object.keys(COMBINATION_TO_PATHWAY)

/**
 * Guards against a UI writing the full display label (e.g.
 * "PCB — Physics, Chemistry, Biology") into a combination field instead of
 * the code ("PCB"). Strips a trailing " — ..." label suffix, then rejects
 * anything that still isn't a known combination code.
 */
export const normalizeCombinationCode = (value: string): string => {
  const code = value.split(' — ')[0].trim().toUpperCase()
  if (!VALID_COMBINATION_CODES.includes(code)) {
    throw new Error(`Invalid combination code: "${value}"`)
  }
  return code
}

/** Leaf pathway codes a combination maps to (currently one primary leaf each). */
export const getPathwaysForCombination = (combination?: string | null): PathwayLeafCode[] => {
  if (!combination) return []
  const leaf = COMBINATION_TO_PATHWAY[combination]
  return leaf ? [leaf] : []
}

/** Leaf pathway codes reachable from any of a set of combinations. */
export const getPathwaysForCombinations = (combinations: string[]): PathwayLeafCode[] => {
  const set = new Set<PathwayLeafCode>()
  for (const c of combinations) {
    for (const p of getPathwaysForCombination(c)) set.add(p)
  }
  return [...set]
}

export type Reachability = 'DIRECT' | 'STRETCH' | 'NONE'

/**
 * Reachability of a career from a student's combination.
 * DIRECT  — the career explicitly lists the student's combination.
 * STRETCH — not direct, but the career shares a pathway leaf with the student's
 *           combination (reachable via one bridging requirement). Never framed
 *           as "you chose the wrong combination".
 */
export const reachabilityFor = (
  studentCombination: string | null | undefined,
  careerCombinations: string[],
  careerPathwayCodes: string[],
): Reachability => {
  if (!studentCombination) return 'NONE'
  if (careerCombinations.includes(studentCombination)) return 'DIRECT'

  const studentPaths = getPathwaysForCombination(studentCombination)
  const careerPaths =
    careerPathwayCodes.length > 0
      ? careerPathwayCodes
      : getPathwaysForCombinations(careerCombinations)

  return studentPaths.some((p) => careerPaths.includes(p)) ? 'STRETCH' : 'NONE'
}
