import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export async function shareOnWhatsApp(uri: string, beforeScore: number, afterScore: number) {
  if (Platform.OS === 'web') {
    throw new Error('Image sharing is available on a native device only.');
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri, {
    dialogTitle: `My resume score improved from ${beforeScore} to ${afterScore}`,
    mimeType: 'image/png',
  });
}
