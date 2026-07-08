import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { decupageRequestSchema } from '@/lib/validations';
import { detectSilences } from '@/lib/silence-detector';
import { createErrorResponse, requireEnvVar, AppError } from '@/lib/errors';
import { GPT_MODEL } from '@/lib/constants';
import type { DecupageResult, DecupageSegment, DecupageProblemType } from '@/types/decupagem';
import type { TranscriptionSegment } from '@/types';
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
});

function buildAnalysisPrompt(segments: TranscriptionSegment[], context?: string): string {
    const transcriptText = segments
        .map(s => `[${s.start.toFixed(1)}-${s.end.toFixed(1)}] ${s.text}`)
        .join('\n');

    return `Você é um editor de áudio profissional especializado em "decupagem" (limpeza de áudio).
Sua tarefa é analisar a transcrição abaixo e identificar trechos que devem ser cortados para melhorar a qualidade, fluidez e narrativa.

CONTEXTO NARRATIVO: ${context || 'Nenhum contexto específico fornecido, foque na fluidez geral.'}

TIPOS DE PROBLEMAS A IDENTIFICAR:
1. "filler_words": Vícios de linguagem ("tipo", "é...", "hã...", "né?") que não agregam valor.
2. "stutter": Gagueiras ou repetições involuntárias de sílabas/palavras ("eu eu eu acho").
3. "false_start": Frases que começam mas são abandonadas para começar outra ("Então nós vamos... digo, a gente foi").
4. "wrong_word": Palavras ditas erradas e corrigidas logo em seguida.
5. "off_topic": Trechos longos que fogem completamente do assunto principal ou são conversas paralelas irrelevantes.
6. "contradiction": Afirmações que contradizem algo dito anteriormente.
7. "repetition": Repetição desnecessária da mesma ideia.

REGRAS:
- Seja conservador. Só sugira cortes claros. Na dúvida, marque como "review".
- NÃO invente timestamps. Use EXATAMENTE os intervalos fornecidos na transcrição.
- Se houver uma correção ("eu cheguei na... cheguei em casa"), corte a parte errada ("eu cheguei na...") e mantenha a correta.

TRANSCRIÇÃO:
${transcriptText}

FORMATO DE RESPOSTA (JSON PURO):
{
  "narrativeSummary": "Resumo de 1 frase do que está sendo dito",
  "segments": [
    {
      "startTime": 10.5,
      "endTime": 12.0,
      "text": "é... tipo assim",
      "problemType": "filler_words",
      "severity": "low",
      "suggestion": "cut",
      "reason": "Vício de linguagem desnecessário"
    }
  ]
}`;
}

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown-ip';
        try {
            await limiter.check(10, ip);
        } catch {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again later.' },
                { status: 429, headers: { 'Retry-After': '60' } }
            );
        }

        const apiKey = requireEnvVar('OPENAI_API_KEY');

        const body = await request.json();
        const validatedData = decupageRequestSchema.parse(body);
        const { segments, config } = validatedData;

        // 1. Detect Silences (Algorithmically)
        // We need to flatten all words from all segments to run silence detection globally
        const allWords = segments.flatMap(s => s.words || []);
        const silenceSegments = detectSilences(allWords, config.silenceThreshold);

        console.log(`[Decupagem API] Detected ${silenceSegments.length} silences`);

        // 2. Detect Narrative/Speech Errors (LLM)
        const openai = new OpenAI({
            apiKey,
            organization: process.env.OPENAI_ORG_ID,
        });

        // Check transcript size to prevent token limits
        // If too large, we might need to chunk it, but for now assuming it fits or user sends reasonably sized clips
        // A standard podcast episode transcript fits in GPT-4o context (128k) easily.

        console.log('[Decupagem API] Calling LLM for analysis...');
        const prompt = buildAnalysisPrompt(segments, config.narrativeContext);

        const completion = await openai.chat.completions.create({
            model: GPT_MODEL,
            messages: [
                { role: 'system', content: 'You are an expert audio editor assistant. Output valid JSON only.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1, // Low temperature for consistent analysis
        });

        const content = completion.choices[0].message.content;
        if (!content) {
            throw new AppError('Empty response from LLM', 500);
        }

        const llmResult = JSON.parse(content);

        // 3. Merge Results
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const llmSegments: DecupageSegment[] = (llmResult.segments || []).map((s: any) => ({
            id: uuidv4(),
            startTime: s.startTime,
            endTime: s.endTime,
            text: s.text,
            problemType: s.problemType as DecupageProblemType,
            severity: s.severity || 'medium',
            suggestion: s.suggestion || 'review',
            reason: s.reason,
            status: 'pending' // Default status
        }));

        // Combine silence segments + LLM segments
        const allSegments = [...silenceSegments, ...llmSegments].sort((a, b) => a.startTime - b.startTime);

        // 4. Calculate Stats
        const totalDuration = segments.length > 0 ? segments[segments.length - 1].end : 0;
        const cutDuration = allSegments
            .filter(s => s.suggestion === 'cut')
            .reduce((acc, s) => acc + (s.endTime - s.startTime), 0);

        const result: DecupageResult = {
            id: uuidv4(),
            projectId: uuidv4(), // Ideally passed in request, but optional here
            originalDuration: totalDuration,
            cleanDuration: totalDuration - cutDuration,
            timeSaved: cutDuration,
            segments: allSegments,
            narrativeSummary: llmResult.narrativeSummary || 'Análise concluída.',
            createdAt: new Date(),
        };

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        return createErrorResponse(error, 'Decupagem API');
    }
}
