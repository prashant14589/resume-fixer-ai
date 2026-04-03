import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../theme/palette';

export function InsightBanner({
  currentScore,
  improvedScore,
  roleTarget,
}: {
  currentScore: number;
  improvedScore: number;
  roleTarget?: string;
}) {
  const uplift = improvedScore - currentScore;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Personalized insight</Text>
      <Text style={styles.title}>
        Your resume can likely improve by {uplift} points{roleTarget ? ` for ${roleTarget} roles` : ''}.
      </Text>
      <Text style={styles.copy}>
        The biggest drag is not lack of experience. It is weak phrasing, low keyword relevance, and ATS-unfriendly structure.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#14263F',
    borderColor: palette.strokeStrong,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  eyebrow: {
    color: palette.warning,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: palette.text,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 28,
  },
  copy: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
});
