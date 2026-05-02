const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const inputFile = path.join(__dirname, 'input.mp4');
const subtitleFile = path.join(__dirname, 'subtitles.vtt');
const outputFile = path.join(__dirname, 'output.mp4');

console.log('Starting subtitle burn-in...');

ffmpeg(inputFile)
  .outputOptions([
    `-vf subtitles=${subtitleFile}`,
    '-c:v libx264',
    '-c:a copy'
  ])
  .on('end', () => {
    console.log('Finished processing');
  })
  .on('error', (err) => {
    console.error('Error:', err.message);
  })
  .save(outputFile);
