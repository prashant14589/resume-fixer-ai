// @ts-nocheck

import { scoreResumeAgainstJob } from '../_shared/atsEvaluator.ts';
import { parseResumeTextToSections } from '../_shared/resumeParser.ts';
import { buildPreviewPrompt } from '../_shared/rewritePrompts.ts';

type AnalyzeResumeRequest = {
  fileBase64?: string;
  fileName?: string;
  jobDescription?: string;
  mimeType?: string;
  rolePreset?: string;
  resumeText?: string;
};

type AnalyzeResumeResponse = {
  atsScore: number;
  breakdown: {
    bullet: { max: number; raw: number };
    formatting: { max: number; raw: number };
    keyword: { max: number; raw: number };
    quant: { max: number; raw: number };
    structure: { max: number; raw: number };
  };
  improvedResume: {
    experience: Array<{
      bullets: string[];
      company: string;
      role: string;
    }>;
    skills: string[];
    summary: string;
  };
  improvedScore: number;
  issues: string[];
  matchScore?: number | null;
  missingKeywords: string[];
  preview?: {
    after: string;
    before: string;
  };
  summary: string;
  weakBullets: string[];
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await request.json()) as AnalyzeResumeRequest;
    const resumeText = extractResumeText(body);

    if (!resumeText.trim()) {
      return json({ error: 'resume text could not be extracted' }, 400);
    }

    const hasJobDescription = !!body.jobDescription?.trim();
    const rolePreset = resolveRolePreset(body.rolePreset, resumeText);
    const baseline = scoreResumeAgainstJob(resumeText, body.jobDescription, rolePreset);
    const parsed = parseResumeTextToSections(resumeText);
    const previewCandidate =
      parsed.experience.flatMap((item) => item.bullets).find((bullet) => !hasMetric(bullet)) ?? baseline.weakBullets[0] ?? '';
    const preview =
      previewCandidate && Deno.env.get('OPENAI_API_KEY')
        ? {
            after: await previewWeakestBullet(previewCandidate, rolePreset),
            before: previewCandidate,
          }
        : previewCandidate
          ? {
              after: buildFallbackPreview(previewCandidate),
              before: previewCandidate,
            }
          : undefined;

    return json({
      atsScore: baseline.totalScore,
      breakdown: baseline.breakdown,
      improvedResume: {
        experience: parsed.experience,
        skills: parsed.skills,
        summary: parsed.summary ?? buildFallbackSummaryFromSkills(parsed.skills),
      },
      improvedScore: baseline.totalScore,
      issues: buildIssues(baseline, hasJobDescription),
      matchScore: hasJobDescription ? baseline.breakdown.keyword.raw : null,
      missingKeywords: hasJobDescription ? baseline.missingKeywords : [],
      mode: Deno.env.get('OPENAI_API_KEY') ? 'live' : 'mock',
      preview,
      summary: buildSummary(baseline.totalScore),
      weakBullets: baseline.weakBullets,
    });
  } catch (error) {
    return json(
      {
        error: 'Failed to analyze resume',
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

async function previewWeakestBullet(weakestBullet: string, rolePreset: string) {
  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
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
            content: [{ text: buildPreviewPrompt({ bullet: weakestBullet, rolePreset }), type: 'input_text' }],
          },
        ],
        max_output_tokens: 80,
      }),
    });

    if (!response.ok) {
      return '';
    }

    const payload = await response.json();
    return (payload.output?.[0]?.content?.[0]?.text ?? payload.output_text ?? '').trim();
  } catch {
    return '';
  }
}

function buildFallbackPreview(bullet: string) {
  return strengthenWeakBullet(bullet);
}

function buildSummary(score: number) {
  if (score < 50) {
    return 'Your resume is currently weak against ATS screening and needs stronger keywords, quantified bullets, and cleaner structure.';
  }

  if (score < 75) {
    return 'Your resume has some shortlist potential, but it still needs sharper bullet quality, stronger metrics, and better ATS alignment.';
  }

  return 'Your resume is fairly strong, but a tighter rewrite can still improve ATS alignment and recruiter readability.';
}

function buildIssues(
  result: {
    breakdown: AnalyzeResumeResponse['breakdown'];
    missingKeywords: string[];
    totalScore: number;
    weakBullets: string[];
  },
  hasJobDescription: boolean
) {
  const issues: string[] = [];

  if ((result.breakdown?.quant.raw ?? 0) < 60) {
    issues.push('Bullet points lack measurable results and need more quantified impact.');
  }

  if ((result.breakdown?.bullet.raw ?? 0) < 70) {
    issues.push('Several bullets still read like responsibilities instead of achievement-led statements.');
  }

  if (hasJobDescription && result.missingKeywords.length > 0) {
    issues.push(`Important hiring keywords are missing: ${result.missingKeywords.slice(0, 4).join(', ')}.`);
  }

  if ((result.breakdown?.formatting.raw ?? 0) < 70) {
    issues.push('Formatting and section consistency can still hurt ATS readability.');
  }

  if ((result.breakdown?.structure.raw ?? 0) < 70) {
    issues.push('Section structure is incomplete or not clearly labeled for ATS parsing.');
  }

  if (issues.length === 0 && result.totalScore < 85) {
    issues.push('The resume needs sharper positioning for the target role to improve shortlist chances.');
  }

  return issues.slice(0, 5);
}

function extractResumeText(body: AnalyzeResumeRequest) {
  if (body.resumeText?.trim()) {
    return body.resumeText.trim();
  }

  if (!body.fileBase64) {
    return '';
  }

  const mimeType = body.mimeType ?? '';

  if (mimeType === 'text/plain' || body.fileName?.endsWith('.txt')) {
    return decodeBase64(body.fileBase64);
  }

  if (
    mimeType === 'application/pdf' ||
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    throw new Error(
      'File was uploaded successfully, but PDF and DOCX parsing is not enabled yet. Use pasted text for live AI now, or add a parser in the next backend slice.'
    );
  }

  throw new Error('Unsupported file type for live AI analysis.');
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
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

  return cleaned;
}

function hasMetric(value: string) {
  return /\b\d+([.,]\d+)?(%|x)?\b|₹|\$|\b\d+\s*(users|clients|hours|days|weeks|months|projects|teams|issues|operations|elements)\b/i.test(value);
}

function buildFallbackSummaryFromSkills(skills: string[]) {
  if (skills.length === 0) return '';
  const topSkills = skills.slice(0, 3).join(', ');
  return `Motivated developer with hands-on project experience in ${topSkills}. Eager to apply technical skills in a professional environment.`;
}

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};
