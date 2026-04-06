// @ts-nocheck

import { scoreImprovedResume, scoreResumeAgainstJob } from '../_shared/atsEvaluator.ts';
import { parseResumeTextToSections } from '../_shared/resumeParser.ts';
import { buildBulletRewritePrompt, buildSkillsPrompt, buildSummaryPrompt } from '../_shared/rewritePrompts.ts';

type GenerateResumeFixRequest = {
  jobDescription?: string;
  rolePreset?: string;
  resumeText?: string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await request.json()) as GenerateResumeFixRequest;
    const resumeText = body.resumeText?.trim() ?? '';

    if (!resumeText) {
      return json({ error: 'resume text is required' }, 400);
    }

    const rolePreset = resolveRolePreset(body.rolePreset, resumeText);
    const baseline = scoreResumeAgainstJob(resumeText, body.jobDescription, rolePreset);
    const parsed = parseResumeTextToSections(resumeText);
    const allExperienceBullets = parsed.experience.flatMap((item) => item.bullets);
    const quantWeakBullets =
      baseline.breakdown.quant.raw < 70 ? allExperienceBullets.filter((bullet) => !hasMetric(bullet)) : [];
    const bulletsToRewrite = dedupeByNormalizedBullet([...baseline.weakBullets, ...quantWeakBullets]).slice(0, 3);
    const projectCount = parsed.experience.filter((item) => item.company.toLowerCase() === 'project').length;

    const [summaryResult, bulletResult, skillsResult] = await Promise.all([
      rewriteSummary(parsed.summary, parsed.skills, baseline.missingKeywords, rolePreset, body.jobDescription),
      rewriteBullets(
        bulletsToRewrite,
        baseline.breakdown.quant.raw,
        baseline.missingKeywords,
        rolePreset,
        projectCount,
        body.jobDescription
      ),
      optimizeSkills(parsed.skills, baseline.missingKeywords, rolePreset, Boolean(body.jobDescription?.trim())),
    ]);

    const improvedResume = assembleImprovedResume(parsed, {
      rewrittenBullets: bulletResult,
      rewrittenSkills: skillsResult,
      rewrittenSummary: summaryResult,
    });
    const rescored = scoreResumeAgainstJob(
      buildScoringResumeText(resumeText, improvedResume),
      body.jobDescription,
      rolePreset
    );

    return json({
      breakdown: rescored.breakdown,
      improvedResume,
      improvedScore: rescored.totalScore,
      scoreDelta: Math.max(0, rescored.totalScore - baseline.totalScore),
    });
  } catch (error) {
    return json(
      {
        error: 'Failed to generate resume fix',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

async function rewriteSummary(
  currentSummary: string | undefined,
  currentSkills: string[],
  missingKeywords: string[],
  rolePreset: string,
  jobDescription?: string
) {
  const summarySeed = buildGuaranteedSummary(currentSummary, currentSkills, rolePreset);

  if (!Deno.env.get('OPENAI_API_KEY')) {
    return summarySeed;
  }

  try {
    const payload = await callJsonOpenAI(
      buildSummaryPrompt({
        currentSummary: summarySeed,
        currentSkills,
        jobDescription,
        missingKeywords,
        rolePreset,
      }),
      {
        properties: {
          summary: { type: 'string' },
        },
        required: ['summary'],
        type: 'object',
      },
      180
    );

    return sanitizeSummary(summarySeed, payload.summary ?? summarySeed, currentSkills, missingKeywords, rolePreset);
  } catch {
    return summarySeed;
  }
}

async function rewriteBullets(
  weakBullets: string[],
  quantScore: number,
  missingKeywords: string[],
  rolePreset: string,
  projectCount: number,
  jobDescription?: string
) {
  if (weakBullets.length === 0) {
    return [];
  }

  if (!Deno.env.get('OPENAI_API_KEY')) {
    return weakBullets.map((bullet) => ({
      after: strengthenWeakBullet(bullet),
      before: bullet,
    }));
  }

  try {
    const payload = await callJsonOpenAI(
      buildBulletRewritePrompt({
        jobDescription,
        missingKeywords,
        quantScore,
        rolePreset,
        weakBullets: weakBullets.slice(0, 3),
      }),
      {
        properties: {
          rewrites: {
            items: {
              properties: {
                after: { type: 'string' },
                before: { type: 'string' },
              },
              required: ['before', 'after'],
              type: 'object',
            },
            type: 'array',
          },
        },
        required: ['rewrites'],
        type: 'object',
      },
      320
    );

    return sanitizeBulletRewrites(
      weakBullets,
      Array.isArray(payload.rewrites) ? payload.rewrites : [],
      projectCount
    );
  } catch {
    return weakBullets.map((bullet) => ({
      after: strengthenWeakBullet(bullet),
      before: bullet,
    }));
  }
}

async function optimizeSkills(
  currentSkills: string[],
  missingKeywords: string[],
  rolePreset: string,
  hasJobDescription: boolean
) {
  if (!Deno.env.get('OPENAI_API_KEY')) {
    return currentSkills;
  }

  try {
    const payload = await callJsonOpenAI(
      buildSkillsPrompt({
        currentSkills,
        missingKeywords,
        rolePreset,
      }),
      {
        properties: {
          skills: { items: { type: 'string' }, type: 'array' },
        },
        required: ['skills'],
        type: 'object',
      },
      180
    );

    return sanitizeSkills(
      currentSkills,
      Array.isArray(payload.skills) ? payload.skills : [],
      missingKeywords,
      hasJobDescription
    );
  } catch {
    return currentSkills;
  }
}

function sanitizeBulletRewrites(
  weakBullets: string[],
  rewrites: Array<{ after?: string; before?: string }>,
  projectCount: number
) {
  const rewriteMap = new Map(
    rewrites
      .filter((item) => typeof item.before === 'string' && typeof item.after === 'string')
      .map((item) => [normalizeBullet(item.before ?? ''), (item.after ?? '').trim()])
  );

  return weakBullets.map((before) => {
    const candidate = rewriteMap.get(normalizeBullet(before));
    const improved = candidate ? normalizeBulletLead(candidate, before) : strengthenWeakBullet(before);

    return {
      after: enforceSafeQuantification(before, improved, projectCount),
      before,
    };
  });
}

function strengthenWeakBullet(bullet: string) {
  const cleaned = bullet.replace(/^[\-*•\s]+/, '').trim();
  const replacements: Array<[RegExp, string]> = [
    [/^assisted in building\s+/i, 'Built '],
    [/^supported in building\s+/i, 'Built '],
    [/^worked on\s+/i, 'Contributed to '],
    [/^helped\s+/i, 'Contributed to '],
    [/^assisted\s+/i, 'Supported '],
    [/^responsible for\s+/i, 'Owned '],
    [/^part of\s+/i, 'Contributed to '],
    [/^involved in\s+/i, 'Executed '],
    [/^participated in\s+/i, 'Collaborated in '],
    [/^fixed\s+/i, 'Resolved '],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(cleaned)) {
      return cleaned.replace(pattern, replacement).replace(/\s+/g, ' ').trim();
    }
  }

  const [firstWord, ...rest] = cleaned.split(/\s+/);
  if (!firstWord) {
    return bullet;
  }

  return [capitalizeWord(firstWord), ...rest].join(' ');
}

function normalizeBulletLead(candidate: string, originalBullet: string) {
  const cleaned = candidate.replace(/^[\-*•\s]+/, '').trim();

  if (/^developed in building\s+/i.test(cleaned)) {
    return cleaned.replace(/^developed in building\s+/i, 'Built ');
  }

  if (/^supported in building\s+/i.test(cleaned)) {
    return cleaned.replace(/^supported in building\s+/i, 'Built ');
  }

  if (/^supported in\s+/i.test(cleaned)) {
    return cleaned.replace(/^supported in\s+/i, 'Supported ');
  }

  if (/^supported\s+/i.test(cleaned)) {
    return cleaned.replace(/^supported\s+/i, 'Supported ');
  }

  if (/^participated in\s+/i.test(cleaned)) {
    return cleaned.replace(/^participated in\s+/i, 'Collaborated in ');
  }

  if (/^fixed\s+/i.test(cleaned)) {
    return cleaned.replace(/^fixed\s+/i, 'Resolved ');
  }

  if (/^helped\s+/i.test(cleaned) || /^assisted\s+/i.test(cleaned) || /^worked on\s+/i.test(cleaned)) {
    return strengthenWeakBullet(cleaned);
  }

  return cleaned || originalBullet;
}

function enforceSafeQuantification(before: string, after: string, projectCount: number) {
  const normalizedBefore = before.trim();
  const normalizedAfter = after.trim();

  if (!normalizedAfter) {
    return strengthenWeakBullet(normalizedBefore);
  }

  if (hasMetric(normalizedBefore)) {
    return normalizedAfter;
  }

  const inferredProjectMetricAllowed = projectCount > 0 && /\b(project|app|system|website|dashboard|portal)\b/i.test(normalizedBefore);
  if (inferredProjectMetricAllowed && /\b\d+\s+projects?\b/i.test(normalizedAfter)) {
    return normalizedAfter;
  }

  return stripGeneratedMetricPhrases(normalizedAfter);
}

function stripGeneratedMetricPhrases(value: string) {
  return value
    .replace(/,?\s*(delivering|supporting|integrating|improving|reducing)\s+\d+(\+)?[^,.]*[,.]?/gi, '')
    .replace(/\b\d+(\+)?\s*(users|clients|hours|days|weeks|months|projects|teams|issues|modules|elements|outcomes?)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/[;,\s]+$/g, '')
    .trim();
}

function hasMetric(value: string) {
  return /\b\d+([.,]\d+)?(%|x)?\b|₹|\$|\b\d+\s*(users|clients|hours|days|weeks|months|projects|teams)\b/i.test(value);
}

function capitalizeWord(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function sanitizeSkills(
  currentSkills: string[],
  generatedSkills: string[],
  missingKeywords: string[],
  hasJobDescription: boolean
) {
  const allowed = buildAllowedSkillSet(currentSkills, missingKeywords, hasJobDescription);

  const cleanedGenerated = generatedSkills
    .map(cleanSkillName)
    .filter(Boolean)
    .filter((skill) => allowed.has(normalizePhrase(skill)));

  const fallbackCurrent = currentSkills.map(cleanSkillName).filter(Boolean);
  const merged = mergeSkills(fallbackCurrent, cleanedGenerated);

  if (merged.length >= 8) {
    return merged.slice(0, 16);
  }

  for (const skill of fallbackCurrent) {
    if (!merged.some((item) => item.toLowerCase() === skill.toLowerCase())) {
      merged.push(skill);
    }
    if (merged.length >= 8) {
      break;
    }
  }

  return merged.slice(0, 16);
}

function buildAllowedSkillSet(currentSkills: string[], missingKeywords: string[], includeMissingKeywords: boolean) {
  const allowed = new Set<string>();
  const sourceSkills = includeMissingKeywords ? [...currentSkills, ...missingKeywords] : currentSkills;

  for (const skill of sourceSkills) {
    const cleaned = cleanSkillName(skill);
    if (!cleaned) {
      continue;
    }

    if (looksLikeSkill(cleaned)) {
      allowed.add(normalizePhrase(cleaned));
    }
  }

  return allowed;
}

function buildGuaranteedSummary(currentSummary: string | undefined, currentSkills: string[], rolePreset: string) {
  const safeSkills = currentSkills
    .map(cleanSkillName)
    .filter(Boolean)
    .slice(0, 5);

  const roleLabel =
    rolePreset === 'software-dev' ? 'software developer' : rolePreset === 'data-analyst' ? 'data analyst' : 'professional';

  const trimmedSummary = (currentSummary ?? '').trim();
  const useCurrentSummary =
    trimmedSummary.length >= 40 && !/^(looking for|seeking|objective\b)/i.test(trimmedSummary.toLowerCase());

  if (useCurrentSummary && safeSkills.length > 0) {
    return `${trimmedSummary} Core skills include ${safeSkills.slice(0, 5).join(', ')}.`;
  }

  if (safeSkills.length > 0) {
    return `Entry-level ${roleLabel} with practical experience in ${safeSkills.slice(0, 5).join(', ')} and strong execution on projects and internships.`;
  }

  return `Entry-level ${roleLabel} with practical project experience and a strong foundation in core job skills.`;
}

function sanitizeSummary(
  currentSummary: string,
  generatedSummary: string,
  currentSkills: string[],
  missingKeywords: string[],
  rolePreset: string
) {
  const allowed = buildAllowedSkillSet(currentSkills, missingKeywords, true);
  const generatedTerms = extractExplicitTechTerms(generatedSummary);
  const hasDisallowedTerm = generatedTerms.some((term) => !allowed.has(normalizePhrase(term)));

  if (hasDisallowedTerm) {
    return buildGuaranteedSummary(currentSummary, currentSkills, rolePreset);
  }

  const cleaned = generatedSummary.trim();
  if (!cleaned) {
    return buildGuaranteedSummary(currentSummary, currentSkills, rolePreset);
  }

  return cleaned;
}

function extractExplicitTechTerms(value: string) {
  return value
    .split(/[^A-Za-z0-9.+#/()-]+/)
    .map((part) => cleanSkillName(part))
    .filter(Boolean)
    .filter((part) => /[A-Z+#.]|api|sql|react|node|python|java|mongodb|mysql|typescript|javascript|testing|agile|spring|git/i.test(part));
}

function looksLikeSkill(value: string) {
  const phrase = value.trim();
  if (!phrase || phrase.split(/\s+/).length > 4) {
    return false;
  }

  if (/\b(responsible|experience|years|ability|strong|excellent|knowledge|understanding)\b/i.test(phrase)) {
    return false;
  }

  return true;
}

function cleanSkillName(value: string) {
  return value
    .replace(/^[-*•\s]+/, '')
    .replace(/^[A-Za-z ]+:\s*/, '')
    .replace(/[;:.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePhrase(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function dedupeByNormalizedBullet(bullets: string[]) {
  return bullets.filter(
    (bullet, index) => bullets.findIndex((value) => normalizeBullet(value) === normalizeBullet(bullet)) === index
  );
}

function buildScoringResumeText(
  originalResumeText: string,
  improvedResume: ReturnType<typeof assembleImprovedResume>
) {
  const experienceSection = improvedResume.experience
    .map((item) => [item.role, item.company, ...item.bullets.map((bullet) => `- ${bullet}`)].join('\n'))
    .join('\n\n');

  return [
    originalResumeText.trim(),
    'PROFESSIONAL SUMMARY',
    improvedResume.summary,
    'EXPERIENCE',
    experienceSection,
    'SKILLS',
    improvedResume.skills.join(', '),
  ]
    .filter(Boolean)
    .join('\n\n');
}

function resolveRolePreset(rolePreset: string | undefined, resumeText: string) {
  if (rolePreset && rolePreset !== 'general') {
    return rolePreset;
  }

  const normalized = resumeText.toLowerCase();

  if (/\breact\b|\bjavascript\b|\bjava\b|\bpython\b|\brest api\b|\bgithub\b|\bweb development\b/.test(normalized)) {
    return 'software-dev';
  }

  if (/\bpower bi\b|\btableau\b|\bpandas\b|\betl\b|\bdata analysis\b/.test(normalized)) {
    return 'data-analyst';
  }

  return 'general';
}

function assembleImprovedResume(
  parsed: ReturnType<typeof parseResumeTextToSections>,
  rewrites: {
    rewrittenBullets: Array<{ after: string; before: string }>;
    rewrittenSkills: string[];
    rewrittenSummary: string;
  }
) {
  const bulletMap = new Map(
    rewrites.rewrittenBullets.map((item) => [normalizeBullet(item.before), item.after.trim()])
  );
  const mergedSkills = mergeSkills(parsed.skills, rewrites.rewrittenSkills);

  return {
    experience: parsed.experience.map((item) => ({
      ...item,
      bullets: item.bullets.map((bullet) => bulletMap.get(normalizeBullet(bullet)) ?? bullet),
    })),
    skills: mergedSkills,
    summary: rewrites.rewrittenSummary || parsed.summary || '',
  };
}

async function callJsonOpenAI(prompt: string, schema: Record<string, unknown>, maxOutputTokens: number) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          input: [
            {
              role: 'user',
              content: [{ text: prompt, type: 'input_text' }],
            },
          ],
          max_output_tokens: maxOutputTokens,
          text: {
            format: {
              name: 'resume_fix',
              schema: {
                additionalProperties: false,
                ...schema,
              },
              type: 'json_schema',
              strict: true,
            },
          },
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text();
        const err = new Error(`OpenAI request failed: ${response.status} ${bodyText}`);
        // Don't retry 4xx client errors (bad key, invalid schema, etc.)
        if (response.status >= 400 && response.status < 500) {
          throw err;
        }
        throw err;
      }

      const payload = await response.json();
      const outputText = payload.output?.[0]?.content?.[0]?.text ?? payload.output_text;

      if (!outputText) {
        throw new Error('OpenAI did not return structured output text.');
      }

      return JSON.parse(outputText);
    } catch (error) {
      lastError = error;
      // Don't retry 4xx client errors
      const message = error instanceof Error ? error.message : '';
      if (/OpenAI request failed: 4\d\d/.test(message)) {
        throw error;
      }
      if (attempt < 2) {
        await new Promise<void>((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}

function mergeSkills(originalSkills: string[], rewrittenSkills: string[]) {
  const merged = [...originalSkills, ...rewrittenSkills]
    .map((skill) => skill.trim())
    .filter(Boolean);

  return merged.filter((skill, index) => merged.findIndex((value) => value.toLowerCase() === skill.toLowerCase()) === index);
}

function normalizeBullet(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};
