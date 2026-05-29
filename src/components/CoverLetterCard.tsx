import React, { useState } from 'react';
import { Alert, Clipboard, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../theme/palette';

interface CoverLetterCardProps {
  coverLetterText: string;
}

export function CoverLetterCard({ coverLetterText }: CoverLetterCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    Clipboard.setString(coverLetterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Cover Letter</Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.8}>
          <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll} nestedScrollEnabled>
        <Text style={styles.body}>{coverLetterText}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.panel,
    borderColor: palette.mint,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: palette.stroke,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { color: palette.text, fontSize: 15, fontWeight: '700' },
  copyBtn: {
    backgroundColor: palette.mint,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  copyBtnText: { color: palette.bg, fontSize: 13, fontWeight: '700' },
  scroll: { maxHeight: 260 },
  body: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 22,
    padding: 16,
  },
});
