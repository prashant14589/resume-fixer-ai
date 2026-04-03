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
