import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { analyzeResumeMock } from './resumeAnalysis';
import { invokeSupabaseFunction, isSupabaseConfigured } from './supabase';
import { AnalyzeResumeInput, ResumeAnalysis } from '../types/resume';

type AnalyzeResumeFunctionResponse = ResumeAnalysis & {
  mode?: 'live' | 'mock';
};

export async function analyzeResume(input: AnalyzeResumeInput): Promise<ResumeAnalysis> {
  if (!isSupabaseConfigured()) {
    return analyzeResumeMock(input);
  }

  return retryAnalyzeResume(input, 2);
}

async function analyzeResumeWithSupabase(input: AnalyzeResumeInput): Promise<ResumeAnalysis> {
  const resumeText = await resolveResumeText(input);
  const fileBase64 = await resolveResumeBase64(input);

  if (!resumeText.trim() && !fileBase64) {
    throw new Error(
      'Add resume text or use a plain text file for live AI testing. PDF and DOCX parsing will be added in the next backend slice.'
    );
  }

  const response = await invokeSupabaseFunction<AnalyzeResumeFunctionResponse>('analyze-resume', {
    fileBase64,
    fileName: input.selectedResume?.name,
    jobDescription: input.jobDescription ?? '',
    mimeType: input.selectedResume?.mimeType,
    resumeText,
  });

  return response;
}

async function retryAnalyzeResume(input: AnalyzeResumeInput, retriesRemaining: number): Promise<ResumeAnalysis> {
  try {
    return await analyzeResumeWithSupabase(input);
  } catch (error) {
    if (retriesRemaining <= 0) {
      throw error;
    }

    await wait(900);
    return retryAnalyzeResume(input, retriesRemaining - 1);
  }
}

async function resolveResumeText(input: AnalyzeResumeInput): Promise<string> {
  if (input.resumeText?.trim()) {
    return input.resumeText.trim();
  }

  if (!input.selectedResume?.uri) {
    return '';
  }

  if (input.selectedResume.mimeType === 'text/plain' || input.selectedResume.name.endsWith('.txt')) {
    if (Platform.OS === 'web') {
      return readTextFromUriWeb(input.selectedResume.uri);
    }

    return FileSystem.readAsStringAsync(input.selectedResume.uri);
  }

  return '';
}

async function resolveResumeBase64(input: AnalyzeResumeInput): Promise<string> {
  if (!input.selectedResume?.uri) {
    return '';
  }

  if (input.resumeText?.trim()) {
    return '';
  }

  if (Platform.OS === 'web') {
    return readBase64FromUriWeb(input.selectedResume.uri);
  }

  return FileSystem.readAsStringAsync(input.selectedResume.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

async function readTextFromUriWeb(uri: string): Promise<string> {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error('Failed to read selected file in the browser.');
  }

  return response.text();
}

async function readBase64FromUriWeb(uri: string): Promise<string> {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error('Failed to read selected file in the browser.');
  }

  const blob = await response.blob();

  return blobToBase64(blob);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to convert file to base64.'));
    reader.onloadend = () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        reject(new Error('Unexpected file reader result.'));
        return;
      }

      const [, base64 = ''] = result.split(',');
      resolve(base64);
    };

    reader.readAsDataURL(blob);
  });
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
