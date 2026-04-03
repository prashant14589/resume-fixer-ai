import { marketingAnalysis } from '../data/marketingDemo';
import { AnalyzeResumeInput, ResumeAnalysis } from '../types/resume';

export async function analyzeResumeMock(input: AnalyzeResumeInput): Promise<ResumeAnalysis> {
  await wait(1600);

  const sourceLength = input.resumeText?.length ?? input.selectedResume?.name.length ?? 0;
  const scoreShift = Math.min(Math.max(sourceLength % 5, 0), 4);
  const jdBoost = input.jobDescription?.trim() ? 6 : 0;

  return {
    ...marketingAnalysis,
    atsScore: Math.max(28, marketingAnalysis.atsScore - scoreShift),
    improvedScore: marketingAnalysis.improvedScore + jdBoost,
    matchScore: input.jobDescription?.trim() ? (marketingAnalysis.matchScore ?? 51) + 12 : undefined,
  };
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
