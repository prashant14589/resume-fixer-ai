import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../theme/palette';

export function PlanCard({
  amount,
  credits,
  highlighted,
  note,
  subtitle,
  title,
}: {
  amount: string;
  credits: string;
  highlighted: boolean;
  note?: string;
  subtitle: string;
  title: string;
}) {
  return (
    <View style={[styles.card, highlighted ? styles.cardHighlighted : null]}>
      <View style={styles.topRow}>
        <View style={styles.copyGroup}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {highlighted ? <Text style={styles.badge}>Best Value</Text> : null}
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.amountGroup}>
          <Text style={styles.amount}>{amount}</Text>
          <Text style={styles.credits}>{credits}</Text>
        </View>
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.panel,
    borderColor: palette.stroke,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  cardHighlighted: {
    borderColor: palette.mint,
    backgroundColor: '#12253E',
    shadowColor: palette.mint,
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  copyGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '700',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  badge: {
    backgroundColor: palette.mint,
    borderRadius: 999,
    color: palette.bg,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bottomRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  amountGroup: {
    gap: 4,
  },
  amount: {
    color: palette.text,
    fontSize: 32,
    fontWeight: '800',
  },
  credits: {
    color: palette.mint,
    fontSize: 15,
    fontWeight: '700',
  },
  note: {
    color: palette.warning,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
});
