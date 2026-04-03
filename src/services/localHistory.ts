import AsyncStorage from '@react-native-async-storage/async-storage';

import { ResumeAnalysis, ResumeScanRecord } from '../types/resume';

const STORAGE_KEY = 'resume-fixer-ai/history';

export async function saveScanToHistory(
  payload: {
    analysis: ResumeAnalysis;
    sourceJobDescription?: string;
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
    const parsed = JSON.parse(raw) as ResumeScanRecord[];
    return Array.isArray(parsed) ? parsed : [];
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
