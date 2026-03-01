import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Set ffmpeg path
console.log('ffmpeg-static path:', ffmpegPath);
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
} else {
  console.error('ffmpeg-static not found');
  process.exit(1);
}

// Set ffprobe path
if (ffprobePath.path) {
    ffmpeg.setFfprobePath(ffprobePath.path);
}

const TEST_FILE = 'test_silence.mp3';
const OUTPUT_FILE = 'output_no_silence.mp3';
const CONCAT_LIST = 'concat_list.txt';
const SILENCE_THRESHOLD = '-30dB'; // Silence threshold
const MIN_SILENCE_DURATION = 2; // Minimum duration to be considered silence (seconds)

async function generateTestAudio() {
  console.log('Generating test audio with silence...');
  return new Promise<void>((resolve, reject) => {
    // Use spawn directly to avoid fluent-ffmpeg capability issues with lavfi
    const args = [
      '-y',
      '-f', 'lavfi', '-i', 'sine=frequency=440:duration=5',
      '-f', 'lavfi', '-i', 'anullsrc=duration=5',
      '-f', 'lavfi', '-i', 'sine=frequency=880:duration=5',
      '-filter_complex', '[0:a][1:a][2:a]concat=n=3:v=0:a=1[out]',
      '-map', '[out]',
      TEST_FILE
    ];

    const proc = spawn(ffmpegPath, args);
    let stderr = '';
    proc.stderr.on('data', d => stderr += d.toString());

    proc.on('close', (code) => {
      if (code === 0) {
        console.log('Test audio generated:', TEST_FILE);
        resolve();
      } else {
        console.error('FFmpeg generation failed:', stderr);
        reject(new Error('FFmpeg failed'));
      }
    });
  });
}

async function detectSilence(filePath: string): Promise<Array<{ start: number, end: number }>> {
  console.log('Detecting silence...');
  return new Promise((resolve, reject) => {
    const silences: Array<{ start: number, end: number }> = [];
    let silenceStart: number | null = null;

    ffmpeg(filePath)
      .audioFilters(`silencedetect=noise=${SILENCE_THRESHOLD}:d=${MIN_SILENCE_DURATION}`)
      .format('null') // We only need the stderr output
      .output('-') // discard output
      .on('stderr', (line: string) => {
        // Parse lines like:
        // [silencedetect @ 0x...] silence_start: 5.023
        // [silencedetect @ 0x...] silence_end: 10.045 | silence_duration: 5.022

        const startMatch = line.match(/silence_start: (\d+(\.\d+)?)/);
        if (startMatch) {
          silenceStart = parseFloat(startMatch[1]);
        }

        const endMatch = line.match(/silence_end: (\d+(\.\d+)?)/);
        if (endMatch && silenceStart !== null) {
          const silenceEnd = parseFloat(endMatch[1]);
          silences.push({ start: silenceStart, end: silenceEnd });
          silenceStart = null;
        }
      })
      .on('end', () => {
        console.log('Detected silences:', silences);
        resolve(silences);
      })
      .on('error', (err) => {
        console.error('Error detecting silence:', err);
        reject(err);
      })
      .run();
  });
}

async function getDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

async function removeSilence(filePath: string, silences: Array<{ start: number, end: number }>) {
  console.log('Removing silence...');
  const duration = await getDuration(filePath);

  // Calculate active segments (invert silences)
  const activeSegments: Array<{ start: number, end: number }> = [];
  let currentPos = 0;

  for (const silence of silences) {
    if (silence.start > currentPos) {
      activeSegments.push({ start: currentPos, end: silence.start });
    }
    currentPos = silence.end;
  }

  if (currentPos < duration) {
    activeSegments.push({ start: currentPos, end: duration });
  }

  console.log('Active segments to keep:', activeSegments);

  // Extract segments and create concat list
  // Note: For MP3, simple concatenation might have glitches at boundaries.
  // Using stream copy for speed, but re-encoding is safer for seamless audio.
  // Here we re-encode to ensure clean cuts.

  const segmentFiles: string[] = [];

  for (let i = 0; i < activeSegments.length; i++) {
    const seg = activeSegments[i];
    const segFile = `segment_${i}.mp3`;
    segmentFiles.push(segFile);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(filePath)
        .setStartTime(seg.start)
        .setDuration(seg.end - seg.start)
        .output(segFile)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  // Concatenate segments
  // Create file list
  const listContent = segmentFiles.map(f => `file '${path.resolve(f)}'`).join('\n');
  fs.writeFileSync(CONCAT_LIST, listContent);

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(CONCAT_LIST)
      .inputOptions(['-f concat', '-safe 0'])
      .output(OUTPUT_FILE)
      .on('end', () => {
        console.log('Silence removed! Output saved to:', OUTPUT_FILE);
        // Cleanup
        segmentFiles.forEach(f => fs.unlinkSync(f));
        fs.unlinkSync(CONCAT_LIST);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

async function main() {
  try {
    await generateTestAudio();
    const silences = await detectSilence(TEST_FILE);

    if (silences.length > 0) {
        await removeSilence(TEST_FILE, silences);
    } else {
        console.log('No silence detected.');
    }

    // Check final duration
    if (fs.existsSync(OUTPUT_FILE)) {
        const finalDuration = await getDuration(OUTPUT_FILE);
        console.log(`Original duration: ~15s`);
        console.log(`Final duration: ${finalDuration}s`);
    }

    // Cleanup input
    if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);

  } catch (err) {
    console.error('POC failed:', err);
  }
}

main();
