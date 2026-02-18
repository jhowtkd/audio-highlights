import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow requests from your Vercel domain
const allowedOrigins = [
    'http://localhost:3000',
    'https://audio-highlights.vercel.app',
    process.env.ALLOWED_ORIGIN, // Allow custom origin via env var
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Also allow any *.vercel.app domain
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json());

// Configure multer for file uploads
const upload = multer({
    dest: '/tmp/uploads/',
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max
    },
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', ffmpeg: 'ready' });
});

// Cut video endpoint
app.post('/cut-video', upload.single('video'), async (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    const { start, end } = req.body;

    if (!file) {
        res.status(400).json({ error: 'No video file provided' });
        return;
    }

    const startTime = parseFloat(start);
    const endTime = parseFloat(end);

    if (isNaN(startTime) || isNaN(endTime) || startTime < 0 || endTime <= startTime) {
        res.status(400).json({ error: 'Invalid start/end times' });
        return;
    }

    const duration = endTime - startTime;

    // Add padding for better cut accuracy
    const PAD = 0.5;
    const safeStart = Math.max(0, startTime - PAD);
    const safeDuration = duration + PAD * 2;

    // Detect if file is audio-only based on mimetype or extension
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma'];
    const isAudioOnly = file.mimetype?.startsWith('audio/') ||
        audioExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));

    // Log file info for debugging
    console.log(`[FFmpeg] Input file: ${file.originalname} (${file.size} bytes, mimetype: ${file.mimetype})`);
    console.log(`[FFmpeg] File path: ${file.path}`);
    console.log(`[FFmpeg] Is audio-only: ${isAudioOnly}`);
    console.log(`[FFmpeg] Cutting from ${safeStart}s for ${safeDuration}s`);

    // Check if file exists and has content
    try {
        const stats = fs.statSync(file.path);
        console.log(`[FFmpeg] File exists, size on disk: ${stats.size} bytes`);
    } catch (err) {
        console.error(`[FFmpeg] File not found: ${file.path}`);
        res.status(500).json({ error: 'Uploaded file not found on disk' });
        return;
    }

    // Choose output format based on input type
    const outputExt = isAudioOnly ? 'mp3' : 'mp4';
    const outputPath = path.join('/tmp', `output_${uuidv4()}.${outputExt}`);

    let ffmpegArgs: string[];

    if (isAudioOnly) {
        // Audio-only: just extract and re-encode audio
        ffmpegArgs = [
            '-y',
            '-ss', safeStart.toString(), // Input seeking for audio
            '-i', file.path,
            '-t', safeDuration.toString(),
            '-vn',  // No video
            '-c:a', 'libmp3lame',
            '-b:a', '192k',
            outputPath,
        ];
    } else {
        // Video: use STREAM COPY for FAST processing (no re-encoding)
        // -ss before -i = input seeking (fast seek to keyframe)
        console.log('[FFmpeg] Using stream copy (fast mode) for video');
        ffmpegArgs = [
            '-y',
            '-ss', safeStart.toString(), // Input seeking (fast)
            '-i', file.path,
            '-t', safeDuration.toString(),
            '-c', 'copy',  // Stream copy - no re-encoding = much faster!
            '-avoid_negative_ts', 'make_zero',
            outputPath,
        ];
    }

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    let stderr = '';

    ffmpeg.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
    });

    ffmpeg.on('close', (code: number) => {
        // Clean up input file
        fs.unlink(file.path, () => { });

        if (code !== 0) {
            console.error('[FFmpeg] Error:', stderr);
            res.status(500).json({ error: 'FFmpeg processing failed', details: stderr.slice(-500) });
            return;
        }

        // Stream the output file back with correct content type
        const contentType = isAudioOnly ? 'audio/mpeg' : 'video/mp4';
        const filename = isAudioOnly ? `clip_${Date.now()}.mp3` : `clip_${Date.now()}.mp4`;

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const readStream = fs.createReadStream(outputPath);
        readStream.pipe(res);

        readStream.on('end', () => {
            // Clean up output file
            fs.unlink(outputPath, () => { });
        });

        readStream.on('error', (err) => {
            console.error('[Stream] Error:', err);
            fs.unlink(outputPath, () => { });
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to stream file' });
            }
        });
    });

    ffmpeg.on('error', (err: Error) => {
        console.error('[FFmpeg] Spawn error:', err);
        fs.unlink(file.path, () => { });
        res.status(500).json({ error: 'Failed to start FFmpeg', details: err.message });
    });
});

// Concatenate multiple segments into one video (for Mix mode)
app.post('/concat-segments', upload.single('video'), async (req: Request, res: Response, _next: NextFunction) => {
    const file = req.file;
    const { segments } = req.body;

    if (!file) {
        res.status(400).json({ error: 'No video file provided' });
        return;
    }

    let parsedSegments: Array<{ start: number; end: number }>;
    try {
        parsedSegments = typeof segments === 'string' ? JSON.parse(segments) : segments;
        if (!Array.isArray(parsedSegments) || parsedSegments.length === 0) {
            throw new Error('Invalid segments array');
        }
    } catch {
        res.status(400).json({ error: 'Invalid segments format. Expected JSON array of {start, end} objects.' });
        return;
    }

    // Security: Limit number of segments to prevent DoS
    const MAX_SEGMENTS = 100;
    if (parsedSegments.length > MAX_SEGMENTS) {
        res.status(400).json({ error: `Too many segments. Maximum is ${MAX_SEGMENTS}` });
        return;
    }

    // Security: Validate segment data types and values
    for (const seg of parsedSegments) {
        if (!seg || typeof seg !== 'object') {
            res.status(400).json({ error: 'Invalid segment data: each segment must be an object' });
            return;
        }
        if (typeof (seg as any).start !== 'number' || typeof (seg as any).end !== 'number') {
            res.status(400).json({ error: 'Invalid segment data: start and end must be numbers' });
            return;
        }
        const s = seg as { start: number; end: number };
        if (s.start < 0 || s.end <= s.start) {
            res.status(400).json({ error: 'Invalid segment data: start must be >= 0 and end > start' });
            return;
        }
    }

    const sessionId = uuidv4();
    const tempDir = path.join('/tmp', sessionId);
    fs.mkdirSync(tempDir, { recursive: true });

    const segmentFiles: string[] = [];
    const concatListPath = path.join(tempDir, 'concat_list.txt');
    const outputPath = path.join(tempDir, 'final_output.mp4');

    console.log(`[FFmpeg Concat] Processing ${parsedSegments.length} segments`);

    try {
        // Step 1: Extract each segment using STREAM COPY (fast!)
        // Using .ts (MPEG-TS) format for segments - concatenates better
        for (let i = 0; i < parsedSegments.length; i++) {
            const seg = parsedSegments[i];
            const segmentPath = path.join(tempDir, `segment_${i}.ts`);
            segmentFiles.push(segmentPath);

            const duration = seg.end - seg.start;
            console.log(`[FFmpeg Concat] Extracting segment ${i + 1}: ${seg.start}s - ${seg.end}s (${duration}s)`);

            await new Promise<void>((resolve, reject) => {
                const ffmpeg = spawn('ffmpeg', [
                    '-y',
                    '-ss', seg.start.toString(),
                    '-i', file.path,
                    '-t', duration.toString(),
                    '-c', 'copy',  // Stream copy - fast!
                    '-bsf:v', 'h264_mp4toannexb',  // Required for .ts output
                    '-f', 'mpegts',
                    segmentPath,
                ]);

                let stderr = '';
                ffmpeg.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
                ffmpeg.on('close', (code: number) => {
                    if (code !== 0) {
                        console.error(`[FFmpeg Concat] Segment ${i + 1} failed:`, stderr.slice(-500));
                        reject(new Error(`Segment extraction failed: ${stderr.slice(-300)}`));
                    } else {
                        console.log(`[FFmpeg Concat] Segment ${i + 1} extracted successfully`);
                        resolve();
                    }
                });
                ffmpeg.on('error', reject);
            });
        }

        // Step 2: Create concat list file
        const concatContent = segmentFiles.map(f => `file '${f}'`).join('\n');
        fs.writeFileSync(concatListPath, concatContent);
        console.log('[FFmpeg Concat] Concat list:', concatContent);

        // Step 3: Concatenate all segments using stream copy (faster, no re-encoding)
        console.log('[FFmpeg Concat] Joining segments with copy codec...');
        await new Promise<void>((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-y',
                '-f', 'concat',
                '-safe', '0',
                '-i', concatListPath,
                '-c', 'copy',  // Stream copy - no re-encoding, much faster
                '-movflags', '+faststart',
                outputPath,
            ]);

            let stderr = '';
            ffmpeg.stderr.on('data', (data: Buffer) => {
                const msg = data.toString();
                stderr += msg;
                console.log('[FFmpeg Concat]', msg.trim());
            });
            ffmpeg.on('close', (code: number) => {
                if (code !== 0) {
                    console.error('[FFmpeg Concat] Failed with code', code);
                    reject(new Error(`Concat failed (code ${code}): ${stderr.slice(-500)}`));
                } else {
                    console.log('[FFmpeg Concat] Success!');
                    resolve();
                }
            });
            ffmpeg.on('error', (err) => {
                console.error('[FFmpeg Concat] Spawn error:', err);
                reject(err);
            });
        });

        // Step 4: Stream result
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="mix_${Date.now()}.mp4"`);

        const readStream = fs.createReadStream(outputPath);
        readStream.pipe(res);

        readStream.on('end', () => {
            // Cleanup
            fs.rm(tempDir, { recursive: true, force: true }, () => { });
            fs.unlink(file.path, () => { });
        });

        readStream.on('error', (err) => {
            console.error('[Stream] Error:', err);
            fs.rm(tempDir, { recursive: true, force: true }, () => { });
            fs.unlink(file.path, () => { });
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to stream video' });
            }
        });

    } catch (err) {
        console.error('[FFmpeg Concat] Error:', err);
        fs.rm(tempDir, { recursive: true, force: true }, () => { });
        fs.unlink(file.path, () => { });
        res.status(500).json({ error: 'Concat processing failed', details: String(err) });
    }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Error]', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🎬 FFmpeg Service running on port ${PORT}`);
});
