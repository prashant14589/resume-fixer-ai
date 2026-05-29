import { invokeSupabaseFunction, isSupabaseConfigured } from './supabase';

const MOCK_COVER_LETTER = `Dear Hiring Manager,

I am writing to express my strong interest in this role. With hands-on project experience in building and shipping software features, I am confident I can contribute from day one.

During my academic projects, I built API-driven web modules that reduced manual effort and improved reliability under load. I have practical experience with data structures, algorithms, and collaborative development workflows, and I take ownership of problems end-to-end rather than waiting for direction.

What draws me to your organisation is the opportunity to work on products used by real users. I grew up in a Tier 2 city and understand firsthand what it means to build software that is fast, accessible, and genuinely useful on a budget Android device with a 4G connection.

I am a quick learner who communicates proactively, writes clean maintainable code, and thrives in small teams where every contribution is visible.

Thank you for your time. I look forward to discussing how my background fits your team's goals.

Warm regards,
[Your Name]`;

export interface GenerateCoverLetterInput {
  resumeText: string;
  jobDescription: string;
  rolePreset: string;
}

export interface GenerateCoverLetterOutput {
  coverLetterText: string;
}

export async function generateCoverLetter(
  input: GenerateCoverLetterInput,
): Promise<GenerateCoverLetterOutput> {
  if (!isSupabaseConfigured()) {
    await new Promise<void>((resolve) => setTimeout(resolve, 1600));
    return { coverLetterText: MOCK_COVER_LETTER };
  }
  return invokeSupabaseFunction<GenerateCoverLetterOutput>(
    'generate-cover-letter',
    input as unknown as Record<string, unknown>,
  );
}
