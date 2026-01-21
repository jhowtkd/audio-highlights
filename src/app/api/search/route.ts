import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GPT_MODEL } from '@/lib/constants';
import { createErrorResponse, requireEnvVar } from '@/lib/errors';
import { z } from 'zod';
import { cosineSimilarity } from '@/lib/math';

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
const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHUNKS_TO_SEARCH = 3; // Number of chunks to process with LLM

async function getEmbeddings(openai: OpenAI, texts: string[]): Promise<number[][]> {
    try {
        // Handle token limits if necessary, but 150 segments * batch size should be fine for now
        // If texts is very large, we might need to batch the requests to embedding API
        // For now, assuming reasonable usage pattern.
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: texts,
        });
        return response.data.map(item => item.embedding);
    } catch (error) {
        console.error('Error generating embeddings:', error);
        throw error;
    }
}

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

        // Optimization: Use embeddings to filter chunks before sending to LLM
        // 1. Generate embedding for query
        // 2. Generate embeddings for each chunk (text)
        // 3. Compute cosine similarity
        // 4. Select top K chunks

        let targetChunks = chunks;

        try {
            // Generate query embedding
            const queryEmbeddingPromise = getEmbeddings(openai, [query]).then(res => res[0]);

            // Generate chunk embeddings
            // We concatenate the text of the chunk for embedding
            const chunkTexts = chunks.map(chunk => chunk.data.map(s => s.text).join(' '));
            const chunkEmbeddingsPromise = getEmbeddings(openai, chunkTexts);

            const [queryEmbedding, chunkEmbeddings] = await Promise.all([
                queryEmbeddingPromise,
                chunkEmbeddingsPromise
            ]);

            // Calculate similarities
            const chunkSimilarities = chunks.map((chunk, index) => {
                const similarity = cosineSimilarity(queryEmbedding, chunkEmbeddings[index]);
                return { chunk, index, similarity };
            });

            // Sort by similarity descending
            chunkSimilarities.sort((a, b) => b.similarity - a.similarity);

            // Select top K chunks
            // We take at least 1, and up to CHUNKS_TO_SEARCH
            // But if we have fewer chunks than CHUNKS_TO_SEARCH, we take all
            targetChunks = chunkSimilarities
                .slice(0, Math.min(chunkSimilarities.length, CHUNKS_TO_SEARCH))
                .map(item => item.chunk);

            console.log(`[Search API] Filtered ${chunks.length} chunks to ${targetChunks.length} using embeddings.`);

        } catch (embeddingError) {
            console.warn('[Search API] Embedding optimization failed, falling back to full search:', embeddingError);
            // Fallback: targetChunks remains as all chunks
        }

        // Process selected chunks in parallel
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
