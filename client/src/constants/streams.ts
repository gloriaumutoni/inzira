import { PATHWAYS } from './pathways'

// Streams — the primary unit everything is matched/filtered/tagged on.
// A stream is one of the 3 top-level PATHWAYS codes. Combinations are legacy only.
export const STREAM_CODES = ['MATH_SCIENCES', 'ARTS_HUMANITIES', 'LANGUAGES'] as const
export type StreamCode = (typeof STREAM_CODES)[number]

export const STREAMS = PATHWAYS.map((p) => ({
  code: p.code as StreamCode,
  name: p.name,
  description: p.description,
}))

export const STREAM_MAP = Object.fromEntries(STREAMS.map((s) => [s.code, s])) as Record<
  StreamCode,
  { code: StreamCode; name: string; description: string }
>

export const isStreamCode = (code: string): code is StreamCode =>
  (STREAM_CODES as readonly string[]).includes(code)

// Leaf (PATH_*) -> parent stream, derived from PATHWAYS[].streams[].code.
export const leafToStream = (leafCode: string): StreamCode | undefined =>
  PATHWAYS.find((p) => p.streams?.some((s) => s.code === leafCode))?.code as StreamCode | undefined

// Legacy-only: old A-level combination -> stream. Mirrors server/src/utils/pathwayMap.ts.
// Used as a fallback when a matchable record still carries legacy combinations.
const COMBINATION_TO_STREAM: Record<string, StreamCode> = {
  PCB: 'MATH_SCIENCES', MCB: 'MATH_SCIENCES', BCG: 'MATH_SCIENCES', PCG: 'MATH_SCIENCES',
  AEG: 'MATH_SCIENCES', MPC: 'MATH_SCIENCES', PCM: 'MATH_SCIENCES', MPG: 'MATH_SCIENCES',
  MEG: 'MATH_SCIENCES', MCE: 'MATH_SCIENCES', PCE: 'MATH_SCIENCES', MPE: 'MATH_SCIENCES',
  MEd: 'MATH_SCIENCES',
  HEG: 'ARTS_HUMANITIES', HEL: 'ARTS_HUMANITIES', HGL: 'ARTS_HUMANITIES', HLP: 'ARTS_HUMANITIES',
  AGL: 'ARTS_HUMANITIES', HGK: 'ARTS_HUMANITIES', HLE: 'ARTS_HUMANITIES', MHE: 'ARTS_HUMANITIES',
  KEL: 'LANGUAGES', KGL: 'LANGUAGES', LFK: 'LANGUAGES', LKF: 'LANGUAGES', HEK: 'LANGUAGES',
  KEG: 'LANGUAGES',
}

export const combinationToStream = (combination?: string | null): StreamCode | undefined => {
  if (!combination) return undefined
  // A record may already carry a leaf code (PATH_*) or a stream code directly.
  if (isStreamCode(combination)) return combination
  return COMBINATION_TO_STREAM[combination] ?? leafToStream(combination)
}
