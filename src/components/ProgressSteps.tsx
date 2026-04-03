import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../theme/palette';

export function ProgressSteps({ steps }: { steps: string[] }) {
  return (
    <View style={styles.card}>
      {steps.map((step, index) => (
        <View key={step} style={styles.row}>
          <View style={styles.indexWrap}>
            <Text style={styles.index}>{index + 1}</Text>
          </View>
          <Text style={styles.copy}>{step}</Text>
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
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  indexWrap: {
    alignItems: 'center',
    backgroundColor: '#163048',
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  index: {
    color: palette.mint,
    fontSize: 13,
    fontWeight: '800',
  },
  copy: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
