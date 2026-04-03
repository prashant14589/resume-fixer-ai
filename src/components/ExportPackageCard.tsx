import { StyleSheet, Text, View } from 'react-native';

import { GeneratedResumeSection } from '../types/resume';
import { palette } from '../theme/palette';

export function ExportPackageCard({
  sections,
  summary,
}: {
  sections: GeneratedResumeSection[];
  summary: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Unlocked resume package</Text>
      <Text style={styles.title}>Improved content ready for PDF export</Text>
      <Text style={styles.summary}>{summary}</Text>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.points.map((point) => (
            <View key={point} style={styles.pointRow}>
              <View style={styles.dot} />
              <Text style={styles.point}>{point}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#102035',
    borderColor: palette.strokeStrong,
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  kicker: {
    color: palette.mint,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: palette.text,
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 30,
  },
  summary: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: palette.warning,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pointRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    backgroundColor: palette.mint,
    borderRadius: 999,
    height: 8,
    marginTop: 7,
    width: 8,
  },
  point: {
    color: palette.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
