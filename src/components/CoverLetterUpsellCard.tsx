import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../theme/palette';

interface CoverLetterUpsellCardProps {
  isGenerating: boolean;
  onGenerate: () => void;
}

export function CoverLetterUpsellCard({ isGenerating, onGenerate }: CoverLetterUpsellCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>ADD-ON</Text>
      </View>
      <Text style={styles.heading}>Add a matching cover letter</Text>
      <Text style={styles.subtext}>
        Tailored to this job description. Ready in 30 seconds.
      </Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹79</Text>
        <Text style={styles.strike}>₹199</Text>
      </View>
      <TouchableOpacity
        onPress={onGenerate}
        disabled={isGenerating}
        style={[styles.btn, isGenerating && styles.btnDisabled]}
        activeOpacity={0.85}
      >
        {isGenerating ? (
          <ActivityIndicator size="small" color={palette.bg} />
        ) : (
          <Text style={styles.btnText}>Generate Cover Letter</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.panelSoft,
    borderColor: palette.strokeStrong,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.warning,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: palette.bg, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heading: { color: palette.text, fontSize: 17, fontWeight: '700' },
  subtext: { color: palette.textMuted, fontSize: 13, lineHeight: 19 },
  priceRow: { alignItems: 'baseline', flexDirection: 'row', gap: 8 },
  price: { color: palette.mint, fontSize: 22, fontWeight: '800' },
  strike: { color: palette.textMuted, fontSize: 14, textDecorationLine: 'line-through' },
  btn: {
    alignItems: 'center',
    backgroundColor: palette.mint,
    borderRadius: 14,
    paddingVertical: 14,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: palette.bg, fontSize: 15, fontWeight: '700' },
});
