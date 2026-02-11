
import { describe, it, expect } from 'vitest';
import { getExtension, needsConversion } from './audio-converter';

describe('getExtension', () => {
    it('should return valid extensions', () => {
        expect(getExtension('file.mp3')).toBe('.mp3');
        expect(getExtension('file.WAV')).toBe('.WAV');
        expect(getExtension('file.123')).toBe('.123');
        expect(getExtension('path/to/file.ogg')).toBe('.ogg');
    });

    it('should return empty string for files without extension or invalid format', () => {
        expect(getExtension('file')).toBe('');
        expect(getExtension('file.')).toBe('');
    });

    it('should reject invalid extensions (Security)', () => {
        // Path traversal attempts in extension
        expect(getExtension('file.mp3/../../evil')).toBe('');
        expect(getExtension('file./mp3')).toBe('');

        // Weird chars
        expect(getExtension('file.mp3;rm -rf /')).toBe('');
        expect(getExtension('file.mp3 ')).toBe(''); // Space not allowed
        expect(getExtension('file. mp3')).toBe(''); // Space
        expect(getExtension('file.-mp3')).toBe(''); // Dash not allowed in extension start
        expect(getExtension('file._mp3')).toBe(''); // Underscore not allowed in extension start
    });

    it('should handle multiple dots correctly', () => {
        expect(getExtension('file.tar.gz')).toBe('.gz');
        expect(getExtension('archive.ver1.2.zip')).toBe('.zip');
        // Double dot .. is valid in filename part, but getExtension takes from LAST dot
        expect(getExtension('file..mp3')).toBe('.mp3');
    });
});

describe('needsConversion', () => {
    it('should identify files needing conversion', () => {
        expect(needsConversion('file.m4a')).toBe(true);
        expect(needsConversion('file.aac')).toBe(true);
        expect(needsConversion('FILE.M4A')).toBe(true); // Case insensitive
    });

    it('should identify files NOT needing conversion', () => {
        expect(needsConversion('file.mp3')).toBe(false);
        expect(needsConversion('file.wav')).toBe(false);
        expect(needsConversion('file.txt')).toBe(false);
    });

    it('should handle invalid extensions securely', () => {
        // Since getExtension returns '' for invalid, needsConversion should return false
        expect(needsConversion('file.m4a/../../evil')).toBe(false);
    });
});
