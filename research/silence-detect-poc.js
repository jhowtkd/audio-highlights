const { execSync, spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(process.cwd(), 'research');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}
const outputFile = path.join(outputDir, 'test_audio.mp3');

console.log('Using ffmpeg from:', ffmpegPath);

// 1. Create test file (2s tone, 2s silence, 2s tone)
// Using complex filter: sine -> concat
const complexFilter = 'sine=frequency=440:duration=2[a];anullsrc=r=44100:cl=mono:duration=2[b];sine=frequency=880:duration=2[c];[a][b][c]concat=n=3:v=0:a=1[out]';

// Construct command manually
// ffmpeg -f lavfi -i anullsrc -filter_complex ... -map [out] output.mp3
// Note: -i anullsrc is needed as a dummy input for some filter chains, or just use -f lavfi -i "complex_filter_string" if possible?
// Better: just use -filter_complex with null input?
// ffmpeg -f lavfi -i "sine=frequency=440:duration=2" ... no that's one input.

// Correct way with lavfi inputs:
// ffmpeg -y -f lavfi -i "sine=f=440:d=2" -f lavfi -i "anullsrc=r=44100:cl=mono:d=2" -f lavfi -i "sine=f=880:d=2" -filter_complex "[0:a][1:a][2:a]concat=n=3:v=0:a=1" output.mp3

const cmd = `${ffmpegPath} -y -f lavfi -i "sine=f=440:d=2" -f lavfi -i "anullsrc=r=44100:cl=mono:d=2" -f lavfi -i "sine=f=880:d=2" -filter_complex "[0:a][1:a][2:a]concat=n=3:v=0:a=1" "${outputFile}"`;

console.log('Generating test audio...');
try {
    execSync(cmd, { stdio: 'inherit' });
    console.log('Test audio created successfully.');
    detectSilence(outputFile);
} catch (e) {
    console.error('Error creating audio:', e);
}

function detectSilence(filePath) {
  console.log('Detecting silence...');
  const silenceThreshold = '-30dB';
  const minSilenceDuration = '0.5';

  const silenceEvents = [];

  // ffmpeg -i input.mp3 -af silencedetect=noise=-30dB:d=0.5 -f null -
  const detectCmd = [
      '-i', filePath,
      '-af', `silencedetect=noise=${silenceThreshold}:d=${minSilenceDuration}`,
      '-f', 'null',
      '-'
  ];

  console.log('Running detection:', ffmpegPath, detectCmd.join(' '));

  const ffmpegProcess = spawn(ffmpegPath, detectCmd);

  let stderrData = '';

  ffmpegProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        // console.log('STDERR:', line); // Debug if needed
        if (line.includes('silencedetect')) {
            const startMatch = line.match(/silence_start: ([\d.]+)/);
            const endMatch = line.match(/silence_end: ([\d.]+)/);

            if (startMatch) {
                console.log('Found Start:', startMatch[1]);
                silenceEvents.push({ type: 'start', time: parseFloat(startMatch[1]) });
            }
            if (endMatch) {
                console.log('Found End:', endMatch[1]);
                silenceEvents.push({ type: 'end', time: parseFloat(endMatch[1]) });
            }
        }
      });
  });

  ffmpegProcess.on('close', (code) => {
      console.log(`Silence detection process exited with code ${code}`);

      // Process events into intervals
      const silenceIntervals = [];

      // Sort by time
      silenceEvents.sort((a, b) => a.time - b.time);

      let currentStart = null;

      silenceEvents.forEach(event => {
          if (event.type === 'start') {
              currentStart = event.time;
          } else if (event.type === 'end') {
              if (currentStart !== null) {
                  silenceIntervals.push({ start: currentStart, end: event.time, duration: event.time - currentStart });
                  currentStart = null;
              }
          }
      });

      console.log('Detected Silence Intervals:', silenceIntervals);

      const knownDuration = 6.0;
      const activeSegments = [];
      let lastEnd = 0;

      silenceIntervals.forEach(interval => {
          if (interval.start > lastEnd + 0.1) { // 0.1s tolerance
              activeSegments.push({ start: lastEnd, end: interval.start });
          }
          lastEnd = interval.end;
      });

      if (lastEnd < knownDuration - 0.1) {
          activeSegments.push({ start: lastEnd, end: knownDuration });
      }

      console.log('Active Audio Segments (to keep):', activeSegments);

      // Verify result
      // Expect silence from ~2.0 to ~4.0
      const foundSilence = silenceIntervals.find(s => Math.abs(s.start - 2.0) < 0.1 && Math.abs(s.duration - 2.0) < 0.1);

      if (foundSilence) {
          console.log('SUCCESS: Correctly detected silence interval [2.0 - 4.0].');
      } else {
          console.error('FAILURE: Did not detect expected silence interval.');
      }

      // Cleanup
       try {
           if (fs.existsSync(filePath)) {
               fs.unlinkSync(filePath);
               console.log('Cleanup: Deleted test file.');
           }
       } catch(e) { console.error('Cleanup failed', e); }
  });
}
