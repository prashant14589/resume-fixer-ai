import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = 'resume-fixer-ai/dpdp-consent';

export async function hasGivenConsent(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(CONSENT_KEY);
  return raw === 'true';
}

export async function saveConsent(): Promise<void> {
  await AsyncStorage.setItem(CONSENT_KEY, 'true');
}
