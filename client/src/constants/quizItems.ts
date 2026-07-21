// Pathway-quiz item bank. Editable without touching component logic.
// Each item weights the 4 pathway leaf codes; the quiz sums weight × answer (1–5)
// per leaf, then rolls the top leaf up to a stream (leafToStream) on save.
//
// Two blocks: `interest` (RIASEC-style) and `aptitude` (self-rated ability).

export type PathwayLeafCode =
  | 'PATH_MS_NATURAL'
  | 'PATH_MS_APPLIED'
  | 'PATH_ARTS_HUMANITIES'
  | 'PATH_LANGUAGES'

export type QuizBlock = 'interest' | 'aptitude'

export interface QuizItem {
  id: string
  prompt: string
  block: QuizBlock
  dimension: string // RIASEC letter or aptitude label — shown in the "why" panel
  weights: Partial<Record<PathwayLeafCode, number>>
}

export const QUIZ_ITEMS: QuizItem[] = [
  // --- Interests (RIASEC) ---
  {
    id: 'r1',
    prompt: 'I enjoy building, fixing, or working with tools and machines.',
    block: 'interest',
    dimension: 'Realistic',
    weights: { PATH_MS_NATURAL: 2, PATH_MS_APPLIED: 1 },
  },
  {
    id: 'i1',
    prompt: 'I like investigating how things work and solving science problems.',
    block: 'interest',
    dimension: 'Investigative',
    weights: { PATH_MS_NATURAL: 2, PATH_MS_APPLIED: 1 },
  },
  {
    id: 'i2',
    prompt: 'I enjoy Biology or the life sciences.',
    block: 'interest',
    dimension: 'Investigative',
    weights: { PATH_MS_NATURAL: 2 },
  },
  {
    id: 'i3',
    prompt: 'I enjoy Physics or Chemistry.',
    block: 'interest',
    dimension: 'Investigative',
    weights: { PATH_MS_NATURAL: 2, PATH_MS_APPLIED: 1 },
  },
  {
    id: 'a1',
    prompt: 'I like expressing ideas through writing, art, or performance.',
    block: 'interest',
    dimension: 'Artistic',
    weights: { PATH_ARTS_HUMANITIES: 2, PATH_LANGUAGES: 1 },
  },
  {
    id: 's1',
    prompt: 'I enjoy helping, teaching, or caring for other people.',
    block: 'interest',
    dimension: 'Social',
    weights: { PATH_ARTS_HUMANITIES: 2, PATH_MS_NATURAL: 1 },
  },
  {
    id: 's2',
    prompt: 'I like understanding society, history, and how communities work.',
    block: 'interest',
    dimension: 'Social',
    weights: { PATH_ARTS_HUMANITIES: 2 },
  },
  {
    id: 'e1',
    prompt: 'I like leading, persuading, or running a project or business.',
    block: 'interest',
    dimension: 'Enterprising',
    weights: { PATH_MS_APPLIED: 2, PATH_ARTS_HUMANITIES: 1 },
  },
  {
    id: 'e2',
    prompt: 'I am interested in business, economics, or finance.',
    block: 'interest',
    dimension: 'Enterprising',
    weights: { PATH_MS_APPLIED: 2 },
  },
  {
    id: 'c1',
    prompt: 'I like working with numbers, data, and organised information.',
    block: 'interest',
    dimension: 'Conventional',
    weights: { PATH_MS_APPLIED: 2, PATH_MS_NATURAL: 1 },
  },
  {
    id: 'l1',
    prompt: 'I enjoy languages, translation, and communication.',
    block: 'interest',
    dimension: 'Artistic',
    weights: { PATH_LANGUAGES: 2, PATH_ARTS_HUMANITIES: 1 },
  },
  {
    id: 'l2',
    prompt: 'I would like a career connecting with people across cultures and countries.',
    block: 'interest',
    dimension: 'Social',
    weights: { PATH_LANGUAGES: 2, PATH_ARTS_HUMANITIES: 1 },
  },
  // --- Self-rated aptitude ---
  {
    id: 'ap1',
    prompt: 'I solve maths problems faster than most of my classmates.',
    block: 'aptitude',
    dimension: 'Numerical',
    weights: { PATH_MS_APPLIED: 2, PATH_MS_NATURAL: 1 },
  },
  {
    id: 'ap2',
    prompt: 'I remember scientific facts and processes easily.',
    block: 'aptitude',
    dimension: 'Scientific',
    weights: { PATH_MS_NATURAL: 2 },
  },
  {
    id: 'ap3',
    prompt: 'I write essays and structured arguments more easily than most.',
    block: 'aptitude',
    dimension: 'Verbal',
    weights: { PATH_ARTS_HUMANITIES: 2, PATH_LANGUAGES: 1 },
  },
  {
    id: 'ap4',
    prompt: 'I pick up new languages quickly.',
    block: 'aptitude',
    dimension: 'Linguistic',
    weights: { PATH_LANGUAGES: 2 },
  },
  {
    id: 'ap5',
    prompt: 'I am good at reading charts, statistics, and spotting trends.',
    block: 'aptitude',
    dimension: 'Analytical',
    weights: { PATH_MS_APPLIED: 2 },
  },
  {
    id: 'ap6',
    prompt: 'I am strong at debating and explaining ideas to others.',
    block: 'aptitude',
    dimension: 'Verbal',
    weights: { PATH_ARTS_HUMANITIES: 2, PATH_LANGUAGES: 1 },
  },
]
