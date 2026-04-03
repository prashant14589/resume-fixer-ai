import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../theme/palette';

export function ScoreCard({
  currentScore,
  improvedScore,
  label,
}: {
  currentScore: number;
  improvedScore: number;
  label: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>ATS Snapshot</Text>
      <View style={styles.row}>
        <View style={styles.scoreBlock}>
          <Text style={styles.label}>Current score</Text>
          <Text style={styles.currentScore}>{currentScore}</Text>
        </View>
        <View style={styles.scoreBlock}>
          <Text style={styles.label}>After fix</Text>
          <Text style={styles.improvedScore}>{improvedScore}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.badge}>{label}</Text>
        <Text style={styles.delta}>+{improvedScore - currentScore} point upside</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#102035',
    borderColor: palette.strokeStrong,
    borderRadius: 28,
    borderWidth: 1,
    gap: 18,
    padding: 20,
  },
  heading: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  scoreBlock: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: palette.stroke,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    padding: 16,
  },
  label: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  currentScore: {
    color: palette.warning,
    fontSize: 42,
    fontWeight: '800',
    marginTop: 8,
  },
  improvedScore: {
    color: palette.mint,
    fontSize: 42,
    fontWeight: '800',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A2A3F',
    borderRadius: 999,
    color: palette.text,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  delta: {
    color: palette.mint,
    fontSize: 14,
    fontWeight: '700',
  },
});
