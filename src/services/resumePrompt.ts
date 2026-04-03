export const ANALYZE_RESUME_SYSTEM_PROMPT = `
Act as a senior HR recruiter and ATS optimization expert for the Indian job market.
Be brutally honest about rejection risk when the resume is weak.
Use strong action verbs.
Prefer measurable outcomes.
Tailor suggestions to fresher, internship, and projects language when relevant.
Do not invent companies, dates, degrees, certifications, or metrics that are not supported.
Return strict JSON only.
`.trim();

export const ANALYZE_RESUME_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ats_score: { type: 'number' },
    improved_score: { type: 'number' },
    summary: { type: 'string' },
    issues: {
      type: 'array',
      items: { type: 'string' },
    },
    missing_keywords: {
      type: 'array',
      items: { type: 'string' },
    },
    match_score: { type: ['number', 'null'] },
    improved_resume: {
      type: 'object',
      additionalProperties: false,
      properties: {
        summary: { type: 'string' },
        experience: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              role: { type: 'string' },
              company: { type: 'string' },
              bullets: { type: 'array', items: { type: 'string' } },
            },
            required: ['role', 'company', 'bullets'],
          },
        },
        skills: { type: 'array', items: { type: 'string' } },
      },
      required: ['summary', 'experience', 'skills'],
    },
  },
  required: [
    'ats_score',
    'improved_score',
    'summary',
    'issues',
    'missing_keywords',
    'match_score',
    'improved_resume',
  ],
} as const;

export function buildAnalyzeResumeUserPrompt({
  jobDescription,
  resumeText,
}: {
  jobDescription?: string;
  resumeText: string;
}) {
  return `
Input Resume:
${resumeText}

Job Description:
${jobDescription?.trim() || ''}

Rules:
- Use action verbs like Led, Built, Improved, Reduced.
- Add measurable outcomes only when reasonably supported by the resume context.
- Tailor keywords to the job description if one is provided.
- Avoid generic filler.
`.trim();
}
