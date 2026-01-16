import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import type { TranscriptionSegment, Transcription } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key não configurada' },
        { status: 500 }
      );
    }

    // Inicializa o cliente OpenAI dentro da função
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Chama a API do Whisper com timestamps detalhados
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment', 'word'],
      language: 'pt', // Português brasileiro
    });

    // Processa os segmentos
    const segments: TranscriptionSegment[] = (transcriptionResponse.segments || []).map(
      (segment, index) => ({
        id: uuidv4(),
        start: segment.start,
        end: segment.end,
        text: segment.text.trim(),
        confidence: segment.avg_logprob ? Math.exp(segment.avg_logprob) : undefined,
        words: (transcriptionResponse.words || [])
          .filter(
            (word) =>
              word.start >= segment.start && word.end <= segment.end
          )
          .map((word) => ({
            word: word.word,
            start: word.start,
            end: word.end,
            confidence: undefined,
          })),
      })
    );

    // Calcula a duração total
    const duration = segments.length > 0
      ? segments[segments.length - 1].end
      : 0;

    // Monta o objeto de transcrição
    const transcription: Transcription = {
      id: uuidv4(),
      projectId: projectId || uuidv4(),
      fullText: transcriptionResponse.text,
      segments,
      language: transcriptionResponse.language,
      duration,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      transcription,
    });

  } catch (error) {
    console.error('Erro na transcrição:', error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `Erro na API do Whisper: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao processar a transcrição' },
      { status: 500 }
    );
  }
}
