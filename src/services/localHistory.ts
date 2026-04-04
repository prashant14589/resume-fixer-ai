import AsyncStorage from '@react-native-async-storage/async-storage';

import { ResumeAnalysis, ResumeScanRecord } from '../types/resume';
import { marketingAnalysis } from '../data/marketingDemo';

const STORAGE_KEY = 'resume-fixer-ai/history';

export async function saveScanToHistory(
  payload: {
    analysis: ResumeAnalysis;
    sourceJobDescription?: string;
    sourceRolePreset?: string;
    sourceResumeText: string;
    title: string;
  }
): Promise<ResumeScanRecord> {
  const history = await getScanHistory();

  const record: ResumeScanRecord = {
    analysis: payload.analysis,
    createdAt: new Date().toISOString(),
    id: `${Date.now()}`,
    isUnlocked: false,
    resumeTitle: payload.title,
    sourceJobDescription: payload.sourceJobDescription,
    sourceRolePreset: payload.sourceRolePreset,
    sourceResumeText: payload.sourceResumeText,
  };

  const nextHistory = [record, ...history].slice(0, 10);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));

  return record;
}

export async function getScanHistory(): Promise<ResumeScanRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown[];
    return Array.isArray(parsed) ? parsed.map(normalizeRecord).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function unlockScanRecord(recordId: string, paymentId: string) {
  const history = await getScanHistory();

  const nextHistory = history.map((item) =>
    item.id === recordId ? { ...item, isUnlocked: true, paymentId } : item
  );

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
  return nextHistory.find((item) => item.id === recordId) ?? null;
}

export async function updateScanAnalysis(recordId: string, analysis: ResumeAnalysis, paymentId?: string) {
  const history = await getScanHistory();

  const nextHistory = history.map((item) =>
    item.id === recordId
      ? {
          ...item,
          analysis,
          isUnlocked: true,
          paymentId: paymentId ?? item.paymentId,
        }
      : item
  );

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
  return nextHistory.find((item) => item.id === recordId) ?? null;
}

function normalizeRecord(raw: any): ResumeScanRecord {
  const analysis = normalizeAnalysis(raw?.analysis);
  const title =
    raw?.resumeTitle ||
    raw?.resumeName ||
    firstMeaningfulLine(raw?.sourceResumeText) ||
    'Resume Fix';

  return {
    analysis,
    createdAt: raw?.createdAt || new Date().toISOString(),
    id: raw?.id || `${Date.now()}-${Math.random()}`,
    isUnlocked: Boolean(raw?.isUnlocked),
    paymentId: raw?.paymentId,
    resumeTitle: title,
    sourceJobDescription: raw?.sourceJobDescription,
    sourceRolePreset: raw?.sourceRolePreset ?? 'general',
    sourceResumeText: raw?.sourceResumeText || '',
  };
}

function normalizeAnalysis(raw: any): ResumeAnalysis {
  if (raw?.atsScore && raw?.improvedResume) {
    return {
      atsScore: Number(raw.atsScore) || marketingAnalysis.atsScore,
      improvedResume: raw.improvedResume,
      improvedScore: Number(raw.improvedScore) || marketingAnalysis.improvedScore,
      issues: Array.isArray(raw.issues) ? raw.issues : marketingAnalysis.issues,
      matchScore: raw.matchScore ?? null,
      missingKeywords: Array.isArray(raw.missingKeywords)
        ? raw.missingKeywords
        : marketingAnalysis.missingKeywords,
      summary: raw.summary || marketingAnalysis.summary,
    };
  }

  return {
    atsScore: Number(raw?.scoreBefore) || marketingAnalysis.atsScore,
    improvedResume: marketingAnalysis.improvedResume,
    improvedScore: Number(raw?.scoreAfterEstimate) || marketingAnalysis.improvedScore,
    issues: Array.isArray(raw?.issues) ? raw.issues : marketingAnalysis.issues,
    matchScore: null,
    missingKeywords: marketingAnalysis.missingKeywords,
    summary:
      raw?.label === 'Needs work'
        ? marketingAnalysis.summary
        : raw?.summary || marketingAnalysis.summary,
  };
}

function firstMeaningfulLine(value?: string) {
  return value
    ?.split('\n')
    .map((line) => line.trim())
    .find(Boolean);
}
