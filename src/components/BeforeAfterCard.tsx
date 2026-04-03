import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../theme/palette';

export function BeforeAfterCard({ before, after }: { before: string; after: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Before vs after</Text>

      <View style={styles.block}>
        <Text style={styles.label}>Before</Text>
        <Text style={styles.before}>{before}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>After</Text>
        <Text style={styles.after}>{after}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.panel,
    borderColor: palette.stroke,
    borderRadius: 22,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  title: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '700',
  },
  block: {
    gap: 8,
  },
  label: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  before: {
    color: palette.warning,
    fontSize: 15,
    lineHeight: 23,
  },
  after: {
    color: palette.mint,
    fontSize: 15,
    lineHeight: 23,
  },
});
