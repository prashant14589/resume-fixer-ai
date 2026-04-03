import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'resume-fixer-ai/credits';

export async function getCredits() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const parsed = Number(raw ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function addCredits(count: number) {
  const current = await getCredits();
  const next = current + count;
  await AsyncStorage.setItem(STORAGE_KEY, String(next));
  return next;
}

export async function consumeCredit() {
  const current = await getCredits();

  if (current <= 0) {
    throw new Error('No paid credits available.');
  }

  const next = current - 1;
  await AsyncStorage.setItem(STORAGE_KEY, String(next));
  return next;
}
