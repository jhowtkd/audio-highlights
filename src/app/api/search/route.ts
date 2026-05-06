import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GPT_MODEL } from '@/lib/constants';
import { createErrorResponse, requireEnvVar } from '@/lib/errors';
import { groupSegmentsByTokenCount } from '@/lib/search-chunking';
import type { SearchSegment } from '@/lib/search-chunking';
import { searchRequestSchema } from '@/lib/validations';

interface SearchResult {
    segmentId: string;
    text: string;
    startTime: number;
    endTime: number;
    relevanceScore: number;
    matchReason: string;
}

async function processChunk(
    openai: OpenAI,
    chunkSegments: SearchSegment[],
    chunkOffset: number,
    query: string,
    maxResults: number
): Promise<{ index: number; relevanceScore: number; matchReason: string }[]> {
    const transcriptPart = chunkSegments
        .map((s, i) => `[${chunkOffset + i}] ${s.text}`)
        .join('\n');

    const prompt = `Você é um assistente especializado em busca semântica em transcrições de áudio.

## TAREFA
O usuário está buscando por: "${query}"

Sua tarefa é identificar os segmentos mais relevantes NESTE TRECHO DA TRANSCRIÇÃO que correspondem semanticamente à busca. A busca é SEMÂNTICA, não literal.

## TRECHO DA TRANSCRIÇÃO (formato: [índice] texto)
${transcriptPart}

## RESPOSTA
Retorne APENAS um JSON válido:
{
  "results": [
    {
      "index": 0,
      "relevanceScore": 95,
      "matchReason": "Breve explicação de por que este segmento é relevante"
    }
  ]
}

REGRAS:
- Retorne no máximo ${maxResults} resultados DESTE TRECHO
- Ordene por relevanceScore (maior primeiro)
- relevanceScore deve ser de 0-100
- Só inclua segmentos com relevanceScore >= 50
- Se nenhum segmento for relevante, retorne {"results": []}`;

    try {
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
        if (!content) return [];

        const cleanContent = content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return [];

        const parsedResponse = JSON.parse(jsonMatch[0]);

        // Validate indices are within this chunk's range (logical check)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (parsedResponse.results || []).filter((r: any) =>
            typeof r.index === 'number' &&
            r.index >= chunkOffset &&
            r.index < chunkOffset + chunkSegments.length
        );

    } catch (error) {
        console.error(`[Search API] Error processing chunk ${chunkOffset}:`, error);
        return [];
    }
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
            timeout: 60000,
        });

        // Split segments into chunks dynamically based on token count
        // We aim for ~10k tokens per chunk to maximize context usage and minimize API calls
        const chunks = groupSegmentsByTokenCount(segments, 10000);

        // Process chunks in parallel
        // Note: For very large numbers of chunks, we might want to limit concurrency (e.g. p-limit),
        // but for typical transcripts (hours), Promise.all is fine.
        const chunkResults = await Promise.all(
            chunks.map(chunk =>
                processChunk(openai, chunk.data, chunk.offset, query, maxResults)
            )
        );

        // Flatten results
        const allResults = chunkResults.flat();

        // Sort by relevance and take top N
        const topResults = allResults
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, maxResults);

        // Map back to segment data
        const results: SearchResult[] = topResults
            .map((r) => {
                const segment = segments[r.index];
                if (!segment) return null; // Should not happen given the filter in processChunk

                return {
                    segmentId: segment.id,
                    text: segment.text,
                    startTime: segment.start,
                    endTime: segment.end,
                    relevanceScore: r.relevanceScore,
                    matchReason: r.matchReason,
                };
            })
            .filter((r): r is SearchResult => r !== null);

        return NextResponse.json({
            success: true,
            query,
            results,
        });

    } catch (error) {
        return createErrorResponse(error, 'Search API');
    }
}
