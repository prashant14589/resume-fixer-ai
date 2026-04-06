import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

export async function shareOnWhatsApp(uri: string, beforeScore: number, afterScore: number) {
  if (Platform.OS === 'web') {
    throw new Error('Image sharing is available on a native device only.');
  }

  const message = `My resume ATS score jumped from ${beforeScore} to ${afterScore} with Resume Fixer AI! Get yours fixed at: https://play.google.com/store/apps/details?id=com.resumefixer.ai`;

  // Try image share first (requires ViewShot capture to have succeeded)
  if (uri) {
    try {
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: `My resume score jumped from ${beforeScore} to ${afterScore}!`,
          mimeType: 'image/png',
        });
        return;
      }
    } catch {
      // fall through to text share
    }
  }

  // Fallback: native text share sheet (always works, targets WhatsApp)
  await Share.share({ message });
}
