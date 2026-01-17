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

  return `Você é um especialista em análise de conteúdo de podcasts e criação de clips virais. Sua tarefa é fazer uma análise COMPLETA do episódio e identificar os ${config.quantity} momentos mais impactantes.

## REGRAS DE DURAÇÃO (CRÍTICO - RESPEITE RIGOROSAMENTE)
- Duração MÍNIMA de cada highlight: ${config.minDuration} segundos
- Duração MÁXIMA de cada highlight: ${config.maxDuration} segundos
- Duração MÉDIA alvo: ${config.targetDuration} segundos
- NUNCA selecione trechos menores que ${config.minDuration}s ou maiores que ${config.maxDuration}s
${config.platform && config.platform !== 'custom' ? `- Otimizado para: ${config.platform.replace('_', ' ').toUpperCase()}` : ''}

## CRITÉRIOS DE SELEÇÃO PARA CLIPS VIRAIS
Priorize momentos que tenham POTENCIAL VIRAL:
1. 🎣 HOOK FORTE - Início impactante que prende atenção nos primeiros 3 segundos
2. 📖 STORYTELLING - Histórias pessoais com arco narrativo
3. 😮 SURPRESA - Revelações, dados surpreendentes, plot twists
4. 💡 INSIGHTS - Aprendizados únicos e acionáveis
5. 😂 HUMOR - Momentos genuinamente engraçados
6. 🔥 CONTROVÉRSIA - Opiniões fortes e provocativas
7. ❤️ EMOÇÃO - Momentos de vulnerabilidade ou intensidade emocional

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
Retorne APENAS um JSON válido (sem markdown, sem código, apenas o JSON puro):
{
  "episodeSummary": "Resumo executivo do episódio em 3-4 frases, destacando os principais pontos discutidos",
  "keyTopics": ["tópico1", "tópico2", "tópico3"],
  "highlights": [
    {
      "title": "Título curto e atraente (máximo 60 caracteres)",
      "suggestedTitles": [
        "Alternativa otimizada para TikTok/Reels",
        "Alternativa mais descritiva para YouTube",
        "Alternativa com pergunta para engajamento"
      ],
      "summary": "Resumo em 2-3 frases do que é discutido",
      "startTime": 123.5,
      "endTime": 234.8,
      "relevanceScore": 95,
      "emotionTone": "excited",
      "viralFactors": {
        "hasHook": true,
        "hasStorytelling": true,
        "hasSurprise": false,
        "emotionalIntensity": 8
      },
      "quotableLines": [
        "Frase mais marcante e compartilhável deste trecho",
        "Segunda frase impactante (se houver)"
      ],
      "tags": ["tag1", "tag2", "tag3"],
      "reasoning": "Explicação de por que este trecho tem potencial viral"
    }
  ]
}

## CAMPOS OBRIGATÓRIOS
- emotionTone: "excited" | "humorous" | "dramatic" | "informative" | "controversial" | "inspirational"
- viralFactors.emotionalIntensity: número de 1-10
- quotableLines: 1-3 frases que funcionariam bem isoladas em posts de texto
- suggestedTitles: 3 variações de título otimizadas para diferentes contextos

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

    // Calculate total duration from segments
    const audioDuration = segments.length > 0 ? segments[segments.length - 1].end : 0;

    // Dynamic adjustment for short audios
    if (audioDuration < config.minDuration * 1.5) {
      // Se o áudio é muito curto (ex: 50s) e minDuration é 30s, relaxar para permitir cortes menores
      // ou alertar. Vamos tentar ajustar para permitir cortes mais curtos proprocionalmente.
      config.minDuration = Math.max(5, Math.floor(audioDuration / 4)); // Mínimo 5s
      config.targetDuration = Math.max(10, Math.floor(audioDuration / 2));
      config.maxDuration = Math.min(config.maxDuration, audioDuration);
    }

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
      // Remove possible markdown code blocks and extract JSON
      let cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Try to extract JSON if surrounded by other text
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }

      console.log('[Highlights API] Raw GPT response length:', content.length);
      console.log('[Highlights API] Clean content preview:', cleanContent.substring(0, 200));

      parsedResponse = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[Highlights API] Failed to parse JSON. Content:', content.substring(0, 500));
      throw new AppError(
        'Invalid JSON response from GPT',
        500,
        'Resposta inválida do GPT. Tente novamente.'
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
          // Novos campos inteligentes
          emotionTone: h.emotionTone,
          viralFactors: h.viralFactors,
          suggestedTitles: h.suggestedTitles,
          quotableLines: h.quotableLines,
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
      episodeAnalysis: {
        summary: parsedResponse.episodeSummary || '',
        keyTopics: parsedResponse.keyTopics || [],
        totalHighlightsGenerated: highlights.length,
      },
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
