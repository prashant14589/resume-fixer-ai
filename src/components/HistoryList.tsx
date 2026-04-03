import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ResumeScanRecord } from '../types/resume';
import { palette } from '../theme/palette';

export function HistoryList({
  items,
  onSelect,
}: {
  items: ResumeScanRecord[];
  onSelect: (item: ResumeScanRecord) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Scan history</Text>
      <Text style={styles.subtitle}>Re-open a previous result to preview score changes and output.</Text>

      {items.length === 0 ? (
        <Text style={styles.empty}>No saved scans yet. Run one resume analysis and it will show here.</Text>
      ) : null}

      {items.map((item) => (
        <TouchableOpacity key={item.id} activeOpacity={0.9} onPress={() => onSelect(item)} style={styles.item}>
          <View style={styles.row}>
            <Text style={styles.resumeName}>{item.resumeTitle}</Text>
            <Text style={styles.score}>{item.analysis.improvedScore}</Text>
          </View>
          <Text style={styles.meta}>
            Score {item.analysis.atsScore} to {item.analysis.improvedScore}
          </Text>
          <Text style={styles.meta}>{item.isUnlocked ? 'Unlocked result' : 'Payment required to unlock result'}</Text>
          <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
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
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  empty: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  item: {
    backgroundColor: palette.panelSoft,
    borderColor: palette.stroke,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    padding: 14,
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
