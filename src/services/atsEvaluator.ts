import { ImprovedResume } from '../types/resume';

type ScoreBreakdown = {
  atsScore: number;
  issues: string[];
  keywordHits: string[];
  keywordMisses: string[];
  matchScore: number | null;
  summary: string;
};

type ParsedResume = {
  bullets: string[];
  hasEducation: boolean;
  hasEmail: boolean;
  hasExperience: boolean;
  hasGithub: boolean;
  hasLinkedIn: boolean;
  hasPhone: boolean;
  hasProjects: boolean;
  hasSkills: boolean;
  hasSummary: boolean;
  lines: string[];
  normalizedText: string;
  skills: string[];
};

const ACTION_VERBS = new Set([
  'achieved',
  'architected',
  'automated',
  'built',
  'collaborated',
  'created',
  'delivered',
  'designed',
  'developed',
  'drove',
  'engineered',
  'improved',
  'implemented',
  'increased',
  'integrated',
  'launched',
  'led',
  'managed',
  'mentored',
  'optimized',
  'reduced',
  'scaled',
  'shipped',
  'streamlined',
]);

const WEAK_PHRASES = [
  'responsible for',
  'worked on',
  'helped with',
  'involved in',
  'participated in',
  'tasked with',
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

export function scoreResumeAgainstJob(resumeText: string, jobDescription?: string): ScoreBreakdown {
  const parsedResume = parseResumeText(resumeText);
  const keywords = extractKeywords(jobDescription ?? '');
  return scoreParsedResume(parsedResume, keywords);
}

export function scoreImprovedResume(improvedResume: ImprovedResume, jobDescription?: string): ScoreBreakdown {
  const normalizedText = buildImprovedResumeText(improvedResume);
  const parsedResume = parseResumeText(normalizedText, improvedResume.skills);
  const keywords = extractKeywords(jobDescription ?? '');
  return scoreParsedResume(parsedResume, keywords);
}

function scoreParsedResume(parsedResume: ParsedResume, keywords: string[]): ScoreBreakdown {
  const structureScore = scoreStructure(parsedResume);
  const bulletScore = scoreBullets(parsedResume.bullets);
  const quantScore = scoreQuantification(parsedResume.bullets);
  const { hits, misses, score: keywordScore, matchScore } = scoreKeywordMatch(parsedResume, keywords);
  const skillsScore = scoreSkills(parsedResume, keywords);
  const penalty = scorePenalties(parsedResume);
  const rawScore = structureScore + bulletScore + quantScore + keywordScore + skillsScore - penalty;
  const atsScore = clamp(Math.round(rawScore), 28, 96);
  const issues = buildIssues(parsedResume, misses, atsScore);

  return {
    atsScore,
    issues,
    keywordHits: hits,
    keywordMisses: misses,
    matchScore,
    summary: buildSummary(atsScore, misses.length, parsedResume),
  };
}

function parseResumeText(resumeText: string, injectedSkills: string[] = []): ParsedResume {
  const normalizedText = normalizeWhitespace(resumeText);
  const lines = normalizedText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const bullets = lines.filter((line) => /^[\-*•]/.test(line) || looksLikeBullet(line));
  const lower = normalizedText.toLowerCase();
  const skills = [...extractInlineSkills(lines), ...injectedSkills]
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    bullets,
    hasEducation: /education|b\.?tech|bachelor|master|degree|university|college/i.test(normalizedText),
    hasEmail: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(normalizedText),
    hasExperience: /experience|employment|work history|internship/i.test(normalizedText),
    hasGithub: /github\.com|github/i.test(normalizedText),
    hasLinkedIn: /linkedin\.com|linkedin/i.test(normalizedText),
    hasPhone: /(\+91[\s-]?)?[6-9]\d{9}/.test(normalizedText.replace(/\s+/g, '')),
    hasProjects: /projects?|capstone|portfolio/i.test(normalizedText),
    hasSkills: /skills?|tech stack|technologies/i.test(normalizedText) || skills.length > 0,
    hasSummary: /summary|profile|objective|about me/i.test(normalizedText),
    lines,
    normalizedText: lower,
    skills,
  };
}

function scoreStructure(parsedResume: ParsedResume) {
  let score = 0;
  if (parsedResume.lines.length > 0) score += 2;
  if (parsedResume.hasEmail) score += 2;
  if (parsedResume.hasPhone) score += 2;
  if (parsedResume.hasLinkedIn || parsedResume.hasGithub) score += 2;
  if (parsedResume.hasSummary) score += 4;
  if (parsedResume.hasExperience) score += 4;
  if (parsedResume.hasProjects) score += 2;
  if (parsedResume.hasEducation) score += 1;
  if (parsedResume.hasSkills) score += 1;
  return score;
}

function scoreBullets(bullets: string[]) {
  if (bullets.length === 0) {
    return 4;
  }

  const strongVerbCount = bullets.filter((bullet) => startsWithActionVerb(bullet)).length;
  const achievementCount = bullets.filter((bullet) => looksLikeAchievement(bullet)).length;
  const conciseCount = bullets.filter((bullet) => bullet.length >= 35 && bullet.length <= 180).length;

  const actionScore = Math.min(10, Math.round((strongVerbCount / bullets.length) * 10));
  const achievementScore = Math.min(8, Math.round((achievementCount / bullets.length) * 8));
  const conciseScore = Math.min(7, Math.round((conciseCount / bullets.length) * 7));
  return actionScore + achievementScore + conciseScore;
}

function scoreQuantification(bullets: string[]) {
  const quantifiedCount = bullets.filter((bullet) => /\b\d+([.,]\d+)?(%|x|k|m)?\b/i.test(bullet)).length;

  if (quantifiedCount >= 5) return 20;
  if (quantifiedCount >= 3) return 15;
  if (quantifiedCount >= 2) return 11;
  if (quantifiedCount >= 1) return 7;
  return 2;
}

function scoreKeywordMatch(parsedResume: ParsedResume, keywords: string[]) {
  if (keywords.length === 0) {
    return {
      hits: [],
      misses: [],
      matchScore: null,
      score: 12,
    };
  }

  const hits = keywords.filter((keyword) => parsedResume.normalizedText.includes(keyword.toLowerCase()));
  const misses = keywords.filter((keyword) => !parsedResume.normalizedText.includes(keyword.toLowerCase()));
  const ratio = hits.length / keywords.length;

  return {
    hits,
    misses: misses.slice(0, 8),
    matchScore: Math.round(ratio * 100),
    score: Math.round(ratio * 20),
  };
}

function scoreSkills(parsedResume: ParsedResume, keywords: string[]) {
  const uniqueSkills = new Set(parsedResume.skills.map((skill) => skill.toLowerCase()));
  const base = Math.min(6, uniqueSkills.size);

  if (keywords.length === 0) {
    return Math.min(10, base + 2);
  }

  const keywordSkillHits = keywords.filter((keyword) => uniqueSkills.has(keyword.toLowerCase())).length;
  return Math.min(10, base + Math.min(4, keywordSkillHits));
}

function scorePenalties(parsedResume: ParsedResume) {
  let penalty = 0;

  for (const phrase of WEAK_PHRASES) {
    if (parsedResume.normalizedText.includes(phrase)) {
      penalty += 1;
    }
  }

  if (parsedResume.lines.length > 80) {
    penalty += 2;
  }

  if (parsedResume.bullets.length > 0 && parsedResume.bullets.every((bullet) => !startsWithActionVerb(bullet))) {
    penalty += 2;
  }

  return Math.min(5, penalty);
}

function buildIssues(parsedResume: ParsedResume, keywordMisses: string[], atsScore: number) {
  const issues: string[] = [];
  const quantifiedCount = parsedResume.bullets.filter((bullet) => /\b\d+([.,]\d+)?(%|x|k|m)?\b/i.test(bullet)).length;

  if (quantifiedCount < 2) {
    issues.push('Bullet points lack measurable impact, which weakens ATS and recruiter confidence.');
  }

  if (parsedResume.bullets.some((bullet) => !startsWithActionVerb(bullet))) {
    issues.push('Several bullets still read like responsibilities instead of achievement-led statements.');
  }

  if (keywordMisses.length > 0) {
    issues.push(`Important hiring keywords are missing: ${keywordMisses.slice(0, 4).join(', ')}.`);
  }

  if (!parsedResume.hasSummary) {
    issues.push('The resume does not have a clear professional summary for quick recruiter scanning.');
  }

  if (!parsedResume.hasSkills) {
    issues.push('A dedicated skills section is missing, which makes ATS keyword matching weaker.');
  }

  if (issues.length < 3 && atsScore < 80) {
    issues.push('The resume needs sharper positioning for the target role to improve shortlist chances.');
  }

  return issues.slice(0, 5);
}

function buildSummary(atsScore: number, missingKeywordCount: number, parsedResume: ParsedResume) {
  if (atsScore < 60) {
    return 'Your resume is at high risk of rejection because it lacks enough quantified impact, ATS-friendly wording, and role-specific keywords.';
  }

  if (atsScore < 80) {
    return `Your resume is reasonably strong but still at risk of rejection in competitive roles because ${summaryReason(missingKeywordCount, parsedResume)}.`;
  }

  return `Your resume is strong overall, but it still leaves shortlist potential on the table because ${summaryReason(missingKeywordCount, parsedResume)}.`;
}

function summaryReason(missingKeywordCount: number, parsedResume: ParsedResume) {
  if (missingKeywordCount > 0) {
    return 'some important role keywords are missing and a few bullets still need clearer business impact';
  }

  if (parsedResume.bullets.some((bullet) => !/\b\d+([.,]\d+)?(%|x|k|m)?\b/i.test(bullet))) {
    return 'some bullets still lack quantifiable outcomes';
  }

  return 'the value proposition could be sharper in the first scan';
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
    .slice(0, 8);
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
    .map((item) => item.trim());
}

function startsWithActionVerb(value: string) {
  const word = value
    .replace(/^[\-*•\s]+/, '')
    .split(/\s+/)[0]
    ?.toLowerCase();

  return word ? ACTION_VERBS.has(word) : false;
}

function looksLikeAchievement(value: string) {
  return /\b(improved|increased|reduced|launched|delivered|built|led|optimized|scaled|achieved)\b/i.test(value);
}

function looksLikeBullet(value: string) {
  return /^[A-Z][a-z]+ed\b/.test(value);
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
