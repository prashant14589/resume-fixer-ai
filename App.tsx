import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { BeforeAfterCard } from './src/components/BeforeAfterCard';
import { ExportPackageCard } from './src/components/ExportPackageCard';
import { HistoryCard } from './src/components/HistoryCard';
import { HistoryList } from './src/components/HistoryList';
import { InsightBanner } from './src/components/InsightBanner';
import { IssueList } from './src/components/IssueList';
import { PaywallSummary } from './src/components/PaywallSummary';
import { PlanCard } from './src/components/PlanCard';
import { ProgressSteps } from './src/components/ProgressSteps';
import { QuickWinsCard } from './src/components/QuickWinsCard';
import { ScoreCard } from './src/components/ScoreCard';
import { TrustBar } from './src/components/TrustBar';
import { marketingPlans, processingSteps } from './src/data/marketingDemo';
import { getScanHistory, saveScanToHistory } from './src/services/localHistory';
import { analyzeResume } from './src/services/resumeApi';
import { isSupabaseConfigured } from './src/services/supabase';
import { palette } from './src/theme/palette';
import { ResumeAnalysis, ResumeScanRecord, SelectedResume } from './src/types/resume';

type Screen = 'hero' | 'upload' | 'processing' | 'results' | 'paywall' | 'download' | 'history';
const defaultTargetRole = process.env.EXPO_PUBLIC_ANALYZE_ROLE || 'Software Engineer';

export default function App() {
  const [screen, setScreen] = useState<Screen>('hero');
  const [selectedResume, setSelectedResume] = useState<SelectedResume | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [history, setHistory] = useState<ResumeScanRecord[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ResumeScanRecord | null>(null);
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualResumeText, setManualResumeText] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const backendReady = isSupabaseConfigured();

  useEffect(() => {
    void loadHistory();
  }, []);

  async function loadHistory() {
    const nextHistory = await getScanHistory();
    setHistory(nextHistory);
  }

  async function handlePickResume() {
    try {
      setIsPickingFile(true);

      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
        ],
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      setSelectedResume({
        mimeType: asset.mimeType ?? 'application/octet-stream',
        name: asset.name,
        size: asset.size ?? 0,
        uri: asset.uri,
      });
      setAnalysisError('');
      setAnalysis(null);
    } finally {
      setIsPickingFile(false);
    }
  }

  async function handleAnalyzeResume() {
    if (!selectedResume && !manualResumeText.trim()) {
      return;
    }

    setIsAnalyzing(true);
    setScreen('processing');

    try {
      setAnalysisError('');

      const nextAnalysis = await analyzeResume({
        jobTitle: defaultTargetRole,
        resumeText: manualResumeText,
        selectedResume,
      });
      setAnalysis(nextAnalysis);
      await saveScanToHistory(selectedResume?.name ?? 'Pasted Resume', nextAnalysis);
      await loadHistory();
      setScreen('results');
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed.');
      setScreen('upload');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function openHistoryItem(item: ResumeScanRecord) {
    setSelectedHistoryItem(item);
    setAnalysis(item.analysis);
    setScreen('download');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Resume Fixer AI</Text>
        <View style={styles.modeBanner}>
          <Text style={styles.modeTitle}>
            {backendReady ? 'Backend Mode: Connected' : 'Preview Mode: Local Only'}
          </Text>
          <Text style={styles.modeCopy}>
            {backendReady
              ? 'Supabase keys are detected. Next step is replacing mock analysis with live backend calls.'
              : 'You can test the full flow already. Results are saved on this device until we connect the backend later.'}
          </Text>
        </View>

        {screen === 'hero' ? (
          <View style={styles.section}>
            <Text style={styles.heroTitle}>Fix your resume before the next job application</Text>
            <Text style={styles.heroSubtitle}>
              Upload your resume, see the ATS score, fix weak bullets, and unlock an improved PDF.
            </Text>

            <View style={styles.highlightCard}>
              <Text style={styles.highlightLabel}>Why this wins</Text>
              <Text style={styles.highlightCopy}>
                This is outcome-first: diagnose for free, charge only when the better version is ready.
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <PrimaryButton label="Upload Resume" onPress={() => setScreen('upload')} />
              <SecondaryButton label="Try Demo Flow" onPress={() => setScreen('processing')} />
              <SecondaryButton label="View History" onPress={() => setScreen('history')} />
            </View>

            <HistoryCard items={history} />
          </View>
        ) : null}

        {screen === 'upload' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Resume</Text>
            <Text style={styles.sectionBody}>
              Pick a real file or paste resume text below. Paste mode is the fastest route for the first live AI integration because it bypasses PDF and DOCX parsing complexity.
            </Text>

            <View style={styles.uploadCard}>
              <Text style={styles.uploadTitle}>
                {selectedResume ? selectedResume.name : 'No file selected yet'}
              </Text>
              <Text style={styles.uploadMeta}>
                {selectedResume
                  ? `${formatBytes(selectedResume.size)} | ${selectedResume.mimeType}`
                  : 'Supported formats: PDF, DOC, DOCX'}
              </Text>
              <Text style={styles.uploadHint}>
                {selectedResume
                  ? `Target role: ${defaultTargetRole}`
                  : 'Your resume stays local for now until backend upload is wired.'}
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <PrimaryButton
                label={isPickingFile ? 'Picking File...' : 'Choose Resume File'}
                onPress={handlePickResume}
              />
              <PrimaryButton
                disabled={(!selectedResume && !manualResumeText.trim()) || isAnalyzing}
                label={isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
                onPress={handleAnalyzeResume}
              />
              <SecondaryButton label="Back" onPress={() => setScreen('hero')} />
            </View>

            <View style={styles.pasteCard}>
              <Text style={styles.pasteTitle}>Or paste resume text</Text>
              <Text style={styles.pasteCopy}>
                Best for testing the first live AI backend. Paste the raw resume content and run analysis.
              </Text>
              <TextInput
                multiline
                onChangeText={setManualResumeText}
                placeholder="Paste resume summary, experience, skills, and education here..."
                placeholderTextColor={palette.textMuted}
                style={styles.textArea}
                value={manualResumeText}
              />
            </View>

            {analysisError ? <Text style={styles.errorText}>{analysisError}</Text> : null}
          </View>
        ) : null}

        {screen === 'processing' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analyzing Resume</Text>
            <Text style={styles.sectionBody}>
              This is the high-trust moment. We use staged progress messaging so the app feels intelligent and active.
            </Text>

            <ProgressSteps steps={processingSteps} />

            {selectedResume ? (
              <Text style={styles.processingFile}>Analyzing: {selectedResume.name}</Text>
            ) : manualResumeText.trim() ? (
              <Text style={styles.processingFile}>Analyzing pasted resume text</Text>
            ) : null}

            <View style={styles.buttonRow}>
              <PrimaryButton
                disabled={isAnalyzing}
                label={isAnalyzing ? 'Analysis Running...' : 'Back to Upload'}
                onPress={() => setScreen(isAnalyzing ? 'processing' : 'upload')}
              />
            </View>
          </View>
        ) : null}

        {screen === 'results' && analysis ? (
          <View style={styles.section}>
            <Text style={styles.sectionKicker}>Free ATS diagnosis</Text>
            <Text style={styles.sectionTitle}>Your resume is close, but still leaving interviews on the table</Text>
            <Text style={styles.sectionBody}>
              This preview shows exactly where the drag is coming from and how much stronger the final version can become after the fix.
            </Text>

            <ScoreCard
              currentScore={analysis.scoreBefore}
              improvedScore={analysis.scoreAfterEstimate}
              label={analysis.label}
            />

            <InsightBanner
              currentScore={analysis.scoreBefore}
              improvedScore={analysis.scoreAfterEstimate}
              roleTarget={analysis.roleTarget}
            />

            <IssueList issues={analysis.issues} />

            <BeforeAfterCard before={analysis.beforeBullet} after={analysis.afterBullet} />

            <QuickWinsCard items={analysis.quickWins ?? []} />

            <TrustBar
              items={['ATS-focused output', 'No fake experience added', 'Preview before payment']}
            />

            <View style={styles.buttonRow}>
              <PrimaryButton label="Unlock Full Fix for Rs 299" onPress={() => setScreen('paywall')} />
              <SecondaryButton label="Review Again" onPress={() => setScreen('processing')} />
            </View>
          </View>
        ) : null}

        {screen === 'paywall' ? (
          <View style={styles.section}>
            <Text style={styles.sectionKicker}>Complete transformation</Text>
            <Text style={styles.sectionTitle}>Unlock the recruiter-ready version of this resume</Text>
            <Text style={styles.sectionBody}>
              You have already seen the diagnosis. Now unlock the rewritten version, cleaner structure, and downloadable PDF.
            </Text>

            <PaywallSummary />

            <TrustBar
              items={['One-time payment', 'Built for India job seekers', 'No guaranteed-results claims']}
            />

            {marketingPlans.map((plan) => (
              <PlanCard
                key={plan.code}
                amount={plan.amount}
                credits={plan.credits}
                highlighted={plan.highlighted}
                note={plan.highlighted ? 'Most chosen' : undefined}
                subtitle={plan.subtitle}
                title={plan.title}
              />
            ))}

            <View style={styles.paywallNote}>
              <Text style={styles.paywallNoteTitle}>Why users choose Pro Pack</Text>
              <Text style={styles.paywallNoteCopy}>
                Most applicants test multiple versions for different roles. The 3-fix pack gives enough room without feeling expensive.
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <PrimaryButton label="Continue with Pro Pack" onPress={() => setScreen('download')} />
              <SecondaryButton label="Back" onPress={() => setScreen('results')} />
            </View>
          </View>
        ) : null}

        {screen === 'download' ? (
          <View style={styles.section}>
            <Text style={styles.sectionKicker}>Unlocked output</Text>
            <Text style={styles.sectionTitle}>Your improved resume package is ready</Text>
            <Text style={styles.sectionBody}>
              This is where the production app will export PDF, enable re-downloads, and drive referral sharing after value is delivered.
            </Text>

            <View style={styles.downloadCard}>
              <Text style={styles.downloadTitle}>
                {selectedHistoryItem ? selectedHistoryItem.resumeName : selectedResume?.name ?? 'Improved resume ready'}
              </Text>
              <Text style={styles.downloadScore}>{analysis?.scoreAfterEstimate ?? 82} / 100</Text>
              <Text style={styles.downloadCopy}>
                Save the PDF, apply faster, and invite 3 friends to unlock one extra resume fix.
              </Text>
            </View>

            <ExportPackageCard
              summary="The final export will contain the rewritten headline, stronger impact bullets, improved clarity, and ATS-safer formatting."
              sections={[
                {
                  title: 'Summary upgrade',
                  points: [
                    'Sharper candidate positioning for the target role',
                    'Cleaner value proposition in the first lines recruiters read',
                  ],
                },
                {
                  title: 'Experience upgrade',
                  points: [
                    analysis?.afterBullet ?? 'Improved bullet structure with stronger action language',
                    'Reduced task-style phrasing and improved readability',
                  ],
                },
                {
                  title: 'Skills and formatting',
                  points: [
                    'More relevant skill grouping for ATS scanning',
                    'Cleaner sections prepared for export-safe PDF layout',
                  ],
                },
              ]}
            />

            <TrustBar items={['Ready for PDF export', 'History saved locally', 'Share after value is delivered']} />

            <View style={styles.buttonRow}>
              <PrimaryButton label="Save PDF" onPress={() => setScreen('hero')} />
              <SecondaryButton label="Share on WhatsApp" onPress={() => setScreen('hero')} />
              <SecondaryButton label="Open History" onPress={() => setScreen('history')} />
            </View>
          </View>
        ) : null}

        {screen === 'history' ? (
          <View style={styles.section}>
            <Text style={styles.sectionKicker}>Saved outputs</Text>
            <Text style={styles.sectionTitle}>Your previous resume scans</Text>
            <Text style={styles.sectionBody}>
              This gives users a simple way to revisit prior results, compare score improvements, and re-open an export flow later.
            </Text>

            <HistoryList items={history} onSelect={openHistoryItem} />

            <View style={styles.buttonRow}>
              <PrimaryButton label="Analyze New Resume" onPress={() => setScreen('upload')} />
              <SecondaryButton label="Back Home" onPress={() => setScreen('hero')} />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function PrimaryButton({
  disabled,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled ? styles.primaryButtonDisabled : null]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) {
    return 'Unknown size';
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 18,
  },
  eyebrow: {
    color: palette.mint,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  section: {
    gap: 18,
  },
  modeBanner: {
    backgroundColor: palette.panel,
    borderColor: palette.strokeStrong,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  modeTitle: {
    color: palette.mint,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modeCopy: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  heroTitle: {
    color: palette.text,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
  },
  heroSubtitle: {
    color: palette.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  sectionKicker: {
    color: palette.mint,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionBody: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  highlightCard: {
    backgroundColor: palette.panel,
    borderColor: palette.stroke,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  highlightLabel: {
    color: palette.warning,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  highlightCopy: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 25,
  },
  buttonRow: {
    gap: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: palette.mint,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: palette.bg,
    fontSize: 16,
    fontWeight: '800',
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: palette.panelSoft,
    borderColor: palette.stroke,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  uploadCard: {
    backgroundColor: palette.panel,
    borderColor: palette.stroke,
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  uploadTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  uploadMeta: {
    color: palette.textMuted,
    fontSize: 14,
  },
  uploadHint: {
    color: palette.mint,
    fontSize: 13,
    fontWeight: '600',
  },
  pasteCard: {
    backgroundColor: palette.panel,
    borderColor: palette.stroke,
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  pasteTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  pasteCopy: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  textArea: {
    backgroundColor: palette.panelSoft,
    borderColor: palette.stroke,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 180,
    padding: 14,
    textAlignVertical: 'top',
  },
  errorText: {
    color: palette.danger,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  processingFile: {
    color: palette.mint,
    fontSize: 14,
    fontWeight: '600',
  },
  paywallNote: {
    backgroundColor: palette.panel,
    borderColor: palette.stroke,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  paywallNoteTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  paywallNoteCopy: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  downloadCard: {
    backgroundColor: palette.panel,
    borderColor: palette.strokeStrong,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 20,
  },
  downloadTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  downloadScore: {
    color: palette.mint,
    fontSize: 42,
    fontWeight: '800',
  },
  downloadCopy: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
});
