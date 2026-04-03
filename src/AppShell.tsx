import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
import { getScanHistory, saveScanToHistory, unlockScanRecord } from './services/localHistory';
import { exportResumePdf } from './services/pdf';
import { startRazorpayPayment } from './services/payments';
import { analyzeResume } from './services/resumeApi';
import { shareOnWhatsApp } from './services/share';
import { isSupabaseConfigured } from './services/supabase';
import { palette } from './theme/palette';
import { ResumeAnalysis, ResumeScanRecord } from './types/resume';

type Screen = 'home' | 'analysis' | 'paywall' | 'result' | 'history';

export default function AppShell() {
  const [screen, setScreen] = useState<Screen>('home');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [history, setHistory] = useState<ResumeScanRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<ResumeScanRecord | null>(null);
  const [errorText, setErrorText] = useState('');
  const [credits, setCredits] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
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
    setScreen('analysis');

    try {
      const nextAnalysis = await analyzeResume({
        jobDescription,
        resumeText,
      });

      const record = await saveScanToHistory({
        analysis: nextAnalysis,
        sourceJobDescription: jobDescription,
        sourceResumeText: resumeText,
        title: deriveResumeTitle(resumeText),
      });

      setAnalysis(nextAnalysis);
      setCurrentRecord(record);
      await refreshLocalState();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Analysis failed.');
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

      if (unlocked) {
        setCurrentRecord(unlocked);
        setAnalysis(unlocked.analysis);
      }

      await refreshLocalState();
      setScreen('result');
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Payment failed.');
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

    await shareOnWhatsApp(analysis.atsScore, analysis.improvedScore);
  }

  function openHistoryItem(item: ResumeScanRecord) {
    setCurrentRecord(item);
    setAnalysis(item.analysis);
    setResumeText(item.sourceResumeText);
    setJobDescription(item.sourceJobDescription ?? '');
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

        {screen === 'analysis' && analysis ? (
          <View style={styles.section}>
            <Text style={styles.sectionKicker}>Free analysis</Text>
            <Text style={styles.sectionTitle}>Your resume will likely be rejected</Text>
            <Text style={styles.alertText}>{analysis.summary}</Text>

            <ScoreCard currentScore={analysis.atsScore} improvedScore={analysis.improvedScore} label="Needs work" />
            <MetricRow labelLeft="ATS Score" valueLeft={`${analysis.atsScore}/100`} labelRight="JD Match" valueRight={analysis.matchScore ? `${analysis.matchScore}%` : 'Not added'} />
            <IssueList issues={analysis.issues} />
            <KeywordCard keywords={analysis.missingKeywords} />
            <BeforeAfterCard before={beforeSample} after={afterSample} />
            <ProgressSteps steps={processingSteps} />
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
            <ScoreCard currentScore={analysis.atsScore} improvedScore={analysis.improvedScore} label="Improved" />
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
  resumeInput: { backgroundColor: palette.panel, borderColor: palette.stroke, borderRadius: 22, borderWidth: 1, color: palette.text, minHeight: 220, padding: 16, textAlignVertical: 'top' },
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
});
