import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_DIR = path.join(__dirname, '../ffmpeg-service');
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function startService() {
    console.log('Starting ffmpeg-service...');
    // Kill any existing process on port 3001
    try {
        const kill = spawn('kill', ['-9', '$(lsof -t -i:3001)'], { shell: true });
        await new Promise(r => setTimeout(r, 1000));
    } catch (e) {}

    const serviceProcess = spawn('npm', ['run', 'dev'], {
        cwd: SERVICE_DIR,
        stdio: 'pipe',
        env: { ...process.env, PORT: String(PORT) }
    });

    serviceProcess.stdout.on('data', (data) => {
        console.log(`[Service]: ${data.toString().trim()}`);
    });

    serviceProcess.stderr.on('data', (data) => {
        console.error(`[Service ERR]: ${data.toString().trim()}`);
    });

    // Wait for service to be ready
    for (let i = 0; i < 15; i++) { // Reduced retry count
        try {
            console.log(`Waiting for service... (${i+1}/15)`);
            const res = await fetch(`${BASE_URL}/health`);
            if (res.ok) {
                console.log('Service is ready!');
                return serviceProcess;
            }
        } catch (e) {
            // console.log('Fetch error:', e.cause || e.message);
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error('Service failed to start');
}

async function testConcatSegments(segments, description) {
    console.log(`Testing: ${description}`);

    // create dummy file if not exists
    if (!fs.existsSync('dummy_video.mp4')) {
        fs.writeFileSync('dummy_video.mp4', 'dummy content');
    }

    const formData = new FormData();
    const blob = new Blob(['dummy content'], { type: 'video/mp4' });
    formData.append('video', blob, 'dummy_video.mp4');
    formData.append('segments', JSON.stringify(segments));

    try {
        const res = await fetch(`${BASE_URL}/concat-segments`, {
            method: 'POST',
            body: formData,
        });

        const status = res.status;
        const text = await res.text();
        console.log(`Response Status: ${status}`);
        // console.log(`Response Body: ${text}`);

        return { status, text };
    } catch (err) {
        console.error('Request failed:', err);
        return { status: 0, text: err.message };
    }
}

async function main() {
    let serviceProcess;
    try {
        serviceProcess = await startService();

        // Test 1: Too many segments
        const manySegments = Array.from({ length: 150 }, (_, i) => ({ start: i, end: i + 1 }));
        const res1 = await testConcatSegments(manySegments, 'Too many segments (>100)');

        if (res1.status === 400) {
            console.log('✅ PASS: Rejected too many segments');
        } else {
            console.log('❌ FAIL: Accepted too many segments (or failed with 500)');
        }

        // Test 2: Invalid segment data (end < start)
        const invalidSegments = [{ start: 10, end: 5 }];
        const res2 = await testConcatSegments(invalidSegments, 'Invalid segment (end < start)');

        if (res2.status === 400) {
            console.log('✅ PASS: Rejected invalid segment (end < start)');
        } else {
            console.log('❌ FAIL: Accepted invalid segment (end < start)');
        }

         // Test 3: Invalid segment data (negative start)
        const negativeSegments = [{ start: -5, end: 10 }];
        const res3 = await testConcatSegments(negativeSegments, 'Invalid segment (negative start)');

        if (res3.status === 400) {
            console.log('✅ PASS: Rejected negative start time');
        } else {
            console.log('❌ FAIL: Accepted negative start time');
        }

        // Test 4: Invalid segment data (non-numeric)
        const stringSegments = [{ start: "ten", end: "twenty" }];
        const res4 = await testConcatSegments(stringSegments, 'Invalid segment (non-numeric)');

        if (res4.status === 400) {
            console.log('✅ PASS: Rejected non-numeric segment');
        } else {
            console.log('❌ FAIL: Accepted non-numeric segment');
        }


    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        if (serviceProcess) {
            serviceProcess.kill();
        }
        if (fs.existsSync('dummy_video.mp4')) {
            fs.unlinkSync('dummy_video.mp4');
        }
        process.exit(0);
    }
}

main();
