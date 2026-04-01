// Run this POC with:
// npm install @xenova/transformers wavefile ffmpeg-static

const { pipeline } = require('@xenova/transformers');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const wavefile = require('wavefile');

const AUDIO_FILE = path.join(__dirname, 'test_audio.wav');

async function generateAudio() {
    return new Promise((resolve, reject) => {
        console.log('Generating dummy audio file with FFmpeg...');
        const ffmpeg = spawn(ffmpegPath, [
            '-f', 'lavfi',
            '-i', 'sine=frequency=1000:duration=5', // 5 seconds of 1kHz sine wave
            '-ac', '1', // mono
            '-ar', '16000', // 16kHz sample rate (optimal for Whisper)
            '-y',
            AUDIO_FILE
        ]);

        ffmpeg.stderr.on('data', (data) => {
            // console.error(`FFmpeg stderr: ${data}`); // excessive logging
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                console.log('Audio file generated successfully.');
                resolve();
            } else {
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });
    });
}

async function runPOC() {
    try {
        await generateAudio();

        console.log('Loading Whisper model (Xenova/whisper-tiny)...');
        const startTime = performance.now();

        // Load the pipeline
        const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');

        const loadTime = performance.now() - startTime;
        console.log(`Model loaded in ${(loadTime / 1000).toFixed(2)}s`);

        console.log('Reading audio file...');
        const buffer = fs.readFileSync(AUDIO_FILE);
        const wav = new wavefile.WaveFile(buffer);
        wav.toBitDepth('32f'); // Convert to 32-bit float
        wav.toSampleRate(16000); // Resample to 16kHz
        let audioData = wav.getSamples();
        if (Array.isArray(audioData)) {
            // Stereo, take first channel
            if (audioData.length > 0) {
                 audioData = audioData[0];
            }
        }

        // Ensure Float32Array
        const float32Audio = new Float32Array(audioData);

        console.log('Transcribing audio...');
        const transStart = performance.now();

        // Transcribe
        const output = await transcriber(float32Audio);

        const transTime = performance.now() - transStart;

        console.log('Transcription result:', output);
        console.log(`Transcription took ${(transTime / 1000).toFixed(2)}s`);

    } catch (error) {
        console.error('Error running POC:', error);
    }
}

runPOC();
