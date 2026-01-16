import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import type { TranscriptionSegment, HighlightConfig, GeneratedHighlight } from '@/types';
import type { GPTHighlight, GPTHighlightsResponse } from '@/types/api';
import { formatTime } from '@/lib/format-utils';
import { GPT_MODEL, GPT_MAX_TOKENS, GPT_TEMPERATURE } from '@/lib/constants';
import { createErrorResponse, requireEnvVar, AppError } from '@/lib/errors';
import { generateHighlightsRequestSchema } from '@/lib/validations';

function buildPrompt(
  segments: TranscriptionSegment[],
  config: HighlightConfig
): string {
  const transcriptWithTimestamps = segments
    .map((s) => `[${formatTime(s.start)}] ${s.text}`)
    .join('\n');

  return `Você é um especialista em análise de conteúdo de podcasts. Sua tarefa é identificar os ${config.quantity} momentos mais relevantes e impactantes desta transcrição para criar clips virais.

## REGRAS DE DURAÇÃO (CRÍTICO - RESPEITE RIGOROSAMENTE)
- Duração MÍNIMA de cada highlight: ${config.minDuration} segundos
- Duração MÁXIMA de cada highlight: ${config.maxDuration} segundos
- Duração MÉDIA alvo: ${config.targetDuration} segundos
- NUNCA selecione trechos menores que ${config.minDuration}s ou maiores que ${config.maxDuration}s

## CRITÉRIOS DE SELEÇÃO PARA CLIPS VIRAIS
Priorize momentos que contenham:
1. Insights únicos ou reveladores que fazem as pessoas pararem para ouvir
2. Histórias pessoais impactantes e emocionantes
3. Dados, estatísticas ou fatos surpreendentes
4. Citações memoráveis e compartilháveis
5. Momentos de humor ou forte emoção
6. Conclusões ou aprendizados-chave
7. Declarações controversas ou opiniões fortes
8. Momentos de "aha!" ou revelações

${config.focusTopics?.length ? `
## TÓPICOS PRIORITÁRIOS
Dê preferência a trechos sobre: ${config.focusTopics.join(', ')}
` : ''}

${config.excludeTopics?.length ? `
## TÓPICOS A EVITAR
Não selecione trechos focados em: ${config.excludeTopics.join(', ')}
` : ''}

## TRANSCRIÇÃO COM TIMESTAMPS
${transcriptWithTimestamps}

## FORMATO DE RESPOSTA
Retorne APENAS um JSON válido (sem markdown, sem código, apenas o JSON puro) com exatamente ${config.quantity} highlights:
{
  "highlights": [
    {
      "title": "Título curto e atraente para o clip (máximo 60 caracteres)",
      "summary": "Resumo em 2-3 frases do que é discutido neste trecho",
      "startTime": 123.5,
      "endTime": 234.8,
      "relevanceScore": 95,
      "tags": ["tag1", "tag2", "tag3"],
      "reasoning": "Explicação de por que este trecho foi selecionado como highlight"
    }
  ]
}

IMPORTANTE:
- Os timestamps devem corresponder EXATAMENTE aos da transcrição
- Garanta que (endTime - startTime) esteja entre ${config.minDuration} e ${config.maxDuration} segundos
- Ordene por relevanceScore (maior primeiro)
- Evite sobreposição entre highlights
- Retorne APENAS o JSON, sem nenhum texto adicional`;
}

function extractTranscriptForHighlight(
  segments: TranscriptionSegment[],
  startTime: number,
  endTime: number
): string {
  // Fixed: Include segments that overlap with the highlight range
  return segments
    .filter((s) =>
      (s.start >= startTime && s.start < endTime) ||
      (s.end > startTime && s.end <= endTime) ||
      (s.start <= startTime && s.end >= endTime)
    )
    .map((s) => s.text)
    .join(' ');
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const apiKey = requireEnvVar('OPENAI_API_KEY');

    // Parse and validate request body
    const body = await request.json();
    const validatedData = generateHighlightsRequestSchema.parse(body);
    const { segments, config } = validatedData;

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey,
      organization: process.env.OPENAI_ORG_ID,
    });

    const prompt = buildPrompt(segments, config);

    // Call OpenAI Chat API
    const completion = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em identificar os melhores momentos de podcasts para criar clips virais. Sempre responda apenas com JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: GPT_TEMPERATURE,
      max_tokens: GPT_MAX_TOKENS,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new AppError(
        'Empty response from GPT',
        500,
        'Resposta vazia do GPT'
      );
    }

    // Parse JSON response
    let parsedResponse: GPTHighlightsResponse;
    try {
      // Remove possible markdown code blocks
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsedResponse = JSON.parse(cleanContent);
    } catch {
      throw new AppError(
        'Invalid JSON response from GPT',
        500,
        'Resposta inválida do GPT'
      );
    }

    // Process and validate highlights
    const highlights: GeneratedHighlight[] = parsedResponse.highlights
      .map((h: GPTHighlight) => {
        const duration = h.endTime - h.startTime;
        const transcript = extractTranscriptForHighlight(
          segments,
          h.startTime,
          h.endTime
        );

        return {
          id: uuidv4(),
          title: h.title,
          summary: h.summary,
          startTime: h.startTime,
          endTime: h.endTime,
          duration,
          transcript,
          relevanceScore: h.relevanceScore,
          tags: h.tags,
          reasoning: h.reasoning,
        };
      })
      .filter((h: GeneratedHighlight) => {
        // Validate duration
        return h.duration >= config.minDuration && h.duration <= config.maxDuration;
      })
      .sort((a: GeneratedHighlight, b: GeneratedHighlight) => b.relevanceScore - a.relevanceScore);

    // Calculate statistics
    const totalDuration = highlights.reduce((sum, h) => sum + h.duration, 0);
    const averageDuration = highlights.length > 0 ? totalDuration / highlights.length : 0;
    const transcriptionDuration = segments[segments.length - 1]?.end || 0;
    const coveragePercent = transcriptionDuration > 0
      ? (totalDuration / transcriptionDuration) * 100
      : 0;

    return NextResponse.json({
      success: true,
      highlights,
      stats: {
        totalDuration,
        averageDuration,
        coveragePercent: Math.round(coveragePercent * 10) / 10,
      },
    });

  } catch (error) {
    return createErrorResponse(error, 'Highlights API');
  }
}
