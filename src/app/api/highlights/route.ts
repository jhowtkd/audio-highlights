import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import type { TranscriptionSegment, HighlightConfig, GeneratedHighlight } from '@/types';
import type { GPTHighlight, GPTHighlightsResponse } from '@/types/api';
import { formatTime } from '@/lib/format-utils';
import { GPT_MODEL, GPT_MAX_TOKENS } from '@/lib/constants';
import { createErrorResponse, requireEnvVar, AppError } from '@/lib/errors';
import { generateHighlightsRequestSchema } from '@/lib/validations';

function buildPrompt(
  segments: TranscriptionSegment[],
  config: HighlightConfig
): string {
  const transcriptWithTimestamps = segments
    .map((s) => `[${formatTime(s.start)}] ${s.text}`)
    .join('\n');

  const platformInstructions = getPlatformInstructions(config.platform);

  return `Você é um ENGENHEIRO DE ATENÇÃO especializado em transformar conteúdo de áudio longo em micro-clips virais. Sua análise é baseada em neurociência da atenção e métricas algorítmicas do Instagram Reels 2025.

## SEU PAPEL
Você não é um editor comum. Você entende que:
- O usuário de redes sociais está em "transe de scroll" buscando dopamina com mínimo esforço
- Os primeiros 3 SEGUNDOS determinam 90% do sucesso de um clip
- Salvamentos (Saves) indicam UTILIDADE, Compartilhamentos (Shares) indicam RESSONÂNCIA EMOCIONAL
- Taxa de Conclusão (Watch Through Rate) é mais valiosa que Likes

## REGRAS DE DURAÇÃO (CRÍTICO)
- Duração MÍNIMA: ${config.minDuration} segundos
- Duração MÁXIMA: ${config.maxDuration} segundos  
- Duração ALVO: ${config.targetDuration} segundos
- Quantidade de clips: ${config.quantity}
${platformInstructions}

## 🎣 ANÁLISE DE GANCHO (HOOK) - O MAIS IMPORTANTE

### Tipos de Gancho que você DEVE identificar:

1. **PROMESSA OUSADA (promise)**
   - Estabelece valor imediato: "Como eu [resultado] em [tempo]"
   - Elimina ambiguidade, apela ao desejo de ganho
   - Ex: "A única estratégia de SEO que funciona em 2025"

2. **MEDO/NEGATIVIDADE (fear)**  
   - Aversão à perda é mais forte que desejo de ganho
   - Ex: "Pare de cometer este erro", "Por que seu marketing está falhando"
   - Gera retenção para alívio da tensão

3. **CURIOSIDADE (curiosity)**
   - Começo IN MEDIA RES (no meio da ação)
   - Estímulo visual/sonoro forte sem contexto
   - Cria lacuna que o cérebro PRECISA preencher

4. **CONTRARIANO (contrarian)**
   - Desafia sabedoria convencional do nicho
   - Ex: "Por que você NÃO deve postar todo dia"
   - Gera fricção cognitiva = maior retenção inicial

5. **IN MEDIA RES (in_media_res)**
   - Começa no clímax ou momento de tensão
   - Sem introdução, sem contexto inicial

## 🎬 ARQUÉTIPOS DE CONTEÚDO VIRAL

1. **STORY (story)** - História com arco narrativo
   - Situação → Complicação → Resolução
   - Anedotas pessoais, estudos de caso
   - Funciona excepcionalmente para prender atenção

2. **HOT TAKE (hot_take)** - Opinião polarizante
   - Opinião forte, controversa ou contrária ao senso comum
   - GERA COMENTÁRIOS = alimenta algoritmo
   
3. **TUTORIAL (tutorial)** - "Como fazer X"
   - Alta SALVABILIDADE (saveability)
   - Impulsiona alcance a longo prazo
   
4. **MOMENTO HUMANO (human_moment)** - Vulnerabilidade
   - Erros, emoção genuína, risadas, falhas
   - Quebra barreira da "perfeição corporativa"
   - Alta COMPARTILHABILIDADE (shareability)

5. **REVELAÇÃO (revelation)** - "Aha! Moment"
   - Momento de clareza súbita
   - Dados surpreendentes, plot twists

## 📊 CRITÉRIOS DE SELEÇÃO (ORDENADOS POR IMPORTÂNCIA)

1. **Qualidade do Hook** - Os primeiros 3s são um PATTERN INTERRUPT?
2. **Densidade de Valor** - Cada segundo entrega algo? (sem "gordura narrativa")
3. **"Aha! Moment"** - Tem clímax claro e satisfatório?
4. **Loop Potential** - O final conecta gramaticalmente/logicamente ao início?
5. **Completion Potential** - Há motivo para assistir até o final?

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

## FORMATO DE RESPOSTA (JSON PURO, SEM MARKDOWN)
{
  "episodeSummary": "Resumo executivo do episódio em 3-4 frases",
  "keyTopics": ["tópico1", "tópico2", "tópico3"],
  "highlights": [
    {
      "title": "Título curto e magnético (máx 60 chars)",
      "suggestedTitles": [
        "Versão TikTok/Reels - mais provocativa",
        "Versão YouTube - mais descritiva", 
        "Versão com pergunta para engajamento"
      ],
      "summary": "Resumo em 2-3 frases",
      "startTime": 123.5,
      "endTime": 234.8,
      "relevanceScore": 95,
      "emotionTone": "excited",
      "viralFactors": {
        "hasHook": true,
        "hasStorytelling": true,
        "hasSurprise": false,
        "emotionalIntensity": 8,
        "hookType": "promise",
        "contentArchetype": "story",
        "loopPotential": false,
        "saveability": 7,
        "shareability": 9,
        "completionPotential": 8
      },
      "hookAnalysis": "Análise específica de por que os primeiros 3 segundos funcionam como pattern interrupt",
      "openingLine": "Primeira frase exata do corte",
      "quotableLines": [
        "Frase mais marcante e compartilhável",
        "Segunda frase impactante (se houver)"
      ],
      "tags": ["tag1", "tag2"],
      "reasoning": "Por que este trecho tem potencial viral (mencione o tipo de hook e arquétipo)"
    }
  ]
}

## CAMPOS OBRIGATÓRIOS
- emotionTone: "excited" | "humorous" | "dramatic" | "informative" | "controversial" | "inspirational"
- viralFactors.hookType: "promise" | "fear" | "curiosity" | "contrarian" | "in_media_res"
- viralFactors.contentArchetype: "story" | "hot_take" | "tutorial" | "human_moment" | "revelation"
- viralFactors.saveability: 1-10 (quão útil/educacional é - gera SAVES)
- viralFactors.shareability: 1-10 (quão emocional/engraçado é - gera SHARES)
- viralFactors.completionPotential: 1-10 (probabilidade de assistir até o final)
- viralFactors.loopPotential: boolean (final conecta ao início?)
- hookAnalysis: análise dos primeiros 3 segundos
- openingLine: primeira frase exata do corte

## REGRAS FINAIS
- Timestamps EXATOS da transcrição
- (endTime - startTime) entre ${config.minDuration} e ${config.maxDuration} segundos
- Ordene por relevanceScore (maior primeiro)
- Evite sobreposição entre highlights
- Retorne APENAS JSON válido, sem texto adicional`;
}

function getPlatformInstructions(platform?: string): string {
  switch (platform) {
    case 'instagram_reels':
      return `
## 📸 OTIMIZADO PARA: INSTAGRAM REELS
- Algoritmo prioriza: Watch Time > Completion Rate > Saves > Shares
- Foque em clips que gerem SAVES (educacionais) ou SHARES (emocionais)
- Zonas de segurança: deixe espaço para UI do app (250px topo, 350px base)
- Loop perfeito é MUITO valorizado (taxa de replay)`;
    case 'tiktok':
      return `
## 🎵 OTIMIZADO PARA: TIKTOK  
- Velocidade e dynamismo são essenciais
- Hooks ainda mais curtos (1-2 segundos)
- Conteúdo controverso/polarizante performa muito bem
- Loops curtos (7-15s) com replay alto`;
    case 'youtube_shorts':
      return `
## 📺 OTIMIZADO PARA: YOUTUBE SHORTS
- Máximo 59 segundos (CRÍTICO)
- Setup rápido + Payoff claro
- Pode ser mais informativo que outras plataformas
- CTAs funcionam bem no final`;
    case 'podcast_trailer':
      return `
## 🎙️ OTIMIZADO PARA: TRAILER DE PODCAST
- Pode ser mais longo (1-3 min)
- Foque em highlights que representem o MELHOR do episódio
- Misture diferentes tons/momentos para variedade
- Inclua "teaser" que deixe curiosidade para ouvir completo`;
    default:
      return '';
  }
}

/**
 * Finds the insertion point for a value in a sorted array (by start time).
 * Equivalent to Python's bisect_left.
 */
function bisectLeft(segments: TranscriptionSegment[], time: number): number {
  let low = 0;
  let high = segments.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (segments[mid].start < time) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}

function extractTranscriptForHighlight(
  segments: TranscriptionSegment[],
  startTime: number,
  endTime: number
): string {
  if (segments.length === 0) return '';

  // 1. Find the first segment that starts at or after endTime.
  // All segments from this index onwards are strictly after the highlight range.
  const endIndex = bisectLeft(segments, endTime);

  // 2. Find the first segment that starts at or after startTime.
  // All segments from this index up to endIndex-1 are within [startTime, endTime)
  // regarding their start time, so they are definitely included.
  const startIndex = bisectLeft(segments, startTime);

  const resultSegments: TranscriptionSegment[] = [];

  // 3. Scan backwards from startIndex - 1 to find segments that started before
  // startTime but end after startTime (overlapping the start boundary).
  // We use a safe lookback window (e.g., 600s) to avoid scanning the entire array
  // in pathological cases, while being correct for all practical transcription data.
  const SAFE_LOOKBACK_WINDOW = 600;

  // Use a temporary array to avoid costly unshift operations
  const overlapSegments: TranscriptionSegment[] = [];

  for (let i = startIndex - 1; i >= 0; i--) {
    const s = segments[i];
    if (s.end > startTime) {
      overlapSegments.push(s);
    }

    // Stop if we are too far back in time
    if (startTime - s.start > SAFE_LOOKBACK_WINDOW) {
      break;
    }
  }

  // Add overlapped segments in correct order (they were pushed in reverse order)
  for (let i = overlapSegments.length - 1; i >= 0; i--) {
    resultSegments.push(overlapSegments[i]);
  }

  // 4. Add segments found in the binary search range
  for (let i = startIndex; i < endIndex; i++) {
    resultSegments.push(segments[i]);
  }

  return resultSegments
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
      config.minDuration = Math.max(5, Math.floor(audioDuration / 4));
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
    console.log('[Highlights API] Calling GPT-5 Nano...');
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
      max_completion_tokens: GPT_MAX_TOKENS,
    });

    const content = completion.choices[0]?.message?.content;

    console.log('[Highlights API] Completion full response:', JSON.stringify(completion, null, 2));

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
    } catch (_parseError) {
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
          // Campos inteligentes de viralidade
          emotionTone: h.emotionTone,
          viralFactors: h.viralFactors,
          suggestedTitles: h.suggestedTitles,
          quotableLines: h.quotableLines,
          // Novos campos de análise de gancho
          hookAnalysis: h.hookAnalysis,
          openingLine: h.openingLine,
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
      usage: completion.usage ? {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens,
      } : undefined,
    });

  } catch (error) {
    return createErrorResponse(error, 'Highlights API');
  }
}
