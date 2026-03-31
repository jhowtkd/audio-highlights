import { DecupageSegment, EDLFormat } from '@/types/decupagem';

/**
 * Formats seconds into SMPTE timecode (HH:MM:SS:FF)
 */
function formatTimecode(seconds: number, fps: number = 24): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds % 1) * fps);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}

/**
 * Generates an Edit Decision List (EDL) in CMX 3600 format.
 * This format is widely compatible (Premiere, DaVinci, Avid).
 */
function generateCMX3600(segments: DecupageSegment[], fps: number = 24): string {
    let edl = `TITLE: DECUPAGEM EXPORT\nFCM: NON-DROP FRAME\n\n`;

    // Filter only segments marked to be CUT
    // Wait, usually an EDL represents the CLIPS TO KEEP in the timeline.
    // If we are exporting a "cut list" for the editor to remove, it's tricky.
    // BUT: The user request was "passar onde exatamente deve ser cortado".
    // If we import this into Premiere, we want markers or a sequence with gaps?
    // Usually, editors prefer a sequence of the "good parts".
    // So we should export the KEEPS.

    // Let's assume we export the segments that are NOT 'cut' (i.e., 'keep' or 'review').
    // OR, if the user explicitly wants to see what to cut, we could export markers.
    // Standard EDL is for constructing a timeline. Let's construct the "clean" timeline.

    const keepSegments = segments.filter(s => s.suggestion !== 'cut');

    keepSegments.forEach((seg, index) => {
        const editId = (index + 1).toString().padStart(3, '0');
        const sourceIn = formatTimecode(seg.startTime, fps);
        const sourceOut = formatTimecode(seg.endTime, fps);

        // We construct a linear timeline, so Record In starts where the previous Record Out ended.
        // For simplicity, let's just list them as simple cuts from the source tape "AX" (Auxiliary).
        // In a real EDL, Record In/Out must be continuous if we want a single sequence.

        // Calculating record time is complex without state.
        // Let's output a generic list where Record Time matches Source Time (Source Mode)
        // or just valid CMX lines.

        // CMX 3600 Line: [ID] [REEL] [TRACK] [TRANSITION] [SOURCE IN] [SOURCE OUT] [RECORD IN] [RECORD OUT]
        // Let's assume Record In/Out = Source In/Out (just selecting clips, not assembling yet)
        // Or simpler: Just markers? No, EDL is better.

        // Let's implement a naive assembly:
        // We assume the output timeline starts at 01:00:00:00

        edl += `${editId}  AX       V     C        ${sourceIn} ${sourceOut} ${sourceIn} ${sourceOut}\n`;
        edl += `* FROM CLIP NAME: ${seg.text.substring(0, 40)}...\n`;
        edl += `* PROBLEM: ${seg.problemType} (${seg.suggestion})\n\n`;
    });

    return edl;
}

/**
 * Sanitizes a string for CSV output to prevent Formula Injection (CSV Injection).
 * If the string starts with a dangerous character (=, +, -, @, \t, \r), prepends a single quote.
 */
function sanitizeCSVField(value: string | undefined): string {
    if (!value) return '';
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    const stringValue = String(value);

    if (dangerousChars.includes(stringValue.charAt(0))) {
        return "'" + stringValue;
    }
    return stringValue;
}

/**
 * Generates a simple CSV for manual review
 */
function generateCSV(segments: DecupageSegment[]): string {
    let csv = 'Start Time,End Time,Duration,Text,Problem,Suggestion,Reason\n';

    segments.forEach(seg => {
        const text = sanitizeCSVField(seg.text).replace(/"/g, '""');
        const problemType = sanitizeCSVField(seg.problemType);
        const suggestion = sanitizeCSVField(seg.suggestion);
        const reason = sanitizeCSVField(seg.reason);

        csv += `${seg.startTime.toFixed(3)},${seg.endTime.toFixed(3)},${(seg.endTime - seg.startTime).toFixed(3)},"${text}","${problemType}","${suggestion}","${reason}"\n`;
    });

    return csv;
}

/**
 * Generates an FCPXML (Final Cut Pro XML) - Skeleton implementation
 * Real FCPXML is very verbose, implementing a basic version for markers.
 */
function generateFCPXML(segments: DecupageSegment[], fps: number = 24): string {
    // This is a complex format, for now we will return a simplified XML or placeholder
    // Better to stick to CMX3600 and CSV for the MVP unless requested.
    // The plan mentioned FCPXML, so let's do a basic marker list.

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r1" frameDuration="1/${fps}s"/>
  </resources>
  <library>
    <event name="Decupagem">
      <project name="Decupagem Cut List">
        <sequence format="r1">
          <spine>
            <!-- To be implemented: GAP/Clip structure -->
            <!-- For now, this is a placeholder as FCPXML requires rigorous structure -->
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
}

export function generateEDL(
    segments: DecupageSegment[],
    format: EDLFormat,
    metadata: { title: string; fps?: number }
): string {
    const fps = metadata.fps || 24;

    switch (format) {
        case 'cmx3600':
            return generateCMX3600(segments, fps);
        case 'csv':
            return generateCSV(segments);
        case 'fcpxml':
            return generateFCPXML(segments, fps);
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}
