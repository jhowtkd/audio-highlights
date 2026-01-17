import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GPT_MODEL } from '@/lib/constants';
import { createErrorResponse, requireEnvVar, AppError } from '@/lib/errors';
import { z } from 'zod';

// Validation schema
const searchRequestSchema = z.object({
    query: z.string().min(1).max(500),
    segments: z.array(z.object({
        id: z.string(),
        start: z.number(),
        end: z.number(),
        text: z.string(),
    })),
    maxResults: z.number().min(1).max(20).default(5),
});

interface SearchResult {
    segmentId: string;
    text: string;
    startTime: number;
    endTime: number;
    relevanceScore: number;
    matchReason: string;
}

export async function POST(request: NextRequest) {
    try {
        const apiKey = requireEnvVar('OPENAI_API_KEY');

        const body = await request.json();
        const { query, segments, maxResults } = searchRequestSchema.parse(body);

        if (segments.length === 0) {
            return NextResponse.json({ results: [] });
        }

        const openai = new OpenAI({
            apiKey,
            organization: process.env.OPENAI_ORG_ID,
        });

        // Build transcript with segment IDs for reference
        const transcriptWithIds = segments
            .map((s, i) => `[${i}] ${s.text}`)
            .join('\n');

        const prompt = `Você é um assistente especializado em busca semântica em transcrições de áudio.

## TAREFA
O usuário está buscando por: "${query}"

Sua tarefa é identificar os ${maxResults} segmentos mais relevantes que correspondem semanticamente à busca. A busca é SEMÂNTICA, não literal - você deve encontrar trechos que RELACIONAM com o conceito buscado, mesmo que não mencionem as palavras exatas.

## TRANSCRIÇÃO (formato: [índice] texto)
${transcriptWithIds}

## RESPOSTA
Retorne APENAS um JSON válido:
{
  "results": [
    {
      "index": 0,
      "relevanceScore": 95,
      "matchReason": "Breve explicação de por que este segmento é relevante para a busca"
    }
  ]
}

REGRAS:
- Retorne no máximo ${maxResults} resultados
- Ordene por relevanceScore (maior primeiro)
- relevanceScore deve ser de 0-100
- Só inclua segmentos com relevanceScore >= 50
- Se nenhum segmento for relevante, retorne {"results": []}`;

        const completion = await openai.chat.completions.create({
            model: GPT_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'Você é um assistente de busca semântica. Responda apenas com JSON válido.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.3,
            max_tokens: 1000,
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
            return NextResponse.json({ results: [] });
        }

        // Parse response
        let parsedResponse: { results: { index: number; relevanceScore: number; matchReason: string }[] };
        try {
            const cleanContent = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            parsedResponse = JSON.parse(jsonMatch ? jsonMatch[0] : cleanContent);
        } catch {
            console.error('[Search API] Failed to parse response:', content);
            return NextResponse.json({ results: [] });
        }

        // Map results to full segment data
        const results: SearchResult[] = parsedResponse.results
            .filter((r) => r.index >= 0 && r.index < segments.length)
            .map((r) => {
                const segment = segments[r.index];
                return {
                    segmentId: segment.id,
                    text: segment.text,
                    startTime: segment.start,
                    endTime: segment.end,
                    relevanceScore: r.relevanceScore,
                    matchReason: r.matchReason,
                };
            })
            .sort((a, b) => b.relevanceScore - a.relevanceScore);

        return NextResponse.json({
            success: true,
            query,
            results,
        });

    } catch (error) {
        return createErrorResponse(error, 'Search API');
    }
}
