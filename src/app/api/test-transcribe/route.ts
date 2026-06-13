import { NextResponse } from 'next/server';
import { getGroqClient, GROQ_WHISPER_MODEL } from '@/lib/groq-client';

export async function GET() {
    // SECURITY: Disable test endpoints in production
    if (process.env.NODE_ENV === 'production') {
        return new NextResponse(null, { status: 404 });
    }

    try {
        // Check client initialization
        const client = getGroqClient();

        // Create a 1-second silence WAV file
        // 44100 Hz, 16-bit, 1 channel = 88200 bytes per second
        const sampleRate = 44100;
        const numChannels = 1;
        const bitsPerSample = 16;
        const durationSeconds = 1;
        const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
        const blockAlign = numChannels * (bitsPerSample / 8);
        const dataSize = byteRate * durationSeconds;
        const chunkSize = 36 + dataSize;

        const buffer = Buffer.alloc(44 + dataSize);

        // RIFF header
        buffer.write('RIFF', 0);
        buffer.writeUInt32LE(chunkSize, 4);
        buffer.write('WAVE', 8);

        // fmt chunk
        buffer.write('fmt ', 12);
        buffer.writeUInt32LE(16, 16); // Subchunk1Size
        buffer.writeUInt16LE(1, 20);  // AudioFormat (PCM)
        buffer.writeUInt16LE(numChannels, 22);
        buffer.writeUInt32LE(sampleRate, 24);
        buffer.writeUInt32LE(byteRate, 28);
        buffer.writeUInt16LE(blockAlign, 32);
        buffer.writeUInt16LE(bitsPerSample, 34);

        // data chunk
        buffer.write('data', 36);
        buffer.writeUInt32LE(dataSize, 40);

        // Silence is already zeros (Buffer.alloc fills with 0)

        const file = new File([buffer], 'silence.wav', { type: 'audio/wav' });

        console.log(`Testing Groq API with silence.wav (${file.size} bytes)...`);

        const response = await client.audio.transcriptions.create({
            file: file,
            model: GROQ_WHISPER_MODEL,
        });

        return NextResponse.json({
            success: true,
            message: 'Groq API is working perfectly!',
            transcription: response.text
        });

    } catch (error: unknown) {
        console.error('Groq Test Error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStatus = (error as { status?: number }).status;

        return NextResponse.json({
            success: false,
            error: 'Groq API Test Failed',
            details: errorMessage,
            apiCode: errorStatus,
        }, { status: 500 });
    }
}
