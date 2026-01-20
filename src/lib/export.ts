import { formatSRTTime, formatTime, formatDuration } from './format-utils';
import type { GeneratedHighlight, TranscriptionSegment } from '@/types';

/**
 * Gera arquivo SRT a partir de um highlight
 */
/**
 * Encontra segmentos relevantes para um highlight usando busca binária.
 *
 * Esta função otimiza a busca de segmentos, reduzindo a complexidade de O(N) para O(log N + K),
 * onde N é o total de segmentos e K é o número de segmentos relevantes.
 *
 * Otimizado para arrays ordenados por tempo.
 */
function findRelevantSegments(
  highlight: GeneratedHighlight,
  segments: TranscriptionSegment[]
): TranscriptionSegment[] {
  if (segments.length === 0) return [];

  // Busca binária para encontrar o primeiro segmento potencial
  let low = 0;
  let high = segments.length - 1;
  let startIndex = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (segments[mid].start >= highlight.startTime) {
      startIndex = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  // Se nenhum segmento começa depois do início do highlight, retorna vazio
  if (startIndex === -1) return [];

  const result: TranscriptionSegment[] = [];

  // Itera a partir do índice encontrado até sair do range
  for (let i = startIndex; i < segments.length; i++) {
    const s = segments[i];

    // Otimização: se o início do segmento já passou do fim do highlight, podemos parar
    // (assumindo que start <= end para qualquer segmento)
    if (s.start > highlight.endTime) break;

    // Verifica se o segmento está totalmente dentro do range
    if (s.end <= highlight.endTime) {
      result.push(s);
    }
  }

  return result;
}

export function generateSRT(
  highlight: GeneratedHighlight,
  segments: TranscriptionSegment[]
): string {
  // Filtra segmentos que estão dentro do range do highlight
  const relevantSegments = findRelevantSegments(highlight, segments);

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
  const relevantSegments = findRelevantSegments(highlight, segments);

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
export function downloadFile(content: string | Blob, filename: string, mimeType: string = 'text/plain'): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Gera transcrição completa em texto simples
 */
export function generateFullTranscriptText(segments: TranscriptionSegment[]): string {
  return segments.map((s) => s.text.trim()).join(' ');
}

/**
 * Gera transcrição completa com timestamps
 */
export function generateFullTranscriptWithTimestamps(segments: TranscriptionSegment[]): string {
  return segments
    .map((s) => `[${formatTime(s.start)}] ${s.text.trim()}`)
    .join('\n\n');
}

/**
 * Gera transcrição completa em SRT
 */
export function generateFullTranscriptSRT(segments: TranscriptionSegment[]): string {
  return segments
    .map((seg, i) => {
      return `${i + 1}
${formatSRTTime(seg.start)} --> ${formatSRTTime(seg.end)}
${seg.text.trim()}`;
    })
    .join('\n\n');
}

/**
 * Gera transcrição completa em Markdown
 */
export function generateFullTranscriptMarkdown(segments: TranscriptionSegment[]): string {
  const totalDuration = segments.length > 0 ? segments[segments.length - 1].end : 0;

  return `# Transcrição Completa

**Duração total:** ${formatDuration(totalDuration)}
**Segmentos:** ${segments.length}

---

${segments.map((s) => `**[${formatTime(s.start)}]** ${s.text.trim()}`).join('\n\n')}
`;
}

