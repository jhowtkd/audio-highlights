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
     * Cut video clip - uses server-side FFmpeg if available, falls back to WASM
     */
    const cutVideo = useCallback(async (videoFile: File, start: number, end: number): Promise<Blob> => {
        const serviceUrl = process.env.NEXT_PUBLIC_FFMPEG_SERVICE_URL;

        // Try server-side processing first (much faster)
        if (serviceUrl) {
            setIsProcessing(true);
            setProgress(10);
            setMessage('Enviando para processamento...');

            try {
                const formData = new FormData();
                formData.append('video', videoFile);
                formData.append('start', start.toString());
                formData.append('end', end.toString());

                setProgress(30);
                setMessage('Processando vídeo no servidor...');

                const response = await fetch(`${serviceUrl}/cut-video`, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(error.error || `HTTP ${response.status}`);
                }

                setProgress(90);
                setMessage('Baixando resultado...');

                const blob = await response.blob();

                setProgress(100);
                setMessage('Concluído!');

                return blob;
            } catch (err) {
                console.warn('[FFmpeg] Server processing failed, falling back to WASM:', err);
                // Fall through to WASM processing
            } finally {
                setIsProcessing(false);
                setProgress(0);
                setMessage('');
            }
        }

        // Fallback to WASM processing (slower but works offline)
        await load();
        const ffmpeg = ffmpegRef.current;
        if (!ffmpeg) throw new Error('FFmpeg não inicializado');

        setIsProcessing(true);
        setProgress(0);
        setMessage('Cortando vídeo (local)...');

        try {
            await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

            // Apply padding to avoid clipping words, but respect file boundaries
            const PAD = 0.5;

            const safeStart = Math.max(0, start - PAD);
            const safeEnd = end + PAD;
            const duration = safeEnd - safeStart;

            await ffmpeg.exec([
                '-ss', safeStart.toString(),
                '-i', 'input.mp4',
                '-t', duration.toString(),
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-c:a', 'aac',
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

    /**
     * Cut and concatenate multiple segments into one video (Mix mode)
     * Falls back to simple cut if concat fails
     */
    const cutMixVideo = useCallback(async (
        videoFile: File,
        segments: Array<{ start: number; end: number }>
    ): Promise<Blob> => {
        const serviceUrl = process.env.NEXT_PUBLIC_FFMPEG_SERVICE_URL;

        if (!serviceUrl) {
            throw new Error('Mix mode requires server-side processing. Configure NEXT_PUBLIC_FFMPEG_SERVICE_URL.');
        }

        setIsProcessing(true);
        setProgress(10);

        // Calculate overall span for fallback
        const sortedSegments = [...segments].sort((a, b) => a.start - b.start);
        const overallStart = sortedSegments[0].start;
        const overallEnd = sortedSegments[sortedSegments.length - 1].end;

        try {
            // Try concat endpoint first
            setMessage(`Cortando e juntando ${segments.length} segmentos...`);
            setProgress(30);

            const formData = new FormData();
            formData.append('video', videoFile);
            formData.append('segments', JSON.stringify(segments));

            const response = await fetch(`${serviceUrl}/concat-segments`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.warn('[FFmpeg Mix] Concat failed, trying simple cut fallback:', errorData);
                throw new Error('concat_failed');
            }

            setProgress(90);
            setMessage('Baixando mix final...');
            const blob = await response.blob();
            setProgress(100);
            setMessage('Mix concluído!');
            return blob;

            } catch {
            console.warn('[FFmpeg Mix] Concat failed, using simple cut fallback');

            // Fallback: use simple cut from first segment start to last segment end
            setProgress(40);
            setMessage('Usando corte simples (início ao fim)...');

            const fallbackFormData = new FormData();
            fallbackFormData.append('video', videoFile);
            fallbackFormData.append('start', overallStart.toString());
            fallbackFormData.append('end', overallEnd.toString());

            const fallbackResponse = await fetch(`${serviceUrl}/cut-video`, {
                method: 'POST',
                body: fallbackFormData,
            });

            if (!fallbackResponse.ok) {
                const errorData = await fallbackResponse.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.details || errorData.error || 'Failed to cut video');
            }

            setProgress(90);
            setMessage('Baixando vídeo...');
            const blob = await fallbackResponse.blob();
            setProgress(100);
            setMessage('Corte concluído!');
            return blob;
        } finally {
            setIsProcessing(false);
            setProgress(0);
            setMessage('');
        }
    }, []);

    return { isLoaded, isProcessing, progress, message, load, extractAudio, convertToMp3, cutVideo, cutMixVideo, splitAudio };
}
