import { describe, it, expect } from 'vitest';
import { getExtension, needsConversion } from './audio-converter';

describe('audio-converter', () => {
  describe('getExtension', () => {
    it('should return extension for valid filenames', () => {
      expect(getExtension('file.mp3')).toBe('.mp3');
      expect(getExtension('test.wav')).toBe('.wav');
      expect(getExtension('UPPER.MP3')).toBe('.MP3');
      expect(getExtension('file.with.dots.ogg')).toBe('.ogg');
    });

    it('should return empty string for files without extension', () => {
      expect(getExtension('file')).toBe('');
      expect(getExtension('readme')).toBe('');
    });

    it('should sanitize unsafe extensions', () => {
      // Alphanumeric extensions are allowed
      expect(getExtension('script.sh')).toBe('.sh');
      expect(getExtension('malicious.js')).toBe('.js');

      // Extensions with special characters should be sanitized (returned as empty)
      expect(getExtension('file.js;rm -rf /')).toBe('');
      expect(getExtension('file.mp3|whoami')).toBe('');
      expect(getExtension('file.wav&echo')).toBe('');
      expect(getExtension('file.mp3$(id)')).toBe('');
      expect(getExtension('file.mp3`id`')).toBe('');
      expect(getExtension('file..mp3')).toBe('.mp3');
    });
  });

  describe('needsConversion', () => {
    it('should return true for formats needing conversion', () => {
      expect(needsConversion('audio.m4a')).toBe(true);
      expect(needsConversion('audio.aac')).toBe(true);
    });

    it('should return false for supported formats', () => {
      expect(needsConversion('audio.mp3')).toBe(false);
      expect(needsConversion('audio.wav')).toBe(false);
    });
  });
});
