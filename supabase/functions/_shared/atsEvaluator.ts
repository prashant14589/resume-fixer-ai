export type ImprovedResume = {
  experience: Array<{
    bullets: string[];
    company: string;
    role: string;
  }>;
  skills: string[];
  summary: string;
};

export const WEIGHTS_WITH_JD = {
  keyword: 0.35,
  bullet: 0.25,
  quant: 0.2,
  structure: 0.12,
  formatting: 0.08,
} as const;

export const WEIGHTS_NO_JD = {
  keyword: 0.25,
  bullet: 0.3,
  quant: 0.25,
  structure: 0.12,
  formatting: 0.08,
} as const;

export const ROLE_KEYWORDS: Record<string, string[]> = {
  'software-dev': [
    'React',
    'Node.js',
    'REST API',
    'Git',
    'Agile',
    'CI/CD',
    'JavaScript',
    'TypeScript',
    'SQL',
    'Docker',
    'Testing',
    'Code Review',
    'System Design',
  ],
  'data-analyst': [
    'SQL',
    'Python',
    'Power BI',
    'Excel',
    'ETL',
    'Tableau',
    'Pandas',
    'Data Cleaning',
    'Dashboard',
    'Reporting',
    'Statistical Analysis',
    'Data Visualization',
  ],
  marketing: [
    'SEO',
    'Google Ads',
    'Meta Ads',
    'CRM',
    'Conversion Rate',
    'Content Marketing',
    'Email Campaigns',
    'Analytics',
    'Canva',
    'Social Media',
    'Brand Awareness',
    'Lead Generation',
  ],
  operations: [
    'Excel',
    'Process Improvement',
    'MIS',
    'Reporting',
    'SAP',
    'Coordination',
    'Vendor Management',
    'KPI',
    'SLA',
    'Documentation',
    'Stakeholder Management',
  ],
  general: [
    'Communication',
    'MS Office',
    'Teamwork',
    'Problem Solving',
    'Time Management',
    'Leadership',
    'Presentation',
    'Project Management',
    'Attention to Detail',
  ],
};

const ROLE_KEYWORDS_NO_JD: Record<string, string[]> = {
  'software-dev': ['Java', 'Python', 'JavaScript', 'React', 'REST API', 'Git', 'MySQL', 'Testing'],
  'data-analyst': ['SQL', 'Python', 'Excel', 'Dashboard', 'Reporting', 'Data Visualization'],
  marketing: ['SEO', 'Analytics', 'Content Marketing', 'Social Media', 'Lead Generation'],
  operations: ['Excel', 'Reporting', 'Process Improvement', 'Documentation', 'Coordination'],
  general: ['Communication', 'Problem Solving', 'Teamwork', 'Time Management'],
};

export type ScoreDimension = {
  max: number;
  raw: number;
};

export type ResumeScoreResult = {
  breakdown: {
    bullet: ScoreDimension;
    formatting: ScoreDimension;
    keyword: ScoreDimension;
    quant: ScoreDimension;
    structure: ScoreDimension;
  };
  missingKeywords: string[];
  totalScore: number;
  weakBullets: string[];
};

type ParsedResume = {
  bullets: string[];
  lines: string[];
  normalizedText: string;
  skills: string[];
};

const STRONG_ACTION_VERBS = new Set([
  'achieved',
  'analyzed',
  'architected',
  'automated',
  'built',
  'collaborated',
  'collected',
  'created',
  'delivered',
  'designed',
  'developed',
  'drove',
  'engineered',
  'handled',
  'improved',
  'implemented',
  'increased',
  'integrated',
  'launched',
  'led',
  'managed',
  'optimized',
  'resolved',
  'reduced',
  'scaled',
  'streamlined',
  'tested',
]);

const WEAK_ACTION_STARTS = [
  'worked',
  'helped',
  'assisted',
  'responsible for',
  'part of',
  'involved in',
  'was ',
  'were ',
  'been ',
];

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'into',
  'is',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
  'using',
  'use',
  'will',
  'your',
  'years',
  'year',
  'role',
  'work',
  'team',
  'ability',
  'skills',
  'experience',
]);

export function scoreResume(resumeText: string, jobDescription?: string, rolePreset = 'general'): ResumeScoreResult {
  const parsedResume = parseResumeText(resumeText);
  const keywords = resolveKeywords(jobDescription, rolePreset);
  return scoreParsedResume(parsedResume, keywords, Boolean(jobDescription?.trim()));
}

export function scoreResumeAgainstJob(resumeText: string, jobDescription?: string, rolePreset = 'general'): ResumeScoreResult {
  return scoreResume(resumeText, jobDescription, rolePreset);
}

export function scoreImprovedResume(
  improvedResume: ImprovedResume,
  jobDescription?: string,
  rolePreset = 'general'
): ResumeScoreResult {
  const normalizedText = buildImprovedResumeText(improvedResume);
  return scoreResume(normalizedText, jobDescription, rolePreset);
}

function scoreParsedResume(parsedResume: ParsedResume, keywords: string[], hasJobDescription: boolean): ResumeScoreResult {
  const weights = hasJobDescription ? WEIGHTS_WITH_JD : WEIGHTS_NO_JD;
  const breakdown = {
    bullet: { max: 100, raw: scoreBulletQuality(parsedResume.bullets) },
    formatting: { max: 100, raw: scoreFormatting(parsedResume) },
    keyword: { max: 100, raw: scoreKeywordMatch(parsedResume, keywords) },
    quant: { max: 100, raw: scoreQuantification(parsedResume.bullets) },
    structure: { max: 100, raw: scoreStructure(parsedResume) },
  };
  const totalScore = Math.round(
    breakdown.keyword.raw * weights.keyword +
      breakdown.bullet.raw * weights.bullet +
      breakdown.quant.raw * weights.quant +
      breakdown.structure.raw * weights.structure +
      breakdown.formatting.raw * weights.formatting
  );

  return {
    breakdown,
    missingKeywords: keywords.filter((keyword) => !keywordPresent(parsedResume.normalizedText, keyword)),
    totalScore,
    weakBullets: parsedResume.bullets.filter((bullet) => isWeakBullet(bullet)),
  };
}

function parseResumeText(resumeText: string): ParsedResume {
  const normalizedText = normalizeWhitespace(resumeText);
  const lines = normalizedText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    bullets: lines.filter((line) => /^[\-*•]/.test(line) || looksLikeBullet(line)),
    lines,
    normalizedText: normalizedText.toLowerCase(),
    skills: extractInlineSkills(lines),
  };
}

function scoreKeywordMatch(parsedResume: ParsedResume, keywords: string[]) {
  if (keywords.length === 0) {
    return 0;
  }

  const matched = keywords.filter((keyword) => keywordPresent(parsedResume.normalizedText, keyword));
  return Math.round((matched.length / keywords.length) * 100);
}

function keywordPresent(normalizedText: string, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (normalizedText.includes(normalizedKeyword)) {
    return true;
  }

  const aliasRules: Array<{ aliases: string[]; pattern: RegExp }> = [
    {
      aliases: ['rest api', 'rest apis', 'api'],
      pattern: /\brest\s*api\b|\bapis?\b/i,
    },
    {
      aliases: ['sql'],
      pattern: /\bsql\b|\bmysql\b|\bpostgres(?:ql)?\b|\bsqlite\b/i,
    },
    {
      aliases: ['testing'],
      pattern: /\btesting\b|\bunit\s*tests?\b|\btest\s*cases?\b/i,
    },
    {
      aliases: ['javascript'],
      pattern: /\bjavascript\b|\bjs\b/i,
    },
    {
      aliases: ['node.js', 'node'],
      pattern: /\bnode(?:\.js)?\b/i,
    },
    {
      aliases: ['ci/cd'],
      pattern: /\bci\/cd\b|\bcontinuous integration\b|\bcontinuous deployment\b/i,
    },
  ];

  for (const rule of aliasRules) {
    if (rule.aliases.includes(normalizedKeyword)) {
      return rule.pattern.test(normalizedText);
    }
  }

  return false;
}

function scoreBulletQuality(bullets: string[]) {
  if (bullets.length === 0) {
    return 0;
  }

  let points = 0;

  for (const bullet of bullets) {
    const action = startsWithStrongActionVerb(bullet) ? 1 : 0;
    const task = hasSpecificTaskSignal(bullet) ? 1 : 0;
    const outcome = hasMetric(bullet) || hasOutcomeSignal(bullet) ? 1 : 0;
    const vaguePenalty = isVagueBullet(bullet) ? 0.7 : 0;

    points += Math.max(0, action + task + outcome - vaguePenalty);
  }

  const maxPoints = Math.max(1, bullets.length * 3);
  const raw = Math.round((Math.min(points, maxPoints) / maxPoints) * 100);

  if (bullets.length >= 3 && raw > 0 && raw < 30) {
    return 30;
  }

  return raw;
}

function scoreQuantification(bullets: string[]) {
  if (bullets.length === 0) {
    return 0;
  }

  const quantified = bullets.filter((bullet) => hasMetric(bullet)).length;
  const proxyImpact = bullets.filter((bullet) => !hasMetric(bullet) && hasOutcomeSignal(bullet)).length;
  const weighted = (quantified + proxyImpact * 0.2) / bullets.length;

  return Math.round(Math.min(1, weighted) * 100);
}

function scoreStructure(parsedResume: ParsedResume) {
  let score = 0;

  if (/\bexperience\b/i.test(parsedResume.normalizedText)) score += 24;
  if (/\beducation\b|b\.?tech|bachelor|master|degree|university|college/i.test(parsedResume.normalizedText)) score += 22;
  if (/\bskills?\b|tech stack|technologies/i.test(parsedResume.normalizedText) || parsedResume.skills.length > 0) score += 22;
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(parsedResume.lines.join(' '))) score += 16;
  if (/(\+91[\s-]?)?[6-9]\d{9}/.test(parsedResume.lines.join(' ').replace(/\s+/g, ''))) score += 16;

  return Math.min(score, 100);
}

function scoreFormatting(parsedResume: ParsedResume) {
  let score = 0;

  if (hasSectionHeaders(parsedResume.normalizedText)) {
    score += 30;
  }

  if (parsedResume.bullets.every((bullet) => countEstimatedLines(bullet) <= 3)) {
    score += 20;
  }

  if (hasConsistentDateFormat(parsedResume.lines)) {
    score += 20;
  }

  if (!hasTemplateArtifacts(parsedResume.normalizedText)) {
    score += 30;
  }

  return score;
}

function extractKeywords(jobDescription: string) {
  const normalized = normalizeWhitespace(jobDescription).toLowerCase();
  const phrases = normalized.match(/[a-z][a-z0-9.+#/-]{2,}(?:\s+[a-z][a-z0-9.+#/-]{2,})?/g) ?? [];
  const frequencies = new Map<string, number>();

  for (const rawPhrase of phrases) {
    const phrase = rawPhrase.trim();
    if (STOP_WORDS.has(phrase) || phrase.split(' ').every((word) => STOP_WORDS.has(word))) {
      continue;
    }

    frequencies.set(phrase, (frequencies.get(phrase) ?? 0) + 1);
  }

  return [...frequencies.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([phrase]) => toDisplayKeyword(phrase))
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 12);
}

function resolveKeywords(jobDescription?: string, rolePreset = 'general') {
  const roleKeywords = ROLE_KEYWORDS[rolePreset] ?? ROLE_KEYWORDS.general;
  const jdKeywords = extractKeywords(jobDescription ?? '');

  if (jdKeywords.length === 0) {
    return ROLE_KEYWORDS_NO_JD[rolePreset] ?? ROLE_KEYWORDS_NO_JD.general;
  }

  const weightedJd = jdKeywords.flatMap((keyword) => [keyword, keyword]);
  const merged = [...weightedJd, ...roleKeywords];

  return merged.filter((keyword, index) => merged.indexOf(keyword) === index);
}

function buildImprovedResumeText(improvedResume: ImprovedResume) {
  const experience = improvedResume.experience
    .map((item) => [item.role, item.company, ...item.bullets].join('\n'))
    .join('\n');

  return [improvedResume.summary, experience, improvedResume.skills.join(', ')].join('\n');
}

function extractInlineSkills(lines: string[]) {
  const skillLine = lines.find((line) => /^skills?/i.test(line));
  if (!skillLine) {
    return [];
  }

  return skillLine
    .split(':')
    .slice(1)
    .join(':')
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isWeakBullet(bullet: string) {
  return hasWeakActionStart(bullet) || isVagueBullet(bullet) || (!hasMetric(bullet) && !hasOutcomeSignal(bullet));
}

function hasMetric(value: string) {
  return /\b\d+([.,]\d+)?(%|x)?\b|₹|\$|\b\d+\s*(users|clients|hours|days|weeks|months|projects|teams|records|tasks|modules)\b/i.test(value);
}

function hasSpecificTaskSignal(value: string) {
  return /\b(api|apis|frontend|backend|dashboard|workflow|module|modules|system|application|app|website|database|codebase|features?|tests?|chat|e-commerce|ecommerce|client|sales|operations|research|data|calls)\b/i.test(
    value
  );
}

function hasOutcomeSignal(value: string) {
  return /\b(improved|reduced|increased|optimized|launched|delivered|resolved|saved|enabled|accelerated|integrated|fixed|analyzed)\b/i.test(value);
}

function isVagueBullet(value: string) {
  const normalized = value.replace(/^[\-*•\s]+/, '').trim().toLowerCase();
  return /\b(worked on|did project|helped|assisted|responsible for|part of|involved in)\b/.test(normalized);
}

function hasWeakActionStart(value: string) {
  const normalized = value.replace(/^[\-*•\s]+/, '').trim().toLowerCase();
  return WEAK_ACTION_STARTS.some((prefix) => normalized.startsWith(prefix));
}

function startsWithStrongActionVerb(value: string) {
  const firstWord = value
    .replace(/^[\-*•\s]+/, '')
    .split(/\s+/)[0]
    ?.toLowerCase();

  return firstWord ? STRONG_ACTION_VERBS.has(firstWord) : false;
}

function looksLikeBullet(value: string) {
  if (looksLikeObjectiveLine(value)) {
    return false;
  }

  return /^[A-Z][a-z]+(?:ed|ing)\b/.test(value) ||
    /^(built|did|led|made|ran|set|won|wrote|drove|took|gave|kept|sent|spent|taught|brought|cut|put|met)\b/i.test(value);
}

function looksLikeObjectiveLine(value: string) {
  return /\b(looking for|seeking|aspiring|passionate about|career in|looking to|eager to|want to|desires?\b|aim to|obtain a|pursue a|secure a)\b/i.test(value);
}

function hasSectionHeaders(value: string) {
  return /\bexperience\b/i.test(value) && /\beducation\b/i.test(value) && /\bskills?\b/i.test(value);
}

function hasConsistentDateFormat(lines: string[]) {
  const monthYear = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\b/i;
  const numericMonthYear = /\b(0?[1-9]|1[0-2])\/\d{4}\b/;
  const matches = lines.filter((line) => monthYear.test(line) || numericMonthYear.test(line));

  if (matches.length < 2) {
    return true;
  }

  const hasMonthYear = matches.some((line) => monthYear.test(line));
  const hasNumericMonthYear = matches.some((line) => numericMonthYear.test(line));
  return !(hasMonthYear && hasNumericMonthYear);
}

function hasTemplateArtifacts(value: string) {
  return /\b(lorem ipsum|insert here|your name|your email|phone number|address here|template)\b/i.test(value);
}

function countEstimatedLines(value: string) {
  return Math.ceil(value.length / 90);
}

function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, '').replace(/\t/g, ' ').replace(/[ ]{2,}/g, ' ').trim();
}

function toDisplayKeyword(value: string) {
  return value
    .split(' ')
    .map((word) => {
      if (word.length <= 3 || /[A-Z]/.test(word)) {
        return word.toUpperCase();
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
