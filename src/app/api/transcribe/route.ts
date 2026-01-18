import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import type { TranscriptionSegment, Transcription } from '@/types';
import type { WhisperResponse } from '@/types/api';
import { WHISPER_MODEL, ERROR_MESSAGES } from '@/lib/constants';
import { createErrorResponse, requireEnvVar, AppError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const apiKey = requireEnvVar('OPENAI_API_KEY');

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
    const openai = new OpenAI({
      apiKey,
      organization: process.env.OPENAI_ORG_ID,
    });

    // OpenAI API fix: .opus files are supported but must be sent with .ogg extension/MIME
    let fileToSend = file;
    if (file.type === 'audio/opus' || file.name.toLowerCase().endsWith('.opus')) {
      const newName = file.name.replace(/\.opus$/i, '.ogg');
      fileToSend = new File([file], newName, { type: 'audio/ogg' });
    }

    // Call OpenAI Whisper API - auto-detects language
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: fileToSend,
      model: WHISPER_MODEL,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment', 'word'],
    }) as unknown as WhisperResponse;

    // Process segments
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
