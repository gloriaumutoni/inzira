export interface PathwayLeaf {
  code: string
  pathwayName: string
  streamName?: string
  label: string
  description: string
  subjects: string[]
  careerAreas: string[]
}

// Rwanda's fixed pathway taxonomy: 3 pathways, 4 leaf streams
// Used by the pathway quiz and any component needing pathway metadata
export const PATHWAY_LEAVES: PathwayLeaf[] = [
  {
    code: 'PATH_MS_NATURAL',
    pathwayName: 'Mathematics & Sciences',
    streamName: 'Natural Sciences',
    label: 'Mathematics & Sciences — Natural Sciences',
    description:
      'A science-heavy pathway centered on the natural world. Strong fit for medicine, health sciences, and biology-driven research.',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'],
    careerAreas: [
      'Medicine',
      'Pharmacy',
      'Nursing',
      'Dentistry',
      'Biomedical Sciences',
      'Engineering',
      'Biotechnology',
      'Agriculture',
      'Environmental Science',
      'Veterinary Medicine',
    ],
  },
  {
    code: 'PATH_MS_APPLIED',
    pathwayName: 'Mathematics & Sciences',
    streamName: 'Mathematical & Applied Sciences',
    label: 'Mathematics & Sciences — Mathematical & Applied Sciences',
    description:
      'A quantitative, analytical pathway blending mathematics with applied and spatial sciences. Well-suited to economics, data, and planning-focused careers.',
    subjects: ['Mathematics', 'Physics', 'Economics', 'Geography'],
    careerAreas: [
      'Economics',
      'Finance',
      'Statistics',
      'Data Science',
      'Actuarial Science',
      'Urban Planning',
      'Logistics',
      'Geographic Information Systems (GIS)',
      'Architecture',
      'Transport Planning',
    ],
  },
  {
    code: 'PATH_ARTS_HUMANITIES',
    pathwayName: 'Arts & Humanities',
    label: 'Arts & Humanities',
    description:
      'A society-focused pathway covering history, governance, and human behaviour. Strong foundation for law, public policy, and communication careers.',
    subjects: ['History', 'Geography', 'Literature in English', 'Psychology'],
    careerAreas: [
      'Law',
      'Political Science',
      'International Relations',
      'Public Administration',
      'Journalism',
      'Education',
      'Sociology',
      'Social Work',
      'Community Development',
      'Public Policy',
    ],
  },
  {
    code: 'PATH_LANGUAGES',
    pathwayName: 'Languages',
    label: 'Languages',
    description:
      'A language- and culture-focused pathway spanning local and international tongues. Ideal for translation, diplomacy, and international engagement careers.',
    subjects: ['English', 'French', 'Kinyarwanda', 'Kiswahili'],
    careerAreas: [
      'Translation',
      'Interpretation',
      'Diplomacy',
      'International Business',
      'Tourism',
      'Hospitality',
      'Journalism',
      'Communications',
      'Teaching',
      'Public Relations',
    ],
  },
]

export const PATHWAY_LEAF_MAP = Object.fromEntries(
  PATHWAY_LEAVES.map((leaf) => [leaf.code, leaf])
) as Record<string, PathwayLeaf>

export const PATHWAY_LEAF_CODES = PATHWAY_LEAVES.map((leaf) => leaf.code)

export const PATHWAYS: { code: string; name: string; description: string; streams?: PathwayLeaf[] }[] = [
  {
    code: 'MATH_SCIENCES',
    name: 'Mathematics & Sciences',
    description: 'A science and mathematics pathway split into a natural-sciences stream and a mathematical & applied-sciences stream.',
    streams: [PATHWAY_LEAF_MAP.PATH_MS_NATURAL, PATHWAY_LEAF_MAP.PATH_MS_APPLIED],
  },
  {
    code: 'ARTS_HUMANITIES',
    name: 'Arts & Humanities',
    description: 'A society, history, and governance-focused pathway.',
    streams: [PATHWAY_LEAF_MAP.PATH_ARTS_HUMANITIES],
  },
  {
    code: 'LANGUAGES',
    name: 'Languages',
    description: 'A languages, culture, and international-engagement pathway.',
    streams: [PATHWAY_LEAF_MAP.PATH_LANGUAGES],
  },
]

export const isPathwayCode = (code: string) => code.startsWith('PATH_')
