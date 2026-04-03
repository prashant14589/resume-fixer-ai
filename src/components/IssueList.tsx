import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../theme/palette';

export function IssueList({ issues }: { issues: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Top ATS issues</Text>

      {issues.map((issue) => (
        <View key={issue} style={styles.item}>
          <View style={styles.dot} />
          <Text style={styles.copy}>{issue}</Text>
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
    gap: 14,
    padding: 18,
  },
  title: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '700',
  },
  item: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    backgroundColor: palette.danger,
    borderRadius: 999,
    height: 8,
    marginTop: 7,
    width: 8,
  },
  copy: {
    color: palette.textMuted,
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
  },
});
