const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');

// Configuration
const INPUT_FILE = path.join(__dirname, 'input_with_silence.mp3');
const OUTPUT_FILE = path.join(__dirname, 'output_clean.mp3');
const CONCAT_LIST = path.join(__dirname, 'concat_list.txt');
const SILENCE_THRESHOLD = '-30dB'; // Adjust as needed
const SILENCE_DURATION = 0.5; // Minimum silence duration in seconds

async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}\nStderr: ${stderr}`));
      } else {
        resolve({ stdout, stderr });
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

async function generateTestFile() {
  console.log('Generating test file with silence...');
  // Create 2s tone, 2s silence, 2s tone
  const args = [
    '-y',
    '-f', 'lavfi', '-i', 'sine=f=440:d=2',
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo:d=2',
    '-f', 'lavfi', '-i', 'sine=f=880:d=2',
    '-filter_complex', '[0:a][1:a][2:a]concat=n=3:v=0:a=1[out]',
    '-map', '[out]',
    INPUT_FILE
  ];
  await runCommand(ffmpegPath, args);
  console.log(`Test file created at ${INPUT_FILE}`);
}

async function detectSilence(filePath) {
  console.log('Detecting silence...');
  const args = [
    '-i', filePath,
    '-af', `silencedetect=n=${SILENCE_THRESHOLD}:d=${SILENCE_DURATION}`,
    '-f', 'null',
    '-'
  ];

  // ffmpeg writes silence info to stderr
  const { stderr } = await runCommand(ffmpegPath, args);

  const silenceStarts = [];
  const silenceEnds = [];

  const lines = stderr.split('\n');
  for (const line of lines) {
    if (line.includes('silence_start')) {
      const match = line.match(/silence_start: ([\d.]+)/);
      if (match) silenceStarts.push(parseFloat(match[1]));
    } else if (line.includes('silence_end')) {
      const match = line.match(/silence_end: ([\d.]+)/);
      if (match) silenceEnds.push(parseFloat(match[1]));
    }
  }

  // Combine starts and ends into intervals
  const silences = [];
  for (let i = 0; i < silenceStarts.length; i++) {
    // If silence_end is missing (e.g. silence at end of file), assume EOF?
    // Usually ffmpeg outputs silence_end even at EOF if duration is known.
    // If silence_start is present but no end, we might need file duration.
    if (silenceEnds[i] !== undefined) {
      silences.push({ start: silenceStarts[i], end: silenceEnds[i] });
    }
  }

  return silences;
}

async function getFileDuration(filePath) {
  const args = ['-i', filePath, '-hide_banner'];
  try {
    await runCommand(ffmpegPath, args);
  } catch (err) {
    // ffmpeg exits with 1 when no output file is specified, but prints duration to stderr
    const stderr = err.message;
    const match = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    if (match) {
      const hours = parseFloat(match[1]);
      const minutes = parseFloat(match[2]);
      const seconds = parseFloat(match[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
  }
  return 0;
}

function invertSilences(silences, totalDuration) {
  const segments = [];
  let currentPos = 0;

  for (const silence of silences) {
    if (silence.start > currentPos) {
      segments.push({ start: currentPos, end: silence.start });
    }
    currentPos = silence.end;
  }

  if (currentPos < totalDuration) {
    segments.push({ start: currentPos, end: totalDuration });
  }

  return segments;
}

async function concatSegments(segments, originalFile, outputFile) {
  console.log('Generating concat list...');
  let concatContent = '';

  for (const seg of segments) {
    // Check for extremely short segments that might cause issues
    if (seg.end - seg.start < 0.1) continue;

    concatContent += `file '${originalFile}'\n`;
    concatContent += `inpoint ${seg.start.toFixed(3)}\n`;
    concatContent += `outpoint ${seg.end.toFixed(3)}\n`;
  }

  fs.writeFileSync(CONCAT_LIST, concatContent);
  console.log(`Concat list written to ${CONCAT_LIST}:\n${concatContent}`);

  console.log('Concatenating segments...');
  const args = [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', CONCAT_LIST,
    '-c', 'copy',
    outputFile
  ];

  const start = Date.now();
  await runCommand(ffmpegPath, args);
  const end = Date.now();

  console.log(`Concatenation complete in ${end - start}ms`);
  console.log(`Output file: ${outputFile}`);
}

async function main() {
  try {
    await generateTestFile();

    const duration = await getFileDuration(INPUT_FILE);
    console.log(`File duration: ${duration}s`);

    const silences = await detectSilence(INPUT_FILE);
    console.log('Detected silences:', silences);

    const keepSegments = invertSilences(silences, duration);
    console.log('Keep segments (active audio):', keepSegments);

    if (keepSegments.length === 0) {
      console.log('No audio to keep!');
      return;
    }

    await concatSegments(keepSegments, INPUT_FILE, OUTPUT_FILE);

    // Verify output duration
    const outDuration = await getFileDuration(OUTPUT_FILE);
    console.log(`Output duration: ${outDuration}s (Expected: ~${duration - 2}s)`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Cleanup
    if (fs.existsSync(INPUT_FILE)) fs.unlinkSync(INPUT_FILE);
    if (fs.existsSync(OUTPUT_FILE)) fs.unlinkSync(OUTPUT_FILE);
    if (fs.existsSync(CONCAT_LIST)) fs.unlinkSync(CONCAT_LIST);
  }
}

main();
