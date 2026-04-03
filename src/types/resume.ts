export type SelectedResume = {
  mimeType: string;
  name: string;
  size: number;
  uri: string;
};

export type AnalyzeResumeInput = {
  jobDescription?: string;
  resumeText?: string;
  selectedResume?: SelectedResume | null;
};

export type ImprovedExperience = {
  bullets: string[];
  company: string;
  role: string;
};

export type ImprovedResume = {
  experience: ImprovedExperience[];
  skills: string[];
  summary: string;
};

export type ResumeAnalysis = {
  atsScore: number;
  improvedScore: number;
  improvedResume: ImprovedResume;
  issues: string[];
  matchScore?: number | null;
  missingKeywords: string[];
  summary: string;
};

export type ResumeScanRecord = {
  analysis: ResumeAnalysis;
  createdAt: string;
  id: string;
  isUnlocked: boolean;
  paymentId?: string;
  resumeTitle: string;
  sourceResumeText: string;
  sourceJobDescription?: string;
};

export type GeneratedResumeSection = {
  points: string[];
  title: string;
};
