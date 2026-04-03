import { StyleSheet, Text, View } from 'react-native';

import { ResumeScanRecord } from '../types/resume';
import { palette } from '../theme/palette';

export function HistoryCard({ items }: { items: ResumeScanRecord[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Recent scans</Text>

      {items.length === 0 ? (
        <Text style={styles.empty}>No scans saved yet. Analyze one resume and it will show up here.</Text>
      ) : null}

      {items.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.row}>
            <Text style={styles.resumeName}>{item.resumeTitle}</Text>
            <Text style={styles.score}>{item.analysis.improvedScore}</Text>
          </View>
          <Text style={styles.meta}>
            Score {item.analysis.atsScore} to {item.analysis.improvedScore}
          </Text>
          <Text style={styles.meta}>{item.isUnlocked ? 'Unlocked' : 'Locked'}</Text>
          <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
        </View>
      ))}
    </View>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString();
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.panel,
    borderColor: palette.stroke,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  title: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '700',
  },
  empty: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  item: {
    borderTopColor: palette.stroke,
    borderTopWidth: 1,
    gap: 4,
    paddingTop: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resumeName: {
    color: palette.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 12,
  },
  score: {
    color: palette.mint,
    fontSize: 18,
    fontWeight: '800',
  },
  meta: {
    color: palette.textMuted,
    fontSize: 13,
  },
});
