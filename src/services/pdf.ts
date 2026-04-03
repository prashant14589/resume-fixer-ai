import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { ResumeScanRecord } from '../types/resume';

export async function exportResumePdf(record: ResumeScanRecord) {
  const html = buildResumeHtml(record);

  const result = await Print.printToFileAsync({
    html,
  });

  if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(result.uri);
  }

  return result.uri;
}

function buildResumeHtml(record: ResumeScanRecord) {
  const experienceHtml = record.analysis.improvedResume.experience
    .map(
      (item) => `
      <section>
        <h3>${escapeHtml(item.role)} - ${escapeHtml(item.company)}</h3>
        <ul>
          ${item.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}
        </ul>
      </section>
    `
    )
    .join('');

  const skills = record.analysis.improvedResume.skills.map(escapeHtml).join(' | ');

  return `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 28px; color: #111827; }
        h1 { font-size: 28px; margin-bottom: 8px; }
        h2 { font-size: 16px; margin-top: 20px; color: #0f766e; text-transform: uppercase; }
        h3 { font-size: 15px; margin-bottom: 8px; }
        p, li { font-size: 13px; line-height: 1.6; }
        ul { padding-left: 20px; }
        .meta { color: #475569; margin-bottom: 18px; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(record.resumeTitle)}</h1>
      <p class="meta">Improved with Resume Fixer AI</p>
      <h2>Professional Summary</h2>
      <p>${escapeHtml(record.analysis.improvedResume.summary)}</p>
      <h2>Experience</h2>
      ${experienceHtml}
      <h2>Skills</h2>
      <p>${skills}</p>
    </body>
  </html>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
