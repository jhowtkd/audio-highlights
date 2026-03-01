import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

// Set ffmpeg path to the static binary
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

/**
 * Formats that need conversion before sending to Whisper API
 * M4A files from Apple devices often have codec issues
 */
const FORMATS_NEEDING_CONVERSION = ['.m4a', '.aac', '.wma', '.amr'];

/**
 * Check if a file needs conversion based on its extension
 */
export function needsConversion(fileName: string): boolean {
    const ext = getExtension(fileName).toLowerCase();
    return FORMATS_NEEDING_CONVERSION.includes(ext);
}

/**
 * Convert audio file to MP3 format using FFmpeg
 * @param file - The original File object
 * @returns A new File object with MP3 format
 */
export async function convertToMp3(file: File): Promise<File> {
    const tempId = uuidv4();
    const inputPath = join(tmpdir(), `input-${tempId}${getExtension(file.name)}`);
    const outputPath = join(tmpdir(), `output-${tempId}.mp3`);

    try {
        // Write input file to temp directory
        const arrayBuffer = await file.arrayBuffer();
        await writeFile(inputPath, Buffer.from(arrayBuffer));

        // Convert to MP3
        await new Promise<void>((resolve, reject) => {
            ffmpeg(inputPath)
                .audioCodec('libmp3lame')
                .audioBitrate('192k')
                .audioChannels(2)
                .audioFrequency(44100)
                .format('mp3')
                .on('error', (err) => {
                    console.error('[Audio Converter] FFmpeg error:', err.message);
                    reject(new Error(`Conversion failed: ${err.message}`));
                })
                .on('end', () => {
                    console.log('[Audio Converter] Conversion completed');
                    resolve();
                })
                .save(outputPath);
        });

        // Read the converted file
        const convertedBuffer = await readFile(outputPath);
        const newFileName = file.name.replace(/\.[^.]+$/, '.mp3');

        // Create a new File object
        const convertedFile = new File(
            [convertedBuffer],
            newFileName,
            { type: 'audio/mpeg' }
        );

        return convertedFile;
    } finally {
        // Cleanup temp files
        await cleanupTempFile(inputPath);
        await cleanupTempFile(outputPath);
    }
}

/**
 * Get file extension from filename
 */
export function getExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) return '';
    const ext = fileName.substring(lastDot);
    // Validate: only alphanumeric chars after dot
    if (!/^\.[a-zA-Z0-9]+$/.test(ext)) {
        return '';
    }
    return ext;
}

/**
 * Safely delete a temporary file
 */
async function cleanupTempFile(filePath: string): Promise<void> {
    try {
        await unlink(filePath);
    } catch {
        // Ignore errors - file might not exist
    }
}
