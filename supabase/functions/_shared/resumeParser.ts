export type ParsedResumeSource = {
  experience: Array<{
    bullets: string[];
    company: string;
    role: string;
  }>;
  skills: string[];
  summary?: string;
};

type ResumeSections = {
  certifications: string[];
  education: string[];
  experience: string[];
  projects: string[];
  skills: string[];
  summary: string[];
};

type ExperienceEntry = ParsedResumeSource['experience'][number];

type MetaParts = {
  company: string;
  dates: string[];
  role: string;
};

const SECTION_ALIASES: Array<{ key: keyof ResumeSections; pattern: RegExp }> = [
  { key: 'summary', pattern: /^(summary|profile|objective|about me|professional summary)$/i },
  { key: 'experience', pattern: /^(experience|work experience|professional experience|employment history|internships?|internship experience)$/i },
  { key: 'education', pattern: /^(education|academic background|qualifications)$/i },
  { key: 'skills', pattern: /^(skills?|technical skills|tech stack|technologies|core competencies)$/i },
  { key: 'projects', pattern: /^(projects?|academic projects|personal projects)$/i },
  { key: 'certifications', pattern: /^(certifications?|licenses)$/i },
];

const ROLE_KEYWORDS = /(engineer|developer|manager|analyst|consultant|lead|associate|president|intern|architect|designer|specialist|officer|administrator|coordinator)/i;
const COMPANY_KEYWORDS = /(bank|consulting|technologies|technology|solutions|services|systems|corp|company|limited|ltd|llp|pvt|private|deutsche|barclays|infosys|deloitte|accenture|wipro|tcs|hcl|ibm|capgemini|salesforce|pune|india|mumbai|bengaluru|bangalore|hyderabad|chennai|gurgaon|noida)/i;
const LOCATION_ONLY_PATTERN = /^(india|pune|mumbai|bengaluru|bangalore|hyderabad|chennai|gurgaon|noida|remote|onsite|location)$/i;
const DATE_RANGE_PATTERN = /((?:\b\d{1,2}\/\d{4}\b)|(?:\b\d{4}\b)|(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}\b))(?:\s*(?:-|–|to)\s*)((?:current|present|((?:\b\d{1,2}\/\d{4}\b)|(?:\b\d{4}\b)|(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}\b))))/i;
const BULLET_VERB_PATTERN = /^(architected|assisted|built|created|delivered|designed|developed|did|fixed|handled|helped|implemented|integrated|launched|led|made|managed|migrated|optimized|owned|participated|received|recognized|recommended|resolved|spearheaded|supported|tested|worked)\b/i;
const SKILL_LABEL_PATTERN = /^(languages?|web|database|databases|tools|concepts|frontend|backend|infra|backend & infra|soft skills|architecture|platforms|cloud|frameworks?)\s*:\s*/i;

export function parseResumeTextToSections(resumeText: string): ParsedResumeSource {
  const lines = normalizeLines(resumeText);
  const sections = splitSections(lines);
  const summary = extractSummary(sections, lines);
  const skills = extractSkills(sections, lines);
  const experience = extractExperienceEntries(sections.experience, sections.projects, lines);

  return {
    experience: experience.length > 0 ? experience : buildFallbackExperience(lines),
    skills,
    summary,
  };
}

function normalizeLines(resumeText: string) {
  return resumeText
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[•·▪◦]/g, '•').trim())
    .filter(Boolean);
}

function splitSections(lines: string[]): ResumeSections {
  const sections: ResumeSections = {
    certifications: [],
    education: [],
    experience: [],
    projects: [],
    skills: [],
    summary: [],
  };

  let currentSection: keyof ResumeSections | null = null;

  for (const line of lines) {
    const nextSection = SECTION_ALIASES.find((item) => item.pattern.test(line))?.key ?? null;

    if (nextSection) {
      currentSection = nextSection;
      continue;
    }

    if (currentSection) {
      sections[currentSection].push(line);
    }
  }

  return sections;
}

function extractSummary(sections: ResumeSections, lines: string[]) {
  if (sections.summary.length > 0) {
    return sections.summary.slice(0, 4).join(' ').trim() || undefined;
  }

  return lines.find((line) => line.length > 60 && !isSectionHeader(line) && !looksLikeMetaLine(line));
}

function extractSkills(sections: ResumeSections, lines: string[]) {
  const source = sections.skills.length > 0 ? sections.skills : lines.filter((line) => /^skills?/i.test(line));
  let normalized = source
    .flatMap((line) => normalizeSkillLine(line))
    .map(cleanSkillToken)
    .filter((skill) => Boolean(skill) && !looksLikeMetaLine(skill) && skill !== '.')
    .filter((skill) => !/^skills?$/i.test(skill));

  if (normalized.length === 0) {
    const inlineSkillsText = lines
      .filter((line) => /^skills?/i.test(line))
      .map((line) => line.replace(/^skills?\s*:?/i, '').trim())
      .join(' ');

    normalized = inlineSkillsText
      .split(/[|,\n]/)
      .flatMap((part) => part.split(/\s+/))
      .map(cleanSkillToken)
      .filter((skill) => skill.length >= 2)
      .filter((skill) => !/^skills?$/i.test(skill));
  }

  return normalized.filter(
    (skill, index) => normalized.findIndex((item) => item.toLowerCase() === skill.toLowerCase()) === index
  );
}

function normalizeSkillLine(line: string) {
  const cleaned = line.replace(/^skills?\s*:?/i, '').replace(SKILL_LABEL_PATTERN, '').trim();
  const segments = cleaned
    .split(/[|,]/)
    .flatMap((segment) => segment.split(/\s{2,}/))
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 1 && !/[|,]/.test(cleaned)) {
    return cleaned.split(/\s+/).map((segment) => segment.trim()).filter(Boolean);
  }

  return segments;
}

function cleanSkillToken(skill: string) {
  return skill
    .replace(SKILL_LABEL_PATTERN, '')
    .replace(/^[\s\-•]+/, '')
    .replace(/[\s,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractExperienceEntries(experienceLines: string[], projectLines: string[], allLines: string[]) {
  const experienceEntries = buildExperienceBlocks(experienceLines).map(parseExperienceBlock);
  const projectEntries = parseProjectEntries(projectLines);
  const fallbackEntries = experienceEntries.length === 0 && projectEntries.length === 0
    ? buildExperienceBlocks(allLines).map(parseExperienceBlock)
    : [];

  return [...experienceEntries, ...projectEntries, ...fallbackEntries].filter(
    (entry): entry is ExperienceEntry => entry.bullets.length > 0
  );
}

function parseProjectEntries(projectLines: string[]) {
  if (projectLines.length === 0) {
    return [];
  }

  const entries: ExperienceEntry[] = [];
  let currentProject: { title: string; bullets: string[] } | null = null;

  for (let index = 0; index < projectLines.length; index++) {
    const rawLine = projectLines[index];
    const line = cleanMetaLine(rawLine);
    if (!line) {
      continue;
    }

    const nextLine = cleanMetaLine(projectLines[index + 1] ?? '');

    if (looksLikeProjectHeader(line) || looksLikeProjectTitleLine(line, nextLine)) {
      if (currentProject && currentProject.bullets.length > 0) {
        entries.push({
          bullets: currentProject.bullets,
          company: 'Project',
          role: currentProject.title,
        });
      }

      currentProject = {
        title: line.replace(/^\d+[.)]\s*/, '').trim(),
        bullets: [],
      };
      continue;
    }

    if (!currentProject) {
      continue;
    }

    currentProject.bullets.push(cleanBullet(line));
  }

  if (currentProject && currentProject.bullets.length > 0) {
    entries.push({
      bullets: currentProject.bullets,
      company: 'Project',
      role: currentProject.title,
    });
  }

  return entries;
}

function buildExperienceBlocks(lines: string[]) {
  const blocks: string[][] = [];
  let current: string[] = [];
  let seenBulletInBlock = false;

  for (const line of lines) {
    if (isSectionHeader(line)) {
      flush();
      continue;
    }

    const entryStart = looksLikeEntryHeader(line);
    if (entryStart && current.length > 0 && seenBulletInBlock) {
      flush();
    }

    current.push(line);

    if (isBulletLine(line)) {
      seenBulletInBlock = true;
    }
  }

  flush();
  return blocks;

  function flush() {
    if (current.length > 0) {
      blocks.push(current);
    }
    current = [];
    seenBulletInBlock = false;
  }
}

function parseExperienceBlock(lines: string[]): ExperienceEntry {
  const metaLines: string[] = [];
  const bullets: string[] = [];

  if (lines.length > 0) {
    const combinedMeta = parseCombinedMetaLine(lines[0]);
    if (combinedMeta) {
      return {
        bullets: lines.slice(1).map((line) => cleanBullet(line)).filter(Boolean),
        company: combinedMeta.company || 'Current Company',
        role: combinedMeta.role || 'Current Role',
      };
    }
  }

  for (const rawLine of lines) {
    const line = cleanMetaLine(rawLine);
    if (!line) {
      continue;
    }

    if (isBulletLine(rawLine)) {
      bullets.push(cleanBullet(rawLine));
      continue;
    }

    if (looksLikeAchievementSentence(line)) {
      bullets.push(cleanBullet(line));
      continue;
    }

    metaLines.push(line);
  }

  const meta = resolveMeta(metaLines);

  const fallbackCompany = meta.role && /intern/i.test(meta.role) ? 'Internship' : 'Current Company';

  return {
    bullets: collapseWrappedBullets(bullets),
    company: meta.company || fallbackCompany,
    role: meta.role || 'Current Role',
  };
}

function resolveMeta(metaLines: string[]): MetaParts {
  const parts: MetaParts = {
    company: '',
    dates: [],
    role: '',
  };

  for (const line of metaLines) {
    const cleaned = cleanMetaLine(line);
    const withoutDates = stripDateFragments(cleaned);

    if (looksLikePersonalInfoLine(cleaned)) {
      continue;
    }

    if (!parts.role && looksLikeRoleLine(cleaned)) {
      parts.role = withoutDates;
      continue;
    }

    if (looksLikeDateLine(cleaned)) {
      parts.dates.push(extractDateText(cleaned));
      if (!parts.role && looksLikeRoleLine(withoutDates)) {
        parts.role = withoutDates;
        continue;
      }
      if (!parts.company && looksLikeCompanyLine(withoutDates) && !isWeakCompanyValue(withoutDates)) {
        parts.company = withoutDates;
      }
      continue;
    }

    if (!parts.company && looksLikeCompanyLine(cleaned) && !isWeakCompanyValue(cleaned)) {
      parts.company = cleaned;
      continue;
    }

    if (!parts.role && !looksLikeCompanyLine(cleaned) && !isWeakCompanyValue(cleaned)) {
      parts.role = cleaned;
    }
  }

  if (parts.dates.length > 0) {
    const datesText = parts.dates.filter(Boolean).join(' | ');
    parts.company = [parts.company, datesText].filter(Boolean).join(' | ');
  }

  return {
    company: parts.company.trim(),
    dates: parts.dates,
    role: parts.role.trim().replace(/[,:-]+$/g, ''),
  };
}

function looksLikePersonalInfoLine(line: string) {
  const cleaned = cleanMetaLine(line).toLowerCase();
  return (
    /\b(name|email|phone|mobile|linkedin|github)\b/.test(cleaned) ||
    /@/.test(cleaned) ||
    /^(skills?|education|experience|projects?|summary|objective|certifications?|profile|about)\b/i.test(cleaned)
  );
}

function collapseWrappedBullets(bullets: string[]) {
  const cleaned = bullets.map((bullet) => bullet.trim()).filter(Boolean);
  return cleaned.filter((bullet) => !looksLikeMetaLine(bullet));
}

function buildFallbackExperience(lines: string[]) {
  const fallbackBullets = lines
    .filter(
      (line) =>
        isBulletLine(line) ||
        looksLikeAchievementSentence(line) ||
        /\b(project|internship|intern|frontend|backend|api|system|app|website)\b/i.test(line)
    )
    .filter((line) => !looksLikeMetaLine(line) && !/^skills?/i.test(line) && !isSectionHeader(line))
    .slice(0, 8)
    .map((line) => cleanBullet(line));

  return fallbackBullets.length > 0
    ? [
        {
          bullets: fallbackBullets,
          company: 'Current Company',
          role: 'Current Role',
        },
      ]
    : [];
}

function looksLikeEntryHeader(line: string) {
  return looksLikeRoleLine(line) || looksLikeCompanyLine(line) || looksLikeDateLine(line);
}

function isSectionHeader(line: string) {
  return SECTION_ALIASES.some((item) => item.pattern.test(line));
}

function looksLikeRoleLine(line: string) {
  const cleaned = stripDateFragments(cleanMetaLine(line));
  if (!cleaned || isBulletLine(cleaned) || looksLikeCompanyLine(cleaned)) {
    return false;
  }

  return ROLE_KEYWORDS.test(cleaned) && cleaned.split(' ').length <= 8;
}

function looksLikeCompanyLine(line: string) {
  const cleaned = stripDateFragments(cleanMetaLine(line));
  if (!cleaned || isBulletLine(cleaned) || isWeakCompanyValue(cleaned)) {
    return false;
  }

  return COMPANY_KEYWORDS.test(cleaned);
}

function looksLikeDateLine(line: string) {
  return DATE_RANGE_PATTERN.test(cleanMetaLine(line));
}

function looksLikeMetaLine(line: string) {
  return looksLikeRoleLine(line) || looksLikeCompanyLine(line) || looksLikeDateLine(line);
}

function looksLikeAchievementSentence(line: string) {
  return BULLET_VERB_PATTERN.test(cleanBullet(line));
}

function looksLikeProjectHeader(line: string) {
  return /^\d+[.)]\s+.+/.test(line);
}

function looksLikeProjectTitleLine(line: string, nextLine: string) {
  if (!line || !nextLine) {
    return false;
  }

  if (isSectionHeader(line) || looksLikeDateLine(line) || looksLikeRoleLine(line)) {
    return false;
  }

  if (/[.!?]$/.test(line)) {
    return false;
  }

  if (line.split(/\s+/).length > 8) {
    return false;
  }

  return /\b(app|system|website|dashboard|portal|platform|management|tracker|study|application)\b/i.test(line) ||
    looksLikeAchievementSentence(nextLine) ||
    /^[A-Z][A-Za-z0-9+\-()\s/&]+$/.test(line);
}

function isBulletLine(line: string) {
  return /^[\-*•]/.test(line) || looksLikeAchievementSentence(line);
}

function isWeakCompanyValue(line: string) {
  const cleaned = cleanMetaLine(line).toLowerCase();
  return !cleaned || LOCATION_ONLY_PATTERN.test(cleaned) || cleaned === 'india team' || cleaned === 'team' || cleaned === 'company';
}

function cleanBullet(line: string) {
  return line.replace(/^[\-*•]\s*/, '').replace(/\s+/g, ' ').trim();
}

function cleanMetaLine(line: string) {
  return line.replace(/[•]/g, ' ').replace(/\s+/g, ' ').trim();
}

function stripDateFragments(line: string) {
  return cleanMetaLine(line)
    .replace(DATE_RANGE_PATTERN, '')
    .replace(/\(\s*\)/g, '')
    .replace(/[-|]+$/g, '')
    .replace(/^[-|]+/g, '')
    .replace(/\s+[|—-]\s*$/g, '')
    .trim();
}

function extractDateText(line: string) {
  const match = cleanMetaLine(line).match(DATE_RANGE_PATTERN);
  return match?.[0]?.trim() ?? '';
}

function parseCombinedMetaLine(line: string) {
  const cleaned = cleanMetaLine(line);
  const dateText = extractDateText(cleaned);

  if (!dateText || !/[—-]/.test(cleaned)) {
    return null;
  }

  const withoutDates = stripDateFragments(cleaned);
  const parts = withoutDates.split(/\s+[—-]\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  const [role, ...companyParts] = parts;
  const companyBase = companyParts.join(' — ').replace(/\(\s*\)/g, '').trim();
  const company = [companyBase, dateText].filter(Boolean).join(' | ');

  return {
    company,
    dates: dateText ? [dateText] : [],
    role,
  };
}
