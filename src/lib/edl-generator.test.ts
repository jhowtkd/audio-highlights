import { describe, it, expect } from 'vitest';
import { generateEDL } from './edl-generator';
import type { DecupageSegment } from '@/types/decupagem';

describe('edl-generator', () => {
    describe('generateCSV', () => {
        it('should generate a simple CSV', () => {
            const segments: DecupageSegment[] = [
                {
                    id: '1',
                    startTime: 0,
                    endTime: 10,
                    text: 'Hello world',
                    problemType: 'silence',
                    suggestion: 'cut',
                    reason: 'Too quiet'
                }
            ];

            const csv = generateEDL(segments, 'csv', { title: 'Test' });
            expect(csv).toContain('0.000,10.000,10.000,"Hello world","silence","cut","Too quiet"');
        });

        it('should sanitize dangerous fields to prevent CSV formula injection', () => {
            const segments: DecupageSegment[] = [
                {
                    id: '1',
                    startTime: 0,
                    endTime: 10,
                    text: '=CMD("calc.exe")',
                    problemType: '+1+1',
                    suggestion: '-cmd',
                    reason: '@sum(1,1)'
                }
            ];

            const csv = generateEDL(segments, 'csv', { title: 'Test' });
            expect(csv).toContain('0.000,10.000,10.000,"\'=CMD(""calc.exe"")","\'+1+1","\'-cmd","\'@sum(1,1)"');
        });
    });
});
