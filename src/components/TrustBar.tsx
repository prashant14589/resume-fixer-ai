import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../theme/palette';

export function TrustBar({ items }: { items: string[] }) {
  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <View key={item} style={styles.badge}>
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    backgroundColor: palette.panelSoft,
    borderColor: palette.stroke,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
});
