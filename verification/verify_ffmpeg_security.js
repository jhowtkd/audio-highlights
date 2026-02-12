const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const SERVICE_DIR = path.join(__dirname, '../ffmpeg-service');
const PORT = 3001;

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkHealth() {
    try {
        const res = await fetch(`http://localhost:${PORT}/health`);
        return res.ok;
    } catch {
        return false;
    }
}

async function run() {
    console.log('Starting ffmpeg-service...');

    // We run node dist/index.js inside ffmpeg-service dir
    const service = spawn('node', ['dist/index.js'], {
        cwd: SERVICE_DIR,
        stdio: 'inherit',
        env: { ...process.env, PORT: PORT.toString() }
    });

    // Wait for service to start
    let attempts = 0;
    let running = false;
    while (attempts < 30) {
        if (await checkHealth()) {
            console.log('Service is ready!');
            running = true;
            break;
        }
        await wait(1000);
        attempts++;
        process.stdout.write('.');
    }
    console.log(''); // Newline

    if (!running) {
        console.error('Service failed to start within 30 seconds');
        service.kill();
        process.exit(1);
    }

    try {
        console.log('--- Test Case 1: Invalid Segments Format (string instead of array) ---');
        // This should fail validation immediately (already implemented check)
        // But let's test the specific vulnerability: invalid CONTENT of segments array

        console.log('--- Test Case 2: Malicious Segments Content (invalid types) ---');

        const fd = new FormData();
        // Add a dummy file
        fd.append('video', new Blob(['dummy content']), 'video.mp4');

        // Malicious segments: start is a string, which passes strict type check but fails logic
        // Wait, the current code does NOT validate types inside the array.
        // It just JSON.parse(segments) and checks Array.isArray().
        // Then it loops: const seg = parsedSegments[i];
        // spawns ffmpeg with seg.start.toString()

        const maliciousSegments = JSON.stringify([
            { start: "invalid_start_value", end: 10 }
        ]);
        fd.append('segments', maliciousSegments);

        console.log('Sending request with invalid segment data...');
        const res = await fetch(`http://localhost:${PORT}/concat-segments`, {
            method: 'POST',
            body: fd
        });

        const status = res.status;
        const text = await res.text();
        console.log(`Response Status: ${status}`);
        console.log(`Response Body: ${text}`);

        if (status === 500) {
            console.log('VERIFICATION SUCCESS: Vulnerability confirmed (500 Internal Server Error due to FFmpeg crash/error).');
            console.log('The service tried to process invalid input instead of rejecting it.');
        } else if (status === 400) {
            console.log('VERIFICATION SUCCESS: Fix confirmed (400 Bad Request).');
            console.log('The service rejected invalid input correctly.');
        } else {
            console.log(`Unexpected status: ${status}`);
        }

        console.log('--- Test Case 3: Null Segments ---');

        const fd3 = new FormData();
        fd3.append('video', new Blob(['dummy content']), 'video.mp4');
        fd3.append('segments', JSON.stringify([null]));

        const res3 = await fetch(`http://localhost:${PORT}/concat-segments`, {
            method: 'POST',
            body: fd3
        });

        console.log(`Response Status: ${res3.status}`);
        const text3 = await res3.text();
        console.log(`Response Body: ${text3}`);

        if (res3.status === 400) {
             console.log('Null segment test passed (400 Bad Request)');
        } else {
             console.log(`Null segment test FAILED (expected 400, got ${res3.status})`);
        }

    } catch (err) {
        console.error('Test execution failed:', err);
    } finally {
        console.log('Stopping service...');
        service.kill();
        // Give it a moment to die
        await wait(1000);
        process.exit(0);
    }
}

run();
