export interface CombinationData {
  code: string
  name: string
  subjects: string[]
  universityPaths: string[]
  careers: string[]
  description: string
}

// Rwanda's 15 A-Level subject combinations
// Used by the combination quiz and any component needing combination metadata
export const COMBINATIONS: CombinationData[] = [
  {
    code: 'MPC',
    name: 'Mathematics, Physics, Chemistry',
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    universityPaths: [
      'Engineering (Civil, Mechanical, Electrical)',
      'Computer Science',
      'Applied Sciences',
      'Architecture',
      'Medicine',
    ],
    careers: ['Civil Engineer', 'Software Developer', 'Data Scientist', 'Architect', 'Industrial Chemist'],
    description:
      'The most versatile science combination. Opens the widest range of engineering, computing, and science degrees.',
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
    name: 'Mathematics, Chemistry, Economics',
    subjects: ['Mathematics', 'Chemistry', 'Economics'],
    universityPaths: [
      'Chemical Engineering',
      'Economics',
      'Business Analytics',
      'Finance',
      'Industrial Chemistry',
    ],
    careers: ['Chemical Engineer', 'Financial Analyst', 'Economist', 'Business Analyst', 'Industrial Chemist'],
    description:
      'Bridges hard science with economic thinking. Ideal for engineering, finance, and quantitative business roles.',
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
    code: 'PCE',
    name: 'Physics, Chemistry, Economics',
    subjects: ['Physics', 'Chemistry', 'Economics'],
    universityPaths: [
      'Engineering',
      'Economics',
      'Industrial Chemistry',
      'Business',
      'Energy Studies',
    ],
    careers: ['Chemical Engineer', 'Economist', 'Energy Analyst', 'Industrial Scientist', 'Business Manager'],
    description:
      'Combines physical sciences with economics. Suited for energy, industrial, and business-facing science roles.',
  },
  {
    code: 'HEG',
    name: 'History, Economics, Geography',
    subjects: ['History', 'Economics', 'Geography'],
    universityPaths: [
      'Law',
      'Economics',
      'Public Administration',
      'Political Science',
      'Development Studies',
    ],
    careers: ['Lawyer', 'Economist', 'Public Servant', 'Diplomat', 'Policy Analyst'],
    description:
      'A social science powerhouse. Leads to law, policy, economics, and public administration careers.',
  },
  {
    code: 'HGL',
    name: 'History, Geography, Literature',
    subjects: ['History', 'Geography', 'Literature'],
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
    code: 'HGK',
    name: 'History, Geography, Kinyarwanda',
    subjects: ['History', 'Geography', 'Kinyarwanda'],
    universityPaths: [
      'Education',
      'Kinyarwanda & Linguistics',
      'Social Sciences',
      'Public Administration',
      'Journalism',
    ],
    careers: ['Teacher', 'Cultural Officer', 'Community Developer', 'Journalist', 'Public Servant'],
    description:
      'Rooted in Rwandan history and language. Ideal for education, cultural work, and community-facing public service.',
  },
  {
    code: 'HLE',
    name: 'History, Literature, Economics',
    subjects: ['History', 'Literature', 'Economics'],
    universityPaths: [
      'Law',
      'Journalism',
      'Economics',
      'Business',
      'Education',
    ],
    careers: ['Lawyer', 'Writer', 'Economist', 'Journalist', 'Teacher'],
    description:
      'Blends critical thinking with economic literacy. Well-suited to law, writing, and business-facing roles.',
  },
  {
    code: 'BCG',
    name: 'Biology, Chemistry, Geography',
    subjects: ['Biology', 'Chemistry', 'Geography'],
    universityPaths: [
      'Environmental Science',
      'Agriculture & Agronomy',
      'Veterinary Science',
      'Ecology',
      'Public Health',
    ],
    careers: ['Environmentalist', 'Agronomist', 'Veterinarian', 'Public Health Officer', 'Ecologist'],
    description:
      'Ideal for environmental and agricultural sciences. Strong path to natural resource management and public health.',
  },
  {
    code: 'MEd',
    name: 'Mathematics, Economics, Digital Technology',
    subjects: ['Mathematics', 'Economics', 'Digital Technology'],
    universityPaths: [
      'Information Technology',
      'Business Analytics',
      'Economics',
      'Finance',
      'E-Commerce & Digital Business',
    ],
    careers: ['IT Specialist', 'Business Analyst', 'Digital Marketer', 'Financial Analyst', 'Entrepreneur'],
    description:
      "Combines digital skills with economics. Increasingly relevant in Rwanda's growing digital economy.",
  },
  {
    code: 'AGL',
    name: 'Accounting, Geography, Literature',
    subjects: ['Accounting', 'Geography', 'Literature'],
    universityPaths: [
      'Accounting & Finance',
      'Business Administration',
      'Communications',
      'Education',
      'Public Relations',
    ],
    careers: ['Accountant', 'Financial Auditor', 'Business Manager', 'Communications Officer', 'Teacher'],
    description:
      'Business and communication focused. Leads to accounting, finance, and management careers with strong writing skills.',
  },
  {
    code: 'MPE',
    name: 'Mathematics, Physics, Economics',
    subjects: ['Mathematics', 'Physics', 'Economics'],
    universityPaths: [
      'Engineering',
      'Actuarial Science',
      'Economics',
      'Finance',
      'Applied Mathematics',
    ],
    careers: ['Actuary', 'Engineer', 'Economist', 'Financial Analyst', 'Investment Manager'],
    description:
      'A powerful quantitative combination. Ideal for actuarial science, finance, and physics-driven engineering roles.',
  },
]

export const COMBINATION_MAP = Object.fromEntries(COMBINATIONS.map(c => [c.code, c])) as Record<string, CombinationData>
