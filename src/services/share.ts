import * as Linking from 'expo-linking';

export async function shareOnWhatsApp(beforeScore: number, afterScore: number) {
  const message = `Bro my resume score went from ${beforeScore} to ${afterScore} 😳\nTry this: https://resume-fixer-ai.app`;
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
}
