import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../theme/palette';

export function QuickWinsCard({ items }: { items: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>What gets better after unlock</Text>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <View style={styles.tick} />
          <Text style={styles.copy}>{item}</Text>
        </View>
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
    gap: 12,
    padding: 18,
  },
  title: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  tick: {
    backgroundColor: palette.mint,
    borderRadius: 999,
    height: 9,
    marginTop: 7,
    width: 9,
  },
  copy: {
    color: palette.textMuted,
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
  },
});
