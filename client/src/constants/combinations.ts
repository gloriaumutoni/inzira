export interface CombinationData {
  code: string
  name: string
  subjects: string[]
  universityPaths: string[]
  careers: string[]
  description: string
}

// Rwanda's 10 A-Level subject combinations
// Used by the combination quiz and any component needing combination metadata
export const COMBINATIONS: CombinationData[] = [
  {
    code: 'MPC',
    name: 'Mathematics, Physics, Computer Science',
    subjects: ['Mathematics', 'Physics', 'Computer Science'],
    universityPaths: [
      'Computer Science',
      'Software Engineering',
      'Engineering (Electrical, Mechanical, Civil)',
      'Data Science',
      'Robotics & AI',
    ],
    careers: ['Software Developer', 'Data Scientist', 'Systems Engineer', 'AI Researcher', 'Robotics Engineer'],
    description:
      'The most versatile tech-and-science combination. Opens the widest range of computing, engineering, and applied science degrees.',
  },
  {
    code: 'MPG',
    name: 'Mathematics, Physics, Geography',
    subjects: ['Mathematics', 'Physics', 'Geography'],
    universityPaths: [
      'Environmental Engineering',
      'Geomatics & Surveying',
      'Urban & Regional Planning',
      'Physics',
      'Meteorology',
    ],
    careers: ['Geospatial Analyst', 'Urban Planner', 'Environmental Engineer', 'Surveyor', 'Meteorologist'],
    description:
      'Combines quantitative skills with spatial analysis. Strong fit for environmental science and urban planning careers.',
  },
  {
    code: 'MCE',
    name: 'Mathematics, Computer Science, Economics',
    subjects: ['Mathematics', 'Computer Science', 'Economics'],
    universityPaths: [
      'Computer Science',
      'Economics',
      'Business Analytics',
      'Finance',
      'Software Engineering',
    ],
    careers: ['Software Developer', 'Financial Analyst', 'Economist', 'Business Analyst', 'Fintech Product Manager'],
    description:
      "Bridges computing with economic thinking. Ideal for fintech, business analytics, and Rwanda's growing digital economy.",
  },
  {
    code: 'MCB',
    name: 'Mathematics, Chemistry, Biology',
    subjects: ['Mathematics', 'Chemistry', 'Biology'],
    universityPaths: [
      'Medicine',
      'Pharmacy',
      'Biochemistry',
      'Biotechnology',
      'Nursing',
    ],
    careers: ['Doctor', 'Pharmacist', 'Biochemist', 'Medical Researcher', 'Nutritionist'],
    description:
      'A strong pre-medical combination with quantitative depth. Excellent for medicine, pharmacy, and life sciences.',
  },
  {
    code: 'MEG',
    name: 'Mathematics, Economics, Geography',
    subjects: ['Mathematics', 'Economics', 'Geography'],
    universityPaths: [
      'Economics',
      'Business Administration',
      'Finance',
      'Development Studies',
      'Actuarial Science',
    ],
    careers: ['Economist', 'Financial Analyst', 'Investment Banker', 'Development Officer', 'Actuary'],
    description:
      'Strong quantitative and economic foundation. A popular choice for finance, business, and development careers.',
  },
  {
    code: 'PCB',
    name: 'Physics, Chemistry, Biology',
    subjects: ['Physics', 'Chemistry', 'Biology'],
    universityPaths: [
      'Medicine',
      'Pharmacy',
      'Nursing',
      'Biomedical Sciences',
      'Dentistry',
    ],
    careers: ['Doctor', 'Nurse', 'Pharmacist', 'Lab Technician', 'Biomedical Engineer'],
    description:
      'The classic medicine pathway. Accepted by virtually all medical and health science programmes.',
  },
  {
    code: 'HGL',
    name: 'History, Geography, Literature in English',
    subjects: ['History', 'Geography', 'Literature in English'],
    universityPaths: [
      'Law',
      'Journalism & Media',
      'Education',
      'Social Work',
      'Communications',
    ],
    careers: ['Journalist', 'Teacher', 'Lawyer', 'Social Worker', 'Communications Officer'],
    description:
      'A humanities combination with strong writing and analytical skills. Great for journalism, law, and education.',
  },
  {
    code: 'HLP',
    name: 'History, Literature in English, Psychology',
    subjects: ['History', 'Literature in English', 'Psychology'],
    universityPaths: [
      'Psychology',
      'Social Work',
      'Education',
      'Law',
      'Counselling',
    ],
    careers: ['Psychologist', 'Counsellor', 'Social Worker', 'Teacher', 'Human Resources Officer'],
    description:
      'A people-focused humanities combination. Well-suited to psychology, counselling, and social-facing careers.',
  },
  {
    code: 'LFK',
    name: 'Literature in English, French, Kinyarwanda/Kiswahili',
    subjects: ['Literature in English', 'French', 'Kinyarwanda/Kiswahili'],
    universityPaths: [
      'Linguistics & Translation',
      'Education',
      'Journalism & Media',
      'International Relations',
      'Communications',
    ],
    careers: ['Translator', 'Teacher', 'Journalist', 'Diplomat', 'Communications Officer'],
    description:
      'A language-rich combination spanning regional and international tongues. Strong fit for translation, media, and diplomacy.',
  },
  {
    code: 'PCM',
    name: 'Physics, Chemistry, Mathematics',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    universityPaths: [
      'Engineering (Civil, Mechanical, Electrical)',
      'Architecture',
      'Applied Physics',
      'Industrial Chemistry',
      'Actuarial Science',
    ],
    careers: ['Civil Engineer', 'Mechanical Engineer', 'Architect', 'Industrial Chemist', 'Actuary'],
    description:
      'A rigorous pure-science combination. The traditional gateway to engineering and physical-science degrees.',
  },
]

export const COMBINATION_MAP = Object.fromEntries(COMBINATIONS.map(c => [c.code, c])) as Record<string, CombinationData>
