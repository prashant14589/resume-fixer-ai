import { invokeSupabaseFunction, isSupabaseConfigured } from './supabase';
import { AnalyzeResumeInput, ResumeFixResult } from '../types/resume';

export async function generateResumeFix(input: AnalyzeResumeInput): Promise<ResumeFixResult> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured yet.');
  }

  return invokeSupabaseFunction<ResumeFixResult>('generate-resume-fix', {
    jobDescription: input.jobDescription ?? '',
    rolePreset: input.rolePreset ?? 'general',
    resumeText: input.resumeText ?? '',
  });
}
