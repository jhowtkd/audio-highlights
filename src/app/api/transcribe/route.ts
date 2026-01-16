import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { TranscriptionSegment, Transcription } from '@/types';

// Interface para resposta do Whisper verbose_json
interface WhisperSegment {
  start: number;
  end: number;
  text: string;
  avg_logprob?: number;
}

interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

interface WhisperResponse {
  text: string;
  language?: string;
  segments?: WhisperSegment[];
  words?: WhisperWord[];
}

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

    // Verifica as variáveis de ambiente da Pica
    if (!process.env.PICA_SECRET_KEY || !process.env.PICA_OPENAI_CONNECTION_KEY) {
      return NextResponse.json(
        { error: 'Credenciais da Pica API não configuradas' },
        { status: 500 }
      );
    }

    // Prepara o FormData para a API da Pica
    const picaFormData = new FormData();
    picaFormData.append('file', file);
    picaFormData.append('model', 'whisper-1');
    picaFormData.append('language', 'pt');
    picaFormData.append('response_format', 'verbose_json');
    picaFormData.append('timestamp_granularities[]', 'segment');
    picaFormData.append('timestamp_granularities[]', 'word');

    // Chama a API do Whisper via Pica passthrough
    const response = await fetch('https://api.picaos.com/v1/passthrough/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'x-pica-secret': process.env.PICA_SECRET_KEY,
        'x-pica-connection-key': process.env.PICA_OPENAI_CONNECTION_KEY,
        'x-pica-action-id': 'conn_mod_def::GDzgH4tQCbA::kJ8mPI-0SmO6UV04cpjyZw',
      },
      body: picaFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API Pica:', errorText);
      return NextResponse.json(
        { error: `Erro na API do Whisper: ${errorText}` },
        { status: response.status }
      );
    }

    const transcriptionResponse: WhisperResponse = await response.json();

    // Processa os segmentos
    const segments: TranscriptionSegment[] = (transcriptionResponse.segments || []).map(
      (segment) => ({
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

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar a transcrição' },
      { status: 500 }
    );
  }
}
