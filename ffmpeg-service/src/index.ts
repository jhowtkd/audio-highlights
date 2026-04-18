import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers with Helmet - Apply early to ensure headers on all responses
// Allow cross-origin resource policy so frontend can load video/audio
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

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

// Rate limiting to prevent abuse - Apply after CORS so rate-limited responses have CORS headers
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

app.use(express.json({ limit: '1mb' }));

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
        const stats = await fs.promises.stat(file.path);
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
            res.status(500).json({ error: 'FFmpeg processing failed. Please check server logs.' });
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
        res.status(500).json({ error: 'Failed to start FFmpeg. Please check server logs.' });
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

    const MAX_SEGMENTS = 100;
    if (parsedSegments.length > MAX_SEGMENTS) {
        res.status(400).json({ error: `Too many segments. Maximum allowed is ${MAX_SEGMENTS}.` });
        return;
    }

    // Validate each segment content for security
    for (const seg of parsedSegments) {
        if (!seg || typeof seg.start !== 'number' || typeof seg.end !== 'number' ||
            isNaN(seg.start) || isNaN(seg.end) ||
            seg.start < 0 || seg.end <= seg.start) {
            res.status(400).json({ error: 'Invalid segment values. Start must be >= 0 and End > Start.' });
            return;
        }
    }

    const sessionId = uuidv4();
    const tempDir = path.join('/tmp', sessionId);
    await fs.promises.mkdir(tempDir, { recursive: true });

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
        await fs.promises.writeFile(concatListPath, concatContent);
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
        res.status(500).json({ error: 'Concat processing failed. Please check server logs.' });
    }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Error]', err);
    res.status(500).json({ error: 'Internal server error. Please check server logs.' });
});

app.listen(PORT, () => {
    console.log(`🎬 FFmpeg Service running on port ${PORT}`);
});
