'use client';

import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export function useFFmpeg() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const ffmpegRef = useRef<FFmpeg | null>(null);

    const load = useCallback(async () => {
        if (isLoaded) return;

        // Lazy init - only in browser
        if (typeof window === 'undefined') {
            throw new Error('FFmpeg só pode ser usado no navegador');
        }

        if (!ffmpegRef.current) {
            ffmpegRef.current = new FFmpeg();
        }
        const ffmpeg = ffmpegRef.current;

        setMessage('Carregando FFmpeg...');

        // Listen to progress
        ffmpeg.on('progress', ({ progress: p }) => {
            setProgress(Math.round(p * 100));
        });

        try {
            // Load from CDN with explicit URLs (Turbopack compatible)
            await ffmpeg.load({
                coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
                wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
            });
            setIsLoaded(true);
            setMessage('FFmpeg pronto');
        } catch (error) {
            console.error('Erro ao carregar FFmpeg:', error);
            setMessage('Erro ao carregar renderizador de vídeo');
            throw error;
        }
    }, [isLoaded]);

    /**
     * Extract audio from video file
     * Returns a MP3 File
     */
    const extractAudio = useCallback(async (videoFile: File): Promise<File> => {
        await load();
        const ffmpeg = ffmpegRef.current;
        if (!ffmpeg) throw new Error('FFmpeg não inicializado');

        setIsProcessing(true);
        setProgress(0);
        setMessage('Extraindo áudio...');

        try {
            await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
            await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', '-q:a', '4', 'output.mp3']);
            const data = await ffmpeg.readFile('output.mp3');

            await ffmpeg.deleteFile('input.mp4');
            await ffmpeg.deleteFile('output.mp3');

            const blob = new Blob([data as unknown as BlobPart], { type: 'audio/mpeg' });
            const audioFile = new File([blob], `${videoFile.name.replace(/\.[^/.]+$/, "")}.mp3`, { type: 'audio/mpeg' });

            return audioFile;
        } catch (err) {
            console.error(err);
            throw new Error('Falha na extração de áudio');
        } finally {
            setIsProcessing(false);
            setProgress(0);
            setMessage('');
        }
    }, [load]);

    /**
     * Convert any audio file to MP3 format
     * Useful for M4A/AAC files that OpenAI Whisper may not support directly
     */
    const convertToMp3 = useCallback(async (audioFile: File): Promise<File> => {
        // If already MP3, return as-is
        if (audioFile.type === 'audio/mpeg' || audioFile.name.toLowerCase().endsWith('.mp3')) {
            return audioFile;
        }

        await load();
        const ffmpeg = ffmpegRef.current;
        if (!ffmpeg) throw new Error('FFmpeg não inicializado');

        setIsProcessing(true);
        setProgress(0);
        setMessage('Convertendo áudio para MP3...');

        try {
            const ext = audioFile.name.split('.').pop() || 'audio';
            const inputName = `input.${ext}`;

            await ffmpeg.writeFile(inputName, await fetchFile(audioFile));
            await ffmpeg.exec([
                '-i', inputName,
                '-acodec', 'libmp3lame',
                '-q:a', '2', // Higher quality for conversion
                '-ar', '44100', // Standard sample rate
                'output.mp3'
            ]);
            const data = await ffmpeg.readFile('output.mp3');

            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile('output.mp3');

            const blob = new Blob([data as unknown as BlobPart], { type: 'audio/mpeg' });
            const mp3File = new File(
                [blob],
                `${audioFile.name.replace(/\.[^/.]+$/, "")}.mp3`,
                { type: 'audio/mpeg' }
            );

            console.log(`Convertido ${audioFile.name} (${audioFile.type}) -> ${mp3File.name}`);
            return mp3File;
        } catch (err) {
            console.error('Erro na conversão para MP3:', err);
            throw new Error('Falha na conversão de áudio para MP3');
        } finally {
            setIsProcessing(false);
            setProgress(0);
            setMessage('');
        }
    }, [load]);

    /**
     * Cut video clip
     */
    const cutVideo = useCallback(async (videoFile: File, start: number, end: number): Promise<Blob> => {
        await load();
        const ffmpeg = ffmpegRef.current;
        if (!ffmpeg) throw new Error('FFmpeg não inicializado');

        setIsProcessing(true);
        setProgress(0);
        setMessage('Cortando vídeo...');

        try {
            await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

            const duration = end - start;

            // Precise cut: -i first, then -ss for accurate seeking
            // -avoid_negative_ts make_zero helps with timestamp issues
            await ffmpeg.exec([
                '-i', 'input.mp4',
                '-ss', start.toString(),
                '-t', duration.toString(),
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-c:a', 'aac',
                '-avoid_negative_ts', 'make_zero',
                'output.mp4'
            ]);

            const data = await ffmpeg.readFile('output.mp4');

            await ffmpeg.deleteFile('input.mp4');
            await ffmpeg.deleteFile('output.mp4');

            return new Blob([data as unknown as BlobPart], { type: 'video/mp4' });
        } catch (err) {
            console.error(err);
            throw new Error('Falha ao cortar vídeo');
        } finally {
            setIsProcessing(false);
            setProgress(0);
            setMessage('');
        }
    }, [load]);

    /**
     * Split audio at specific time
     */
    const splitAudio = useCallback(async (
        audioFile: File,
        startTime: number,
        duration: number,
        index: number
    ): Promise<File> => {
        await load();
        const ffmpeg = ffmpegRef.current;
        if (!ffmpeg) throw new Error('FFmpeg não inicializado');

        setIsProcessing(true);
        setMessage(`Dividindo parte ${index + 1}...`);

        try {
            // Determine input extension based on MIME type, not filename
            // This is important when a file was converted (e.g., M4A->MP3) but keeps original name
            let ext = 'mp3';
            if (audioFile.type === 'audio/mpeg' || audioFile.type === 'audio/mp3') {
                ext = 'mp3';
            } else if (audioFile.type.includes('m4a') || audioFile.type === 'audio/mp4' || audioFile.type === 'audio/aac') {
                ext = 'm4a';
            } else if (audioFile.type.includes('wav')) {
                ext = 'wav';
            } else if (audioFile.type.includes('ogg')) {
                ext = 'ogg';
            } else if (audioFile.type.includes('flac')) {
                ext = 'flac';
            }

            const inputName = `input_${index}.${ext}`;
            const outputName = `output_${index}.mp3`; // Always output as MP3 for consistency

            await ffmpeg.writeFile(inputName, await fetchFile(audioFile));

            await ffmpeg.exec([
                '-ss', startTime.toString(),
                '-t', duration.toString(),
                '-i', inputName,
                '-acodec', 'libmp3lame',
                '-q:a', '4',
                outputName
            ]);

            const data = await ffmpeg.readFile(outputName);

            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile(outputName);

            const blob = new Blob([data as unknown as BlobPart], { type: 'audio/mpeg' });
            return new File([blob], `chunk_${index}.mp3`, { type: 'audio/mpeg' });
        } catch (err) {
            console.error(err);
            throw new Error(`Falha ao dividir áudio (parte ${index + 1})`);
        } finally {
            setIsProcessing(false);
            setMessage('');
        }
    }, [load]);

    return { isLoaded, isProcessing, progress, message, load, extractAudio, convertToMp3, cutVideo, splitAudio };
}
