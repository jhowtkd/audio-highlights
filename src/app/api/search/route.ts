import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GPT_MODEL } from '@/lib/constants';
import { createErrorResponse, requireEnvVar } from '@/lib/errors';
import { calculateLocalRelevance } from '@/lib/search-utils';
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

interface Segment {
    id: string;
    start: number;
    end: number;
    text: string;
}

// Chunk size for splitting the transcript
const CHUNK_SIZE = 150; // Adjust based on average segment length and model context limits

async function processChunk(
    openai: OpenAI,
    chunkSegments: Segment[],
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
        });

        // Split segments into chunks
        const chunks = [];
        for (let i = 0; i < segments.length; i += CHUNK_SIZE) {
            chunks.push({
                offset: i,
                data: segments.slice(i, i + CHUNK_SIZE)
            });
        }

        // Pre-calculate relevance locally to save tokens
        const chunksWithScore = chunks.map(chunk => ({
            ...chunk,
            localScore: calculateLocalRelevance(chunk.data, query)
        }));

        // Sort by relevance and take top N chunks
        // This avoids sending the full transcript to OpenAI for every query
        // We prioritize chunks that contain query terms
        const MAX_CHUNKS_TO_PROCESS = 5;

        let targetChunks = chunksWithScore
            .filter(c => c.localScore > 0)
            .sort((a, b) => b.localScore - a.localScore);

        // If too many matches, limit to top K
        if (targetChunks.length > MAX_CHUNKS_TO_PROCESS) {
             targetChunks = targetChunks.slice(0, MAX_CHUNKS_TO_PROCESS);
        }

        // If NO chunks matched locally (score 0), fall back to checking the first few chunks
        // to handle semantic matches that might not share keywords (though less likely to work well without vector search)
        if (targetChunks.length === 0) {
             targetChunks = chunksWithScore.slice(0, Math.min(chunks.length, 3));
        }

        // Process only relevant chunks in parallel
        const chunkResults = await Promise.all(
            targetChunks.map(chunk =>
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
