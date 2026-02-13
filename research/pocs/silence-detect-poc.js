
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

const TEST_FILE = path.join(OUTPUT_DIR, 'test_audio.mp3');

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${ffmpegPath} ${args.join(' ')}`);
    const ffmpeg = spawn(ffmpegPath, args);
    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      } else {
        resolve(stderr);
      }
    });

    ffmpeg.on('error', (err) => {
      reject(err);
    });
  });
}

async function generateTestAudio() {
  console.log('🔊 Generating test audio with silence...');
  // Generate 10s audio:
  // 0-2s: Tone (440Hz)
  // 2-4s: Silence
  // 4-6s: Tone (880Hz)
  // 6-9s: Silence
  // 9-10s: Tone (440Hz)
  const args = [
    '-y',
    '-f', 'lavfi',
    '-i', 'sine=f=440:d=2',
    '-f', 'lavfi',
    '-i', 'aevalsrc=0:d=2',
    '-f', 'lavfi',
    '-i', 'sine=f=880:d=2',
    '-f', 'lavfi',
    '-i', 'aevalsrc=0:d=3',
    '-f', 'lavfi',
    '-i', 'sine=f=440:d=1',
    '-filter_complex', '[0:a][1:a][2:a][3:a][4:a]concat=n=5:v=0:a=1[out]',
    '-map', '[out]',
    TEST_FILE
  ];

  await runFFmpeg(args);
  console.log('✅ Test audio generated:', TEST_FILE);
  return TEST_FILE;
}

async function detectSilence(filePath) {
  console.log('🔍 Detecting silence...');
  const args = [
    '-i', filePath,
    '-af', 'silencedetect=noise=-30dB:d=0.5',
    '-f', 'null',
    '-'
  ];

  const stderr = await runFFmpeg(args);
  const silences = [];

  const lines = stderr.split('\n');
  for (const line of lines) {
    if (line.includes('silencedetect')) {
      if (line.includes('silence_start')) {
        const match = line.match(/silence_start: ([\d.]+)/);
        if (match) {
          silences.push({ start: parseFloat(match[1]), end: null });
        }
      } else if (line.includes('silence_end')) {
        const match = line.match(/silence_end: ([\d.]+)/);
        if (match) {
          const end = parseFloat(match[1]);
          const lastSilence = silences[silences.length - 1];
          if (lastSilence && lastSilence.end === null) {
            lastSilence.end = end;
            lastSilence.duration = end - lastSilence.start;
          }
        }
      }
    }
  }

  console.log('✅ Silence detection complete');
  return silences;
}

async function main() {
  try {
    await generateTestAudio();
    const silences = await detectSilence(TEST_FILE);

    console.log('\n📊 Detected Silences:');
    console.table(silences);

    // Calculate "Keep" segments (invert silences)
    const duration = 10.0; // Known duration
    const keepSegments = [];
    let lastEnd = 0;

    silences.forEach(s => {
      // If silence starts after lastEnd, there is a keep segment
      if (s.start > lastEnd) {
        keepSegments.push({ start: lastEnd, end: s.start });
      }
      lastEnd = s.end;
    });
    // Add final segment if needed
    if (lastEnd < duration) {
      keepSegments.push({ start: lastEnd, end: duration });
    }

    console.log('\n✂️ "Keep" Segments (for concatenation):');
    console.table(keepSegments);

    // Verify expected results
    // Expected silences: ~2-4s, ~6-9s
    // Expected keeps: ~0-2s, ~4-6s, ~9-10s

    const isClose = (a, b) => Math.abs(a - b) < 0.1;

    const valid =
      silences.length === 2 &&
      isClose(silences[0].start, 2.0) && isClose(silences[0].end, 4.0) &&
      isClose(silences[1].start, 6.0) && isClose(silences[1].end, 9.0);

    if (valid) {
        console.log('\n✅ POC SUCCESS: Detected silence matches generated pattern.');
    } else {
        console.error('\n❌ POC FAILED: Detected silence does not match expectation.');
    }

  } catch (err) {
    console.error('❌ Script failed:', err);
  }
}

main();
