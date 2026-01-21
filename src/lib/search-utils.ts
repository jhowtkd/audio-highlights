interface Segment {
    id: string;
    start: number;
    end: number;
    text: string;
}

const COMMON_STOP_WORDS = new Set([
  'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
  'his', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will',
  'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
  'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can',
  'like', 'time', 'no', 'just', 'know', 'take', 'people', 'into', 'year',
  'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
  'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
  'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most',
  'us', 'is', 'are', 'was', 'were', 'be', 'been', 'being'
]);

/**
 * Escapes special characters for use in regular expressions.
 */
export function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Calculates a local relevance score for a list of segments based on query keyword overlap.
 * This is used to pre-filter chunks before sending them to the semantic search API.
 */
export function calculateLocalRelevance(segments: Segment[], query: string): number {
    const text = segments.map(s => s.text).join(' ').toLowerCase();

    // Split, filter small words, and filter stop words
    const queryTerms = query.toLowerCase()
        .split(/\s+/)
        .filter(t => t.length > 2 && !COMMON_STOP_WORDS.has(t));

    if (queryTerms.length === 0) return 0;

    let score = 0;
    queryTerms.forEach(term => {
        // Use word boundaries for more accurate matching
        const regex = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'g');
        const matches = (text.match(regex) || []).length;
        score += matches;
    });

    return score;
}
