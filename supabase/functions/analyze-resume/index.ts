// @ts-nocheck

type AnalyzeResumeRequest = {
  fileBase64?: string;
  fileName?: string;
  jobDescription?: string;
  mimeType?: string;
  resumeText?: string;
};

type AnalyzeResumeResponse = {
  atsScore: number;
  improvedScore: number;
  summary: string;
  issues: string[];
  missingKeywords: string[];
  matchScore?: number;
  improvedResume: {
    summary: string;
    experience: Array<{
      role: string;
      company: string;
      bullets: string[];
    }>;
    skills: string[];
  };
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

    const response = Deno.env.get('OPENAI_API_KEY')
      ? await analyzeWithOpenAI({ ...body, resumeText })
      : mockAnalyzeResponse({ ...body, resumeText });

    return json({
      ...response,
      mode: Deno.env.get('OPENAI_API_KEY') ? 'live' : 'mock',
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

async function analyzeWithOpenAI(body: AnalyzeResumeRequest): Promise<AnalyzeResumeResponse> {
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
          role: 'system',
          content: [{ text: buildSystemPrompt(), type: 'input_text' }],
        },
        {
          role: 'user',
          content: [{ text: buildUserPrompt(body), type: 'input_text' }],
        },
      ],
      text: {
        format: {
          name: 'resume_analysis',
          schema: {
            additionalProperties: false,
            properties: {
              ats_score: { type: 'number' },
              improved_score: { type: 'number' },
              summary: { type: 'string' },
              issues: { items: { type: 'string' }, type: 'array' },
              missing_keywords: { items: { type: 'string' }, type: 'array' },
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
                        bullets: { items: { type: 'string' }, type: 'array' },
                      },
                      required: ['role', 'company', 'bullets'],
                    },
                  },
                  skills: { items: { type: 'string' }, type: 'array' },
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
            type: 'object',
          },
          type: 'json_schema',
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const outputText = payload.output?.[0]?.content?.[0]?.text ?? payload.output_text;

  if (!outputText) {
    throw new Error('OpenAI did not return structured output text.');
  }

  const parsed = JSON.parse(outputText);

  return {
    atsScore: parsed.ats_score,
    improvedResume: parsed.improved_resume,
    improvedScore: parsed.improved_score,
    issues: parsed.issues,
    matchScore: parsed.match_score ?? null,
    missingKeywords: parsed.missing_keywords,
    summary: parsed.summary,
  } as AnalyzeResumeResponse;
}

function mockAnalyzeResponse(body: AnalyzeResumeRequest): AnalyzeResumeResponse {
  return {
    atsScore: 39,
    improvedScore: 84,
    summary:
      'Your resume will likely be rejected in its current form because it reads like duties, not outcomes, and it misses multiple recruiter and ATS keywords.',
    issues: [
      'Professional summary is weak and does not position you for shortlisting.',
      'Experience bullets sound like responsibilities instead of achievements.',
      'Important hiring keywords are missing.',
      'Projects are not framed with clear business or user impact.',
      'Skills are broad and not prioritized for the target role.',
    ],
    missingKeywords: body.jobDescription?.trim()
      ? ['React', 'REST APIs', 'Problem Solving', 'Internship']
      : ['Internship', 'Projects', 'Optimization'],
    matchScore: body.jobDescription?.trim() ? 57 : null,
    improvedResume: {
      experience: [
        {
          bullets: [
            'Built and improved project features using modern frontend practices, increasing usability and making demos easier to navigate for reviewers.',
            'Integrated API-based flows and reduced manual steps, improving workflow clarity across end-to-end project execution.',
            'Improved testing and debugging turnaround by identifying UI issues early and shipping cleaner iterations faster.',
          ],
          company: 'Academic Projects',
          role: 'Software Developer',
        },
      ],
      skills: ['React', 'JavaScript', 'REST APIs', 'Problem Solving', 'HTML', 'CSS'],
      summary:
        'Fresher software engineer with hands-on experience building projects in React and API-driven workflows, focused on shipping practical features and improving user experience.',
    },
  };
}

function buildSystemPrompt() {
  return `
Act as a senior HR recruiter and ATS optimization expert for the Indian job market.
Be brutally honest about rejection risk.
Use strong action verbs and measurable impact wherever reasonably supported.
Tailor output to fresher, internship, and project-heavy resumes when relevant.
Do not invent companies, dates, degrees, certifications, or metrics.
Return strict JSON only.
`.trim();
}

function buildUserPrompt(body: AnalyzeResumeRequest) {
  return `
Resume:
${body.resumeText}

Job Description:
${body.jobDescription ?? ''}

Output rules:
- Return ATS score from 0 to 100.
- Return improved score representing expected score after applying the rewritten resume.
- Summary must mention rejection risk if the resume is weak.
- Missing keywords should be specific and useful.
- Improved resume must contain a professional summary, experience entries, and skills.
- Experience bullets must use strong action verbs and achievement framing.
- Tailor to the job description if provided.
`.trim();
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

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};
