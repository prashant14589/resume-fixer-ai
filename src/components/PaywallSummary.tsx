import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../theme/palette';

export function PaywallSummary() {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Unlock includes</Text>
      <Text style={styles.title}>Your ATS-ready resume package</Text>
      <View style={styles.grid}>
        <Feature label="Full rewritten resume" />
        <Feature label="Stronger bullet points" />
        <Feature label="Cleaner ATS-safe structure" />
        <Feature label="Instant PDF export" />
      </View>
      <Text style={styles.footnote}>
        Honest promise: we improve clarity, structure, and ATS readiness. We do not guarantee interviews.
      </Text>
    </View>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#12253E',
    borderColor: palette.strokeStrong,
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  eyebrow: {
    color: palette.mint,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  feature: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: palette.stroke,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  featureText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  footnote: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
