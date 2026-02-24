import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVICE_DIR = path.resolve(__dirname, '../ffmpeg-service');
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

// Helper to kill process on port
const killPort = (port) => {
    try {
        const pid = execSync(`lsof -t -i :${port}`).toString().trim();
        if (pid) {
            console.log(`Killing process on port ${port} (PID: ${pid})`);
            execSync(`kill -9 ${pid}`);
        }
    } catch (e) {
        // Ignore if no process found
    }
};

const main = async () => {
    console.log('--- Verification Script Started ---');

    // 1. Cleanup
    killPort(PORT);
    const testFile = 'test_fake.mp4';
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);

    // 2. Create dummy file (text file to force ffmpeg error)
    fs.writeFileSync(testFile, 'This is not a video file. This is text to confuse ffmpeg.');
    console.log(`Created dummy file: ${testFile}`);

    // 3. Start Service
    console.log('Starting ffmpeg-service...');
    // We use 'npx ts-node' to run the service
    const serviceProcess = spawn('npx', ['ts-node', 'src/index.ts'], {
        cwd: SERVICE_DIR,
        env: { ...process.env, PORT: PORT.toString() },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    serviceProcess.stdout.on('data', (d) => { stdout += d.toString(); });
    serviceProcess.stderr.on('data', (d) => { stderr += d.toString(); });

    // Wait for service to be ready
    let ready = false;
    for (let i = 0; i < 30; i++) {
        try {
            const res = await fetch(`${BASE_URL}/health`);
            if (res.ok) {
                ready = true;
                break;
            }
        } catch (e) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    if (!ready) {
        console.error('Service failed to start within 30s');
        console.error('Stderr:', stderr);
        serviceProcess.kill();
        process.exit(1);
    }
    console.log('Service is ready.');

    let exitCode = 0;

    try {
        // 4. Test Headers
        console.log('Testing Security Headers...');
        const healthRes = await fetch(`${BASE_URL}/health`);
        const headers = healthRes.headers;
        const securityHeaders = [
            'x-content-type-options',
            'x-frame-options',
            'strict-transport-security'
        ];

        const missingHeaders = securityHeaders.filter(h => !headers.has(h));
        if (missingHeaders.length > 0) {
            console.error('FAIL: Missing security headers:', missingHeaders.join(', '));
            exitCode = 1;
        } else {
            console.log('PASS: All security headers present.');
        }

        // 5. Test Error Sanitization
        console.log('Testing Error Sanitization (uploading invalid file)...');
        const formData = new FormData();
        // Create a blob from the file buffer
        const fileBuffer = fs.readFileSync(testFile);
        const blob = new Blob([fileBuffer], { type: 'video/mp4' });
        formData.append('video', blob, 'test_fake.mp4');
        formData.append('start', '0');
        formData.append('end', '10');

        const errorRes = await fetch(`${BASE_URL}/cut-video`, {
            method: 'POST',
            body: formData
        });

        const errorBody = await errorRes.json();
        console.log('Error Response:', JSON.stringify(errorBody));

        if (errorRes.status !== 500) {
             console.error(`WARN: Expected status 500, got ${errorRes.status}`);
        }

        if (errorBody.details) {
            console.error('FAIL: Error response contains "details" field (Information Leakage).');
            exitCode = 1;
        } else if (errorBody.error && (errorBody.error.includes('stderr') || errorBody.error.length > 100)) {
             console.error('FAIL: Error message seems verbose/raw.');
             exitCode = 1;
        } else {
            console.log('PASS: Error response is sanitized.');
        }

        // 6. Check Server Logs
        // Wait a bit for logs to flush
        await new Promise(r => setTimeout(r, 1000));

        // We check if the detailed error was logged.
        // With current implementation, it logs '[FFmpeg] Error: ...'
        if (stderr.includes('Error:') || stdout.includes('Error:')) {
             console.log('PASS: Detailed error logged to server console.');
        } else {
             console.warn('WARN: Detailed error NOT found in server logs. Debugging might be hard.');
             console.log('Captured Stderr:', stderr);
        }

    } catch (e) {
        console.error('Test execution failed:', e);
        exitCode = 1;
    } finally {
        serviceProcess.kill();
        if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    }

    process.exit(exitCode);
};

main();
