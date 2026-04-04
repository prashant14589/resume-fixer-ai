import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Picker } from '@react-native-picker/picker';
import { BlurView } from 'expo-blur';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ViewShot from 'react-native-view-shot';

import { BeforeAfterCard } from './components/BeforeAfterCard';
import { ExportPackageCard } from './components/ExportPackageCard';
import { HistoryCard } from './components/HistoryCard';
import { HistoryList } from './components/HistoryList';
import { IssueList } from './components/IssueList';
import { ProgressSteps } from './components/ProgressSteps';
import { ScoreCard } from './components/ScoreCard';
import { TrustBar } from './components/TrustBar';
import { marketingAnalysis, paywallOffer, processingSteps } from './data/marketingDemo';
import { getCredits } from './services/entitlement';
import { getScanHistory, saveScanToHistory, unlockScanRecord, updateScanAnalysis } from './services/localHistory';
import { exportResumePdf } from './services/pdf';
import { startRazorpayPayment } from './services/payments';
import { analyzeResume } from './services/resumeApi';
import { generateResumeFix } from './services/resumeFixApi';
import { shareOnWhatsApp } from './services/share';
import { isSupabaseConfigured } from './services/supabase';
import { palette } from './theme/palette';
import { ResumeAnalysis, ResumeScanRecord } from './types/resume';

type Screen = 'home' | 'processing' | 'analysis' | 'paywall' | 'result' | 'history';

const ROLE_OPTIONS = [
  { label: 'Software Developer', value: 'software-dev' },
  { label: 'Data Analyst', value: 'data-analyst' },
  { label: 'Marketing / Digital', value: 'marketing' },
  { label: 'Operations / Finance', value: 'operations' },
  { label: 'General Fresher', value: 'general' },
] as const;

export default function AppShell() {
  const [screen, setScreen] = useState<Screen>('home');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedRole, setSelectedRole] = useState('software-dev');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [history, setHistory] = useState<ResumeScanRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<ResumeScanRecord | null>(null);
  const [errorText, setErrorText] = useState('');
  const [credits, setCredits] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const scorecardRef = useRef<ViewShot | null>(null);
  const backendReady = isSupabaseConfigured();

  useEffect(() => {
    void refreshLocalState();
  }, []);

  const beforeSample = useMemo(() => getBeforeSample(resumeText), [resumeText]);
  const afterSample =
    analysis?.improvedResume.experience[0]?.bullets[0] ??
    marketingAnalysis.improvedResume.experience[0].bullets[0];

  async function refreshLocalState() {
    const [nextHistory, nextCredits] = await Promise.all([getScanHistory(), getCredits()]);
    setHistory(nextHistory);
    setCredits(nextCredits);
  }

  async function handleAnalyze() {
    if (!resumeText.trim()) {
      setErrorText('Paste your resume first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorText('');
    setScreen('processing');

    try {
      const nextAnalysis = await analyzeResume({
        jobDescription,
        rolePreset: selectedRole,
        resumeText,
      });

      const record = await saveScanToHistory({
        analysis: nextAnalysis,
        sourceJobDescription: jobDescription,
        sourceRolePreset: selectedRole,
        sourceResumeText: resumeText,
        title: deriveResumeTitle(resumeText),
      });

      setAnalysis(nextAnalysis);
      setCurrentRecord(record);
      await refreshLocalState();
      setScreen('analysis');
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === 'TIMEOUT') {
        setErrorText('Taking longer than usual - tap to try again');
      } else {
        setErrorText('Something went wrong. Please try again.');
      }
      setScreen('home');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handlePayment() {
    if (!currentRecord) {
      return;
    }

    setIsPaying(true);
    setErrorText('');

    try {
      const paymentId = await startRazorpayPayment();
      const unlocked = await unlockScanRecord(currentRecord.id, paymentId);
      const paidResult = await generateResumeFix({
        jobDescription,
        rolePreset: selectedRole,
        resumeText,
      });
      const upgradedAnalysis = currentRecord.analysis
        ? {
            ...currentRecord.analysis,
            breakdown: paidResult.breakdown,
            improvedResume: paidResult.improvedResume,
            improvedScore: paidResult.improvedScore,
          }
        : null;

      const updatedRecord =
        unlocked && upgradedAnalysis
          ? await updateScanAnalysis(unlocked.id, upgradedAnalysis, paymentId)
          : unlocked;

      if (updatedRecord) {
        setCurrentRecord(updatedRecord);
        setAnalysis(updatedRecord.analysis);
      }

      await refreshLocalState();
      setScreen('result');
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Payment completed, but resume generation failed.');
    } finally {
      setIsPaying(false);
    }
  }

  async function handlePdfExport() {
    if (!currentRecord?.isUnlocked) {
      setErrorText('Payment is required before PDF download.');
      return;
    }

    await exportResumePdf(currentRecord);
  }

  async function handleWhatsAppShare() {
    if (!analysis) {
      return;
    }

    const uri = await scorecardRef.current?.capture?.();

    if (!uri) {
      setErrorText('Could not capture the scorecard. Please try again.');
      return;
    }

    await shareOnWhatsApp(uri, analysis.atsScore, analysis.improvedScore);
  }

  function openHistoryItem(item: ResumeScanRecord) {
    setCurrentRecord(item);
    setAnalysis(item.analysis);
    setResumeText(item.sourceResumeText);
    setJobDescription(item.sourceJobDescription ?? '');
    setSelectedRole(item.sourceRolePreset ?? 'general');
    setScreen(item.isUnlocked ? 'result' : 'paywall');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Resume Fixer AI</Text>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>{backendReady ? 'Paste-First Live Flow' : 'Local Fallback Mode'}</Text>
          <Text style={styles.bannerCopy}>
            Paste resume is the truthful MVP. Upload is removed until PDF and DOCX parsing are real.
          </Text>
        </View>

        {screen === 'home' ? (
          <View style={styles.section}>
            <Text style={styles.heroTitle}>Paste resume. See rejection risk. Pay only if it feels worth it.</Text>
            <Text style={styles.heroSubtitle}>
              Built for India job seekers who need a stronger resume fast, not another resume builder.
            </Text>

            <TextInput
              multiline
              onChangeText={setResumeText}
              placeholder="Paste your resume here..."
              placeholderTextColor={palette.textMuted}
              style={styles.resumeInput}
              value={resumeText}
            />

            <View style={styles.pickerCard}>
              <Text style={styles.pickerLabel}>Target role</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.roleGrid}>
                  {ROLE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setSelectedRole(option.value)}
                      style={[styles.roleChip, selectedRole === option.value ? styles.roleChipActive : null]}
                    >
                      <Text style={[styles.roleChipText, selectedRole === option.value ? styles.roleChipTextActive : null]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Picker
                  dropdownIconColor={palette.text}
                  itemStyle={styles.pickerItem}
                  onValueChange={(value) => setSelectedRole(value)}
                  selectedValue={selectedRole}
                  style={styles.picker}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              )}
            </View>

            <TextInput
              multiline
              onChangeText={setJobDescription}
              placeholder="Paste job description here (optional but recommended)..."
              placeholderTextColor={palette.textMuted}
              style={styles.jobInput}
              value={jobDescription}
            />

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            <View style={styles.buttonRow}>
              <PrimaryButton label={isAnalyzing ? 'Analyzing...' : 'Check Resume Free'} onPress={handleAnalyze} />
              <SecondaryButton label="History" onPress={() => setScreen('history')} />
            </View>

            <TrustBar items={['One-time payment', `Credits: ${credits}`, 'JD match optional']} />
            <HistoryCard items={history} />
          </View>
        ) : null}

        {screen === 'processing' ? (
          <View style={styles.section}>
            <Text style={styles.sectionKicker}>Analyzing</Text>
            <Text style={styles.sectionTitle}>We&apos;re optimizing your resume now</Text>
            <Text style={styles.sectionBody}>
              Checking ATS score, rejection risk, missing keywords, and stronger bullet points.
            </Text>
            <ProgressSteps steps={processingSteps} />
            <Text style={styles.retryNote}>We&apos;re optimizing your resume, retrying automatically if the AI call fails.</Text>
          </View>
        ) : null}

        {screen === 'analysis' && analysis ? (
          <View style={styles.section}>
            <Text style={styles.sectionKicker}>Free analysis</Text>
            <Text style={styles.sectionTitle}>{getAnalysisHeadline(analysis.atsScore)}</Text>
            <Text style={styles.alertText}>{analysis.summary}</Text>

            <ScoreCard
              currentScore={analysis.atsScore}
              improvedScore={analysis.improvedScore}
              label={getScoreLabel(analysis.atsScore)}
            />
            <MetricRow
              labelLeft="ATS Score"
              valueLeft={`${analysis.atsScore}/100`}
              labelRight="JD Match"
              valueRight={analysis.matchScore !== null && analysis.matchScore !== undefined ? `${analysis.matchScore}%` : 'Not added'}
            />
            <Text style={styles.fearPrime}>{getFearPrime(analysis.atsScore)}</Text>
            <IssueList issues={analysis.issues} />
            <KeywordCard keywords={analysis.missingKeywords} />
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Preview of your improved resume</Text>

              <View style={styles.previewBefore}>
                <Text style={styles.previewBadge}>Before</Text>
                <Text style={styles.previewText}>{analysis.preview?.before ?? beforeSample}</Text>
              </View>

              <View style={styles.previewAfter}>
                <Text style={styles.previewBadge}>After</Text>
                <Text style={styles.previewText}>{analysis.preview?.after ?? afterSample}</Text>
              </View>

              <View style={styles.blurContainer}>
                <BlurView intensity={40} style={StyleSheet.absoluteFill} />
                <Text style={styles.blurText}>3 more bullets improved...</Text>
                <Text style={styles.blurText}>Skills section optimized...</Text>
                <Text style={styles.blurText}>Keywords injected: React, Node.js, Git...</Text>
              </View>

              <Text style={styles.unlockCTA}>Unlock your full improved resume</Text>
            </View>
            <Text style={styles.retryNote}>We are optimizing your resume. If the AI call fails, the app retries automatically.</Text>

            <View style={styles.buttonRow}>
              <PrimaryButton label={paywallOffer.cta} onPress={() => setScreen('paywall')} />
              <SecondaryButton label="Edit Input" onPress={() => setScreen('home')} />
            </View>
          </View>
        ) : null}

        {screen === 'paywall' && analysis ? (
          <View style={styles.section}>
            <Text style={styles.sectionKicker}>Pay once</Text>
            <Text style={styles.sectionTitle}>Fix your resume instantly</Text>
            <View style={styles.priceCard}>
              <Text style={styles.struckPrice}>{paywallOffer.struckPrice}</Text>
              <Text style={styles.livePrice}>{paywallOffer.price}</Text>
              <Text style={styles.priceCopy}>Full improved resume, stronger bullets, PDF export, and WhatsApp share.</Text>
            </View>
            <BenefitList items={paywallOffer.benefits} />
            <TrustBar items={['Razorpay verified', 'No subscription', 'Unlock after payment only']} />
            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            <View style={styles.buttonRow}>
              <PrimaryButton label={isPaying ? 'Opening Razorpay...' : 'Fix Resume Instantly'} onPress={handlePayment} />
              <SecondaryButton label="Back to Analysis" onPress={() => setScreen('analysis')} />
            </View>
          </View>
        ) : null}

        {screen === 'result' && analysis && currentRecord ? (
          <View style={styles.section}>
            <Text style={styles.sectionKicker}>Unlocked result</Text>
            <Text style={styles.sectionTitle}>Your improved resume is ready</Text>
            <ViewShot options={{ fileName: 'resume-fixer-scorecard', format: 'png', quality: 1 }} ref={scorecardRef}>
              <ScoreCard
                currentScore={analysis.atsScore}
                improvedScore={analysis.improvedScore}
                label="Improved"
                watermark
              />
            </ViewShot>
            <BeforeAfterCard before={beforeSample} after={afterSample} />
            <ExportPackageCard
              summary={analysis.improvedResume.summary}
              sections={[
                {
                  title: 'Experience',
                  points: analysis.improvedResume.experience.flatMap((item) => item.bullets).slice(0, 3),
                },
                {
                  title: 'Skills',
                  points: analysis.improvedResume.skills,
                },
              ]}
            />

            <View style={styles.buttonRow}>
              <PrimaryButton label="Download PDF" onPress={handlePdfExport} />
              <SecondaryButton label="Share Result" onPress={handleWhatsAppShare} />
              <SecondaryButton label="History" onPress={() => setScreen('history')} />
            </View>
          </View>
        ) : null}

        {screen === 'history' ? (
          <View style={styles.section}>
            <Text style={styles.sectionKicker}>Saved scans</Text>
            <Text style={styles.sectionTitle}>Open previous results</Text>
            <HistoryList items={history} onSelect={openHistoryItem} />
            <View style={styles.buttonRow}>
              <PrimaryButton label="New Resume Check" onPress={() => setScreen('home')} />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.primaryButton}>
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

function MetricRow({
  labelLeft,
  valueLeft,
  labelRight,
  valueRight,
}: {
  labelLeft: string;
  valueLeft: string;
  labelRight: string;
  valueRight: string;
}) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricBlock}>
        <Text style={styles.metricLabel}>{labelLeft}</Text>
        <Text style={styles.metricValue}>{valueLeft}</Text>
      </View>
      <View style={styles.metricBlock}>
        <Text style={styles.metricLabel}>{labelRight}</Text>
        <Text style={styles.metricValue}>{valueRight}</Text>
      </View>
    </View>
  );
}

function BenefitList({ items }: { items: string[] }) {
  return (
    <View style={styles.benefitCard}>
      {items.map((item) => (
        <View key={item} style={styles.benefitRow}>
          <View style={styles.dot} />
          <Text style={styles.benefitText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function KeywordCard({ keywords }: { keywords: string[] }) {
  return (
    <View style={styles.keywordCard}>
      <Text style={styles.keywordTitle}>Missing keywords</Text>
      <View style={styles.keywordWrap}>
        {keywords.map((keyword) => (
          <View key={keyword} style={styles.keywordBadge}>
            <Text style={styles.keywordText}>{keyword}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function deriveResumeTitle(resumeText: string) {
  const firstLine = resumeText.split('\n').map((line) => line.trim()).find(Boolean);
  return firstLine?.slice(0, 48) || 'Resume Fix';
}

function getBeforeSample(resumeText: string) {
  const firstLine = resumeText.split('\n').map((line) => line.trim()).find((line) => line.length > 24);
  return firstLine || 'Worked on projects and daily responsibilities.';
}

function getAnalysisHeadline(score: number) {
  if (score < 60) {
    return 'Your resume will likely be rejected';
  }

  if (score < 80) {
    return 'Your resume has shortlist potential, but it is not safe yet';
  }

  return 'Your resume is strong, but there is still room to convert better';
}

function getScoreLabel(score: number) {
  if (score < 60) {
    return 'High risk';
  }

  if (score < 80) {
    return 'Needs work';
  }

  return 'Strong base';
}

function getFearPrime(score: number) {
  if (score < 50) {
    return "Recruiters filter resumes below 60 automatically. Yours won't reach a human.";
  }
  if (score < 65) {
    return 'Your resume is average. Top candidates scoring 75+ are getting the interviews.';
  }
  if (score < 75) {
    return "You're close. A few fixes could push you into the top 15% of applicants.";
  }
  return 'Strong resume. Optimize further to maximize your interview chances.';
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  container: { gap: 18, paddingHorizontal: 20, paddingVertical: 18 },
  eyebrow: { color: palette.mint, fontSize: 13, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  banner: { backgroundColor: palette.panel, borderColor: palette.strokeStrong, borderRadius: 20, borderWidth: 1, gap: 8, padding: 16 },
  bannerTitle: { color: palette.mint, fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
  bannerCopy: { color: palette.textMuted, fontSize: 14, lineHeight: 21 },
  section: { gap: 18 },
  heroTitle: { color: palette.text, fontSize: 34, fontWeight: '800', lineHeight: 40 },
  heroSubtitle: { color: palette.textMuted, fontSize: 16, lineHeight: 24 },
  sectionBody: { color: palette.textMuted, fontSize: 15, lineHeight: 23 },
  resumeInput: { backgroundColor: palette.panel, borderColor: palette.stroke, borderRadius: 22, borderWidth: 1, color: palette.text, minHeight: 220, padding: 16, textAlignVertical: 'top' },
  pickerCard: { backgroundColor: palette.panelSoft, borderColor: palette.stroke, borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  pickerLabel: { color: palette.textMuted, fontSize: 13, fontWeight: '700', paddingHorizontal: 16, paddingTop: 16, textTransform: 'uppercase' },
  picker: {
    backgroundColor: palette.panelSoft,
    color: palette.text,
    ...(Platform.OS === 'web'
      ? {
          borderWidth: 0,
          paddingLeft: 12,
        }
      : null),
  },
  pickerItem: {
    backgroundColor: palette.panelSoft,
    color: palette.text,
  },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  roleChip: { backgroundColor: palette.panel, borderColor: palette.stroke, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  roleChipActive: { backgroundColor: palette.mint, borderColor: palette.mint },
  roleChipText: { color: palette.text, fontSize: 13, fontWeight: '700' },
  roleChipTextActive: { color: palette.bg },
  jobInput: { backgroundColor: palette.panelSoft, borderColor: palette.stroke, borderRadius: 22, borderWidth: 1, color: palette.text, minHeight: 140, padding: 16, textAlignVertical: 'top' },
  buttonRow: { gap: 12 },
  primaryButton: { alignItems: 'center', backgroundColor: palette.mint, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 16 },
  primaryButtonText: { color: palette.bg, fontSize: 16, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', backgroundColor: palette.panelSoft, borderColor: palette.stroke, borderRadius: 18, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 16 },
  secondaryButtonText: { color: palette.text, fontSize: 15, fontWeight: '700' },
  errorText: { color: palette.danger, fontSize: 14, fontWeight: '600' },
  sectionKicker: { color: palette.mint, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  sectionTitle: { color: palette.text, fontSize: 28, fontWeight: '800', lineHeight: 34 },
  alertText: { color: palette.danger, fontSize: 16, fontWeight: '700', lineHeight: 24 },
  fearPrime: { color: '#854F0B', fontSize: 14, fontWeight: '600', lineHeight: 21 },
  metricRow: { flexDirection: 'row', gap: 12 },
  metricBlock: { backgroundColor: palette.panel, borderColor: palette.stroke, borderRadius: 20, borderWidth: 1, flex: 1, padding: 16 },
  metricLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  metricValue: { color: palette.text, fontSize: 24, fontWeight: '800', marginTop: 6 },
  retryNote: { color: palette.textMuted, fontSize: 13, lineHeight: 20 },
  priceCard: { backgroundColor: '#102035', borderColor: palette.strokeStrong, borderRadius: 24, borderWidth: 1, gap: 6, padding: 20 },
  struckPrice: { color: palette.textMuted, fontSize: 18, textDecorationLine: 'line-through' },
  livePrice: { color: palette.mint, fontSize: 42, fontWeight: '800' },
  priceCopy: { color: palette.textMuted, fontSize: 14, lineHeight: 21 },
  benefitCard: { backgroundColor: palette.panel, borderColor: palette.stroke, borderRadius: 22, borderWidth: 1, gap: 12, padding: 18 },
  benefitRow: { flexDirection: 'row', gap: 10 },
  dot: { backgroundColor: palette.mint, borderRadius: 999, height: 8, marginTop: 7, width: 8 },
  benefitText: { color: palette.text, flex: 1, fontSize: 15, lineHeight: 22 },
  keywordCard: { backgroundColor: palette.panel, borderColor: palette.stroke, borderRadius: 22, borderWidth: 1, gap: 12, padding: 18 },
  keywordTitle: { color: palette.text, fontSize: 18, fontWeight: '700' },
  keywordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  keywordBadge: { backgroundColor: '#2B1730', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  keywordText: { color: '#FFB7E8', fontSize: 13, fontWeight: '700' },
  previewCard: { backgroundColor: palette.panel, borderColor: palette.strokeStrong, borderRadius: 22, borderWidth: 1, gap: 12, overflow: 'hidden', padding: 18 },
  previewLabel: { color: palette.text, fontSize: 18, fontWeight: '700' },
  previewBefore: { backgroundColor: '#2A1417', borderRadius: 18, gap: 8, padding: 14 },
  previewAfter: { backgroundColor: '#122621', borderRadius: 18, gap: 8, padding: 14 },
  previewBadge: { color: palette.textMuted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  previewText: { color: palette.text, fontSize: 15, lineHeight: 23 },
  blurContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, gap: 6, minHeight: 96, justifyContent: 'center', overflow: 'hidden', padding: 16 },
  blurText: { color: palette.textMuted, fontSize: 14, lineHeight: 21 },
  unlockCTA: { color: palette.mint, fontSize: 15, fontWeight: '800' },
});
