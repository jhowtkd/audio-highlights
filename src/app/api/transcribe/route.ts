import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { groq, GROQ_WHISPER_MODEL } from '@/lib/groq-client';
import type { TranscriptionSegment, Transcription } from '@/types';
import type { WhisperResponse } from '@/types/api';
import { ERROR_MESSAGES } from '@/lib/constants';
import { createErrorResponse, AppError } from '@/lib/errors';
import { needsConversion, convertToMp3 } from '@/lib/audio-converter';
import { alignWordsToSegments } from '@/lib/transcription-utils';

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    // const apiKey = requireEnvVar('OPENAI_API_KEY'); // Not needed for transcription via Groq

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string | null;

    if (!file) {
      throw new AppError(
        'No file provided',
        400,
        ERROR_MESSAGES.NO_FILE_PROVIDED
      );
    }

    // Validate file type - support multiple MIME types and fallback to extension check
    const validTypes = [
      'audio/mpeg', 'audio/mp3',
      'audio/wav', 'audio/wave', 'audio/x-wav',
      'audio/x-m4a', 'audio/mp4', 'audio/m4a', 'audio/aac', 'audio/x-aac',
      'audio/ogg', 'audio/opus',
      'audio/webm',
      'audio/flac', 'audio/x-flac'
    ];
    const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.opus', '.webm', '.flac', '.aac'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);
    if (!isValidType) {
      throw new AppError(
        `Invalid file type: ${file.type} (extension: ${fileExtension})`,
        400,
        ERROR_MESSAGES.INVALID_AUDIO_FILE
      );
    }

    // Initialize OpenAI client
    // Groq client is pre-initialized in lib/groq-client.ts

    // Convert file if needed (M4A, AAC, etc.)
    let fileToSend = file;

    if (needsConversion(file.name)) {
      console.log(`[Transcription API] Converting ${file.name} to MP3...`);
      try {
        // Vercel doesn't have system ffmpeg, so this might fail.
        // The client-side (useTaskQueue) should have handled it, but this is a fallback.
        // Verify if we are in environment with ffmpeg or warn
        if (process.env.VERCEL) {
          throw new Error('Server-side conversion disabled on Vercel. Please convert client-side.');
        }
        fileToSend = await convertToMp3(file);
        console.log(`[Transcription API] Conversion successful: ${fileToSend.name}`);
      } catch (conversionError) {
        console.error('[Transcription API] Conversion failed:', conversionError);
        // Don't fail the request immediately if it's just a conversion attempt that might be handled natively
        // But for formats like M4A that whisper might reject, we better surface the error
        throw new AppError(
          'Failed to convert audio file',
          500,
          'Não foi possível converter o áudio no servidor. Certifique-se de que a conversão ocorreu no navegador.'
        );
      }
    }

    // OpenAI API fix: .opus files are supported but must be sent with .ogg extension/MIME
    if (fileToSend.type === 'audio/opus' || fileToSend.name.toLowerCase().endsWith('.opus')) {
      const newName = fileToSend.name.replace(/\.opus$/i, '.ogg');
      fileToSend = new File([fileToSend], newName, { type: 'audio/ogg' });
    }

    console.log(`[Transcription API] Sending to Whisper: ${fileToSend.name} (${fileToSend.type})`);

    // Call Groq Whisper API
    const transcriptionResponse = await groq.audio.transcriptions.create({
      file: fileToSend,
      model: GROQ_WHISPER_MODEL,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment', 'word'],
    }) as unknown as WhisperResponse;

    // Process segments with optimized word alignment
    // Uses O(N+M) algorithm instead of O(N*M) nested loops for performance
    const alignedSegments = alignWordsToSegments(
      transcriptionResponse.segments || [],
      transcriptionResponse.words || []
    );

    const segments: TranscriptionSegment[] = alignedSegments.map(
      ({ segment, words }) => ({
        id: uuidv4(),
        start: segment.start,
        end: segment.end,
        text: segment.text.trim(),
        confidence: segment.avg_logprob ? Math.exp(segment.avg_logprob) : undefined,
        words: words.map(w => ({
          word: w.word,
          start: w.start,
          end: w.end,
          confidence: undefined
        })),
      })
    );

    // Calculate total duration
    const duration = segments.length > 0
      ? segments[segments.length - 1].end
      : 0;

    // Build transcription object
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
    return createErrorResponse(error, 'Transcription API');
  }
}
