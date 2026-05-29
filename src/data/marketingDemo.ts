export const processingSteps = [
  'Reading resume',
  'Checking rejection risk',
  'Finding missing keywords',
  'Checking ATS formatting',
  'Rewriting stronger bullet points',
  'Preparing paid resume upgrade',
];

export const marketingAnalysis = {
  atsScore: 42,
  improvedScore: 84,
  summary:
    'Your resume will likely be rejected in its current form because it reads like responsibilities, not impact, and misses obvious ATS keywords.',
  issues: [
    'Summary is too weak to position you clearly for recruiter shortlisting.',
    'Experience bullets describe tasks instead of outcomes.',
    'Important role keywords are missing or underused.',
    'Projects and internships are not framed like achievements.',
    'Skills are broad and not prioritized for ATS relevance.',
  ],
  missingKeywords: ['Internship', 'React', 'API', 'Optimization', 'Problem-solving'],
  matchScore: 51,
  improvedResume: {
    summary:
      'Fresher software engineer with hands-on project experience in React, APIs, and product optimization, focused on shipping usable features and improving user experience.',
    experience: [
      {
        company: 'Academic Projects',
        role: 'Software Developer',
        bullets: [
          'Built user-facing web modules in React that improved usability and reduced repetitive manual steps for student users.',
          'Integrated API-driven workflows and improved page responsiveness, leading to faster task completion during project demos.',
          'Collaborated across testing and feature iteration to improve reliability before final showcase reviews.',
        ],
      },
    ],
    skills: ['React', 'JavaScript', 'REST APIs', 'Problem Solving', 'HTML', 'CSS'],
  },
};

export const paywallOffer = {
  cta: 'Fix Resume Instantly',
  price: 'Rs 199',
  struckPrice: 'Rs 499',
  benefits: [
    'Projected ATS score improvement to 80+',
    'Stronger bullet points with impact language',
    'Job-specific keyword optimization',
  ],
};

export type PaywallTierCode = 'quick-fix' | 'full-fix' | 'credit-pack';

export interface PaywallTier {
  code: PaywallTierCode;
  label: string;
  price: number;
  strikePrice: string;
  features: string[];
  isDefault: boolean;
  credits: number;
  includesPdf: boolean;
  includesShare: boolean;
}

export const PAYWALL_TIERS: PaywallTier[] = [
  {
    code: 'quick-fix',
    label: 'Quick Fix',
    price: 99,
    strikePrice: '₹199',
    features: ['1 AI rewrite', 'ATS score fix', 'Issue-by-issue fixes'],
    isDefault: false,
    credits: 1,
    includesPdf: false,
    includesShare: false,
  },
  {
    code: 'full-fix',
    label: 'Full Fix',
    price: 249,
    strikePrice: '₹499',
    features: ['1 AI rewrite', 'ATS score fix', 'PDF export', 'WhatsApp share card'],
    isDefault: true,
    credits: 1,
    includesPdf: true,
    includesShare: true,
  },
  {
    code: 'credit-pack',
    label: 'Credit Pack',
    price: 499,
    strikePrice: '₹999',
    features: ['3 AI rewrites', 'ATS score fix', 'PDF export', 'WhatsApp share card'],
    isDefault: false,
    credits: 3,
    includesPdf: true,
    includesShare: true,
  },
];

export const DEFAULT_TIER: PaywallTier =
  PAYWALL_TIERS.find((t) => t.isDefault) ?? PAYWALL_TIERS[1];

export type CompanyCode = 'general' | 'tcs' | 'infosys' | 'wipro' | 'cognizant' | 'hcl';

export const COMPANY_OPTIONS: { label: string; value: CompanyCode }[] = [
  { label: 'Any Company', value: 'general' },
  { label: 'TCS', value: 'tcs' },
  { label: 'Infosys', value: 'infosys' },
  { label: 'Wipro', value: 'wipro' },
  { label: 'Cognizant', value: 'cognizant' },
  { label: 'HCL', value: 'hcl' },
];

export const COMPANY_KEYWORD_PACKS: Record<CompanyCode, string[]> = {
  general: ['communication skills', 'problem solving', 'teamwork', 'leadership', 'MS Office'],
  tcs: ['iON', 'NQT', 'CGPA', 'Java', 'SQL', 'Python', 'C++', 'data structures', 'algorithms', 'Agile', 'OOP', 'DBMS', 'operating systems'],
  infosys: ['InfyTQ', 'Java', 'Python', 'SQL', 'data structures', 'algorithms', 'OOPS', 'DBMS', 'computer networks', 'Agile', 'Scrum', 'Springboot'],
  wipro: ['WILP', 'Java', 'Python', 'SQL', 'C', 'C++', 'data structures', 'DBMS', 'networking', 'cloud basics', 'Agile', 'Linux'],
  cognizant: ['GenC', 'GenC Next', 'Java', 'Python', 'SQL', 'JavaScript', 'data structures', 'DBMS', 'Agile', 'Scrum', 'REST API', 'digital transformation'],
  hcl: ['TechBee', 'Java', 'Python', 'SQL', 'C++', 'data structures', 'DBMS', 'networking', 'Linux', 'cloud computing', 'Agile', 'DevOps basics'],
};
