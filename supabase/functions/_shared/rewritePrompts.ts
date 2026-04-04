export function buildSummaryPrompt(args: {
  currentSummary?: string;
  currentSkills: string[];
  jobDescription?: string;
  missingKeywords: string[];
  rolePreset: string;
}) {
  return `You are rewriting only the professional summary of a resume for an Indian job seeker.

Goal:
- improve ATS keyword alignment
- keep facts unchanged
- sound sharper and more credible
- inject relevant missing keywords naturally
- do not introduce tools, technologies, domains, or achievements not present in the resume or job description
- always return a non-empty summary
- include 3 to 5 skills from Current skills list only

Current skills:
${args.currentSkills.join(', ')}

Missing keywords:
${args.missingKeywords.join(', ')}

Role target:
${args.rolePreset}

Job description:
${args.jobDescription ?? ''}

Current summary:
${args.currentSummary ?? ''}

Return JSON:
{ "summary": "..." }`;
}

export function buildBulletRewritePrompt(args: {
  jobDescription?: string;
  missingKeywords: string[];
  quantScore: number;
  rolePreset: string;
  weakBullets: string[];
}) {
  return `You are rewriting only weak resume bullets.

Rules:
- preserve facts
- use strong action verbs
- rewrite only the bullets provided, no extra bullets
- improve only the weakest 1 to 3 bullets provided
- keep each rewrite tightly aligned to the original scope (no new tools, certifications, domains, or ownership claims)
- if the original bullet has a metric, preserve or sharpen that metric
- if the original bullet has no metric, do not invent numbers
- inject missing keywords naturally
- return the exact original bullet in "before"
- return the improved bullet in "after"
- do not skip any bullet
- no commentary

Current quant score:
${args.quantScore}

Missing keywords:
${args.missingKeywords.join(', ')}

Role target:
${args.rolePreset}

Job description:
${args.jobDescription ?? ''}

Weak bullets:
${args.weakBullets.map((bullet, index) => `${index + 1}. ${bullet}`).join('\n')}

Return JSON:
{
  "rewrites": [
    { "before": "...", "after": "..." }
  ]
}`;
}

export function buildSkillsPrompt(args: {
  currentSkills: string[];
  missingKeywords: string[];
  rolePreset: string;
}) {
  return `You are optimizing only the skills section of a resume.

Rules:
- keep it ATS-friendly
- prioritize role-relevant skills
- include missing keywords where appropriate
- do not add irrelevant tools
- do not hallucinate: output only skills present in current skills or missing keywords
- keep strong original skills if they are still relevant
- return 8 to 16 total skills
- output clean skill names only, no prefixes like Frontend:, Backend:, Soft Skills:, or punctuation fragments

Current skills:
${args.currentSkills.join(', ')}

Missing keywords:
${args.missingKeywords.join(', ')}

Role target:
${args.rolePreset}

Return JSON:
{
  "skills": ["...", "..."]
}`;
}

export function buildPreviewPrompt(args: { bullet: string; rolePreset: string }) {
  return `Rewrite this single resume bullet to be ATS-optimized for ${args.rolePreset} roles.

Rules:
- Use a strong action verb.
- Preserve metrics only if already present; do not invent numbers.
- Do NOT add technologies, adjectives, or details not present in the original.
- Keep the scope and specificity of the original; only improve structure and verb choice.
- Output only the rewritten bullet, no commentary.

Original: "${args.bullet}"`;
}
