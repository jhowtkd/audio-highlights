import { formatSRTTime, formatTime, formatDuration } from './format-utils';
import type { GeneratedHighlight, TranscriptionSegment } from '@/types';

/**
 * Gera arquivo SRT a partir de um highlight
 */
export function generateSRT(
  highlight: GeneratedHighlight,
  segments: TranscriptionSegment[]
): string {
  // Filtra segmentos que estão dentro do range do highlight
  const relevantSegments = segments.filter(
    (s) => s.start >= highlight.startTime && s.end <= highlight.endTime
  );

  if (relevantSegments.length === 0) {
    // Se não encontrar segmentos exatos, cria um único bloco
    return `1
${formatSRTTime(0)} --> ${formatSRTTime(highlight.duration)}
${highlight.transcript}
`;
  }

  // Gera o SRT com timestamps relativos ao início do highlight
  return relevantSegments
    .map((seg, i) => {
      const startRelative = seg.start - highlight.startTime;
      const endRelative = seg.end - highlight.startTime;

      return `${i + 1}
${formatSRTTime(startRelative)} --> ${formatSRTTime(endRelative)}
${seg.text.trim()}`;
    })
    .join('\n\n');
}

/**
 * Gera arquivo VTT a partir de um highlight
 */
export function generateVTT(
  highlight: GeneratedHighlight,
  segments: TranscriptionSegment[]
): string {
  const relevantSegments = segments.filter(
    (s) => s.start >= highlight.startTime && s.end <= highlight.endTime
  );

  const header = 'WEBVTT\n\n';

  if (relevantSegments.length === 0) {
    return `${header}00:00:00.000 --> ${formatVTTTimeInternal(highlight.duration)}
${highlight.transcript}
`;
  }

  const cues = relevantSegments
    .map((seg) => {
      const startRelative = seg.start - highlight.startTime;
      const endRelative = seg.end - highlight.startTime;

      return `${formatVTTTimeInternal(startRelative)} --> ${formatVTTTimeInternal(endRelative)}
${seg.text.trim()}`;
    })
    .join('\n\n');

  return header + cues;
}

function formatVTTTimeInternal(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Gera texto simples a partir de um highlight
 */
export function generateText(highlight: GeneratedHighlight): string {
  return `${highlight.title}
${'='.repeat(highlight.title.length)}

Duração: ${formatDuration(highlight.duration)}
Timestamp: ${formatTime(highlight.startTime)} - ${formatTime(highlight.endTime)}

${highlight.transcript}

Tags: ${highlight.tags.join(', ')}
`;
}

/**
 * Gera Markdown a partir de um highlight
 */
export function generateMarkdown(highlight: GeneratedHighlight): string {
  return `## ${highlight.title}

**Duração:** ${formatDuration(highlight.duration)} | **Timestamp:** ${formatTime(highlight.startTime)} - ${formatTime(highlight.endTime)}

### Resumo
${highlight.summary}

### Transcrição
> "${highlight.transcript}"

**Tags:** ${highlight.tags.map((t) => `#${t}`).join(' ')}

**Score de Relevância:** ${highlight.relevanceScore}/100

---
`;
}

/**
 * Gera JSON a partir de um highlight
 */
export function generateJSON(highlight: GeneratedHighlight): string {
  return JSON.stringify(highlight, null, 2);
}

/**
 * Gera todos os highlights em um único arquivo
 */
export function generateAllHighlights(
  highlights: GeneratedHighlight[],
  segments: TranscriptionSegment[],
  format: 'srt' | 'vtt' | 'txt' | 'markdown' | 'json'
): string {
  switch (format) {
    case 'srt':
      return highlights
        .map((h, i) => `# HIGHLIGHT ${i + 1}: ${h.title}\n\n${generateSRT(h, segments)}`)
        .join('\n\n');

    case 'vtt':
      return highlights
        .map((h, i) => `# HIGHLIGHT ${i + 1}: ${h.title}\n\n${generateVTT(h, segments)}`)
        .join('\n\n');

    case 'txt':
      return highlights.map((h) => generateText(h)).join('\n\n---\n\n');

    case 'markdown':
      return `# Highlights\n\n${highlights.map((h) => generateMarkdown(h)).join('\n')}`;

    case 'json':
      return JSON.stringify({ highlights }, null, 2);

    default:
      return '';
  }
}

/**
 * Faz download de um arquivo
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
