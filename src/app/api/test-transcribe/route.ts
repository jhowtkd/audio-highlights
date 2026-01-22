import { NextResponse } from 'next/server';
import { getGroqClient, GROQ_WHISPER_MODEL } from '@/lib/groq-client';

export async function GET() {
    try {
        // Check client initialization
        const client = getGroqClient();

        // Create a tiny valid dummy WAV file in memory (RIFF header + 1 second of silence)
        // Minimal standard 44 byte WAV header for 16-bit mono 44.1kHz
        const buffer = Buffer.from([
            0x52, 0x49, 0x46, 0x46, // "RIFF"
            0x24, 0x00, 0x00, 0x00, // ChunkSize (36 + data size)
            0x57, 0x41, 0x56, 0x45, // "WAVE"
            0x66, 0x6d, 0x74, 0x20, // "fmt "
            0x10, 0x00, 0x00, 0x00, // Subchunk1Size (16 for PCM)
            0x01, 0x00,             // AudioFormat (1 for PCM)
            0x01, 0x00,             // NumChannels (1 for mono)
            0x44, 0xac, 0x00, 0x00, // SampleRate (44100)
            0x88, 0x58, 0x01, 0x00, // ByteRate (44100 * 2)
            0x02, 0x00,             // BlockAlign (2)
            0x10, 0x00,             // BitsPerSample (16)
            0x64, 0x61, 0x74, 0x61, // "data"
            0x00, 0x00, 0x00, 0x00  // Subchunk2Size (0 bytes of data for now)
        ]);

        const file = new File([buffer], 'silence.wav', { type: 'audio/wav' });

        console.log('Testing Groq API with silence.wav...');

        const response = await client.audio.transcriptions.create({
            file: file,
            model: GROQ_WHISPER_MODEL,
        });

        return NextResponse.json({
            success: true,
            message: 'Groq API is working perfectly!',
            transcription: response.text
        });

    } catch (error: any) {
        console.error('Groq Test Error:', error);

        return NextResponse.json({
            success: false,
            error: 'Groq API Test Failed',
            details: error.message,
            // If full response available
            apiCode: error.status,
            apiBody: error.response ? await error.response.text().catch(() => 'no-body') : undefined
        }, { status: 500 }); // Return 200 or 500 but as JSON, not 403 HTML
    }
}
