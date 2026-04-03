export const processingSteps = [
  'Reading resume',
  'Checking ATS formatting',
  'Finding weak bullets',
  'Improving impact language',
  'Preparing optimized version',
];

export const demoAnalysis = {
  scoreBefore: 58,
  scoreAfterEstimate: 82,
  label: 'Needs work',
  issues: [
    'Summary is generic and does not position the candidate clearly.',
    'Experience bullets describe tasks, not outcomes or impact.',
    'Keyword alignment for engineering roles is weak.',
    'Formatting is dense and may confuse ATS parsers.',
    'Skills are listed without prioritization.',
  ],
  beforeBullet: 'Worked on web applications and helped improve the product for users.',
  afterBullet:
    'Improved core web app experience by shipping user-facing features, fixing UX friction, and supporting faster product iteration across releases.',
};

export const demoPlans = [
  {
    code: 'starter',
    title: '1 Resume Fix',
    subtitle: 'For urgent job applications',
    amount: '₹199',
    credits: '1 credit',
    highlighted: false,
  },
  {
    code: 'pro',
    title: 'Pro Pack',
    subtitle: 'Best for applying to multiple roles',
    amount: '₹299',
    credits: '3 credits',
    highlighted: true,
  },
  {
    code: 'career',
    title: 'Career Boost',
    subtitle: 'Highest value for repeat use',
    amount: '₹399',
    credits: '5 credits',
    highlighted: false,
  },
];
