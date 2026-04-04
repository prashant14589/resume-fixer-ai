import { scoreResumeAgainstJob } from '../_shared/atsEvaluator.ts';
import { parseResumeTextToSections } from '../_shared/resumeParser.ts';
import { RESUME_SAMPLES } from './resumeSamples.ts';

function resolveRolePreset(rolePreset: string | undefined, resumeText: string) {
  if (rolePreset && rolePreset !== 'general') {
    return rolePreset;
  }

  const normalized = resumeText.toLowerCase();

  if (/\breact\b|\bjavascript\b|\bjava\b|\bpython\b|\brest api\b|\bgithub\b|\bweb development\b/.test(normalized)) {
    return 'software-dev';
  }

  if (/\bpower bi\b|\btableau\b|\bpandas\b|\betl\b|\bdata analysis\b/.test(normalized)) {
    return 'data-analyst';
  }

  return 'general';
}

function runValidation() {
  const rows = RESUME_SAMPLES.map((sample) => {
    const rolePreset = resolveRolePreset(sample.rolePreset, sample.text);
    const score = scoreResumeAgainstJob(sample.text, undefined, rolePreset);
    const parsed = parseResumeTextToSections(sample.text);

    const inRange =
      (sample.expected.minScore === undefined || score.totalScore >= sample.expected.minScore) &&
      (sample.expected.maxScore === undefined || score.totalScore <= sample.expected.maxScore);

    return {
      id: sample.id,
      inRange,
      notes: sample.expected.notes,
      parsedExperienceEntries: parsed.experience.length,
      quantRaw: score.breakdown.quant.raw,
      score: score.totalScore,
      title: sample.title,
      weakBullets: score.weakBullets.length,
    };
  });

  console.log('=== Resume Sample Validation ===');
  for (const row of rows) {
    console.log(
      `[${row.inRange ? 'PASS' : 'FAIL'}] ${row.id} (${row.title}) | score=${row.score} quant=${row.quantRaw} expEntries=${row.parsedExperienceEntries} weakBullets=${row.weakBullets}`
    );
    if (!row.inRange) {
      console.log(`  -> expected band mismatch: ${row.notes}`);
    }
  }

  const failed = rows.filter((row) => !row.inRange);
  if (failed.length > 0) {
    console.log(`\nValidation failed for ${failed.length} sample(s).`);
    Deno.exit(1);
  }

  console.log('\nAll sample score-band validations passed.');
}

runValidation();
