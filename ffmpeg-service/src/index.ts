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

    const outputPath = path.join('/tmp', `output_${uuidv4()}.mp4`);
    const duration = endTime - startTime;

    // Add padding for better cut accuracy
    const PAD = 0.5;
    const safeStart = Math.max(0, startTime - PAD);
    const safeDuration = duration + PAD * 2;

    console.log(`[FFmpeg] Cutting video: ${file.originalname} from ${safeStart}s for ${safeDuration}s`);

    const ffmpegArgs = [
        '-y',
        '-ss', safeStart.toString(),
        '-i', file.path,
        '-t', safeDuration.toString(),
        '-c:v', 'libx264',
        '-preset', 'fast', // Good balance of speed vs quality
        '-crf', '23',      // Reasonable quality
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart', // Optimize for web streaming
        outputPath,
    ];

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

        // Stream the output file back
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="clip_${Date.now()}.mp4"`);

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
                res.status(500).json({ error: 'Failed to stream video' });
            }
        });
    });

    ffmpeg.on('error', (err: Error) => {
        console.error('[FFmpeg] Spawn error:', err);
        fs.unlink(file.path, () => { });
        res.status(500).json({ error: 'Failed to start FFmpeg', details: err.message });
    });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Error]', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🎬 FFmpeg Service running on port ${PORT}`);
});
