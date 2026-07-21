// Stream taxonomy — the primary unit everything is matched on.
// Rwanda is phasing out subject *combinations*; only the remaining S6 cohort still
// holds one. A "stream" is one of the 3 top-level PATHWAYS codes. Combination is
// kept only as a legacy fallback for the students who still have one.
//
// Supersedes the leaf-level logic in pathwayMap.ts as the matching unit. Leaf
// codes (PATH_*) remain a finer sub-signal only and are reused here for the
// combination->stream rollup and the STRETCH adjacency heuristic.

import { getPathwaysForCombination, type PathwayLeafCode } from './pathwayMap'

export const STREAM_CODES = ['MATH_SCIENCES', 'ARTS_HUMANITIES', 'LANGUAGES'] as const
export type StreamCode = (typeof STREAM_CODES)[number]

export const STREAM_NAMES: Record<StreamCode, string> = {
  MATH_SCIENCES: 'Mathematics & Sciences',
  ARTS_HUMANITIES: 'Arts & Humanities',
  LANGUAGES: 'Languages',
}

// Leaf (PATH_*) -> parent stream. Mirrors PATHWAYS[].streams[] in
// client/src/constants/pathways.ts: the two MS leaves roll up into MATH_SCIENCES.
const LEAF_TO_STREAM: Record<PathwayLeafCode, StreamCode> = {
  PATH_MS_NATURAL: 'MATH_SCIENCES',
  PATH_MS_APPLIED: 'MATH_SCIENCES',
  PATH_ARTS_HUMANITIES: 'ARTS_HUMANITIES',
  PATH_LANGUAGES: 'LANGUAGES',
}

export const leafToStream = (leafCode: string): StreamCode | undefined =>
  LEAF_TO_STREAM[leafCode as PathwayLeafCode]

export const isStreamCode = (code: string): code is StreamCode =>
  (STREAM_CODES as readonly string[]).includes(code)

/**
 * Legacy-only: map an old A-level combination to its stream. Used to (a) seed
 * `streamCode`/`streamCodes` from legacy combination data and (b) match the
 * remaining S6 combination students. Disappears after the transition.
 */
export const combinationToStream = (combination?: string | null): StreamCode | undefined => {
  if (!combination) return undefined
  const leaf = getPathwaysForCombination(combination)[0]
  return leaf ? LEAF_TO_STREAM[leaf] : undefined
}

/** Streams reachable from a set of legacy combinations (deduped). */
export const combinationsToStreams = (combinations: string[]): StreamCode[] => {
  const set = new Set<StreamCode>()
  for (const c of combinations) {
    const s = combinationToStream(c)
    if (s) set.add(s)
  }
  return [...set]
}

export type Reachability = 'DIRECT' | 'STRETCH' | 'NONE'

/**
 * Reachability of a career from a student, stream-first with legacy fallback.
 * DIRECT  — the career's stream includes the student's stream (or, for a
 *           remaining S6 student, the career explicitly lists their combination).
 * STRETCH — not direct, but the student's pathway leaf overlaps the career's leaf
 *           codes: reachable via one bridging requirement. Never framed as
 *           "you chose the wrong stream".
 */
export const reachabilityForStream = (params: {
  studentStream: StreamCode | null | undefined
  studentCombination: string | null | undefined
  careerStreamCodes: string[]
  careerCombinations: string[]
  careerLeafCodes: string[]
}): Reachability => {
  const { studentStream, studentCombination, careerStreamCodes, careerCombinations, careerLeafCodes } = params

  if (studentStream && careerStreamCodes.includes(studentStream)) return 'DIRECT'
  if (studentCombination && careerCombinations.includes(studentCombination)) return 'DIRECT'

  const studentLeaves = getPathwaysForCombination(studentCombination)
  if (studentLeaves.some((l) => careerLeafCodes.includes(l))) return 'STRETCH'

  return 'NONE'
}
