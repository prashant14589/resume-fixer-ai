export type SelectedResume = {
  mimeType: string;
  name: string;
  size: number;
  uri: string;
};

export type AnalyzeResumeInput = {
  jobDescription?: string;
  rolePreset?: string;
  resumeText?: string;
  selectedResume?: SelectedResume | null;
};

export type ScoreBreakdownDimension = {
  max: number;
  raw: number;
};

export type ScoreBreakdown = {
  bullet: ScoreBreakdownDimension;
  formatting: ScoreBreakdownDimension;
  keyword: ScoreBreakdownDimension;
  quant: ScoreBreakdownDimension;
  structure: ScoreBreakdownDimension;
};

export type ResumePreview = {
  after: string;
  before: string;
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
  breakdown?: ScoreBreakdown;
  improvedScore: number;
  improvedResume: ImprovedResume;
  issues: string[];
  matchScore?: number | null;
  missingKeywords: string[];
  preview?: ResumePreview;
  summary: string;
};

export type ResumeFixResult = {
  breakdown: ScoreBreakdown;
  improvedResume: ImprovedResume;
  improvedScore: number;
  scoreDelta: number;
};

export type ResumeScanRecord = {
  analysis: ResumeAnalysis;
  createdAt: string;
  id: string;
  isUnlocked: boolean;
  paymentId?: string;
  resumeTitle: string;
  sourceRolePreset?: string;
  sourceResumeText: string;
  sourceJobDescription?: string;
};

export type GeneratedResumeSection = {
  points: string[];
  title: string;
};
