'use client';

/**
 * Simple client-side cache for transcriptions
 * Uses file hash to detect duplicate uploads
 */

const CACHE_PREFIX = 'transcription_cache:';
const CACHE_EXPIRY_DAYS = 7;

interface CachedTranscription {
    transcription: unknown;
    timestamp: number;
    fileName: string;
    fileSize: number;
}

/**
 * Generate a simple hash from file content
 * Uses first and last 1MB + file size for performance
 */
export async function getFileHash(file: File): Promise<string> {
    const SAMPLE_SIZE = 1024 * 1024; // 1MB

    // Read first chunk
    const firstChunk = file.slice(0, SAMPLE_SIZE);
    const firstBuffer = await firstChunk.arrayBuffer();
    const firstView = new Uint8Array(firstBuffer);

    // Read last chunk
    const lastStart = Math.max(0, file.size - SAMPLE_SIZE);
    const lastChunk = file.slice(lastStart);
    const lastBuffer = await lastChunk.arrayBuffer();
    const lastView = new Uint8Array(lastBuffer);

    // Simple hash combining file size and sample data
    let hash = file.size;
    for (let i = 0; i < firstView.length; i += 1000) {
        hash = ((hash << 5) - hash + firstView[i]) | 0;
    }
    for (let i = 0; i < lastView.length; i += 1000) {
        hash = ((hash << 5) - hash + lastView[i]) | 0;
    }

    return `${file.size}_${Math.abs(hash).toString(36)}`;
}

/**
 * Get cached transcription if exists and not expired
 */
export function getCachedTranscription(cacheKey: string): unknown | null {
    if (typeof window === 'undefined') return null;

    try {
        const cached = localStorage.getItem(CACHE_PREFIX + cacheKey);
        if (!cached) return null;

        const data: CachedTranscription = JSON.parse(cached);

        // Check expiry
        const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        if (Date.now() - data.timestamp > expiryMs) {
            localStorage.removeItem(CACHE_PREFIX + cacheKey);
            console.log('[Cache] Expired transcription removed:', cacheKey);
            return null;
        }

        console.log('[Cache] Hit! Returning cached transcription for:', data.fileName);
        return data.transcription;
    } catch (error) {
        console.error('[Cache] Error reading cache:', error);
        return null;
    }
}

/**
 * Remove specific transcription from cache
 */
export function removeCachedTranscription(cacheKey: string): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(CACHE_PREFIX + cacheKey);
        console.log('[Cache] Removed transcription for:', cacheKey);
    } catch (error) {
        console.error('[Cache] Error removing from cache:', error);
    }
}

/**
 * Save transcription to cache
 */
export function setCachedTranscription(
    cacheKey: string,
    transcription: unknown,
    fileName: string,
    fileSize: number
): void {
    if (typeof window === 'undefined') return;

    try {
        const data: CachedTranscription = {
            transcription,
            timestamp: Date.now(),
            fileName,
            fileSize,
        };

        localStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(data));
        console.log('[Cache] Saved transcription for:', fileName);
    } catch (error) {
        // localStorage might be full, try to clean old entries
        console.warn('[Cache] Error saving to cache, cleaning old entries:', error);
        cleanOldCacheEntries();
    }
}

/**
 * Clean old cache entries when storage is full
 */
function cleanOldCacheEntries(): void {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
            try {
                const rawData = localStorage.getItem(key) || '{}';
                const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

                // Optimization: Avoid full JSON.parse for large transcriptions
                const match = rawData.match(/"timestamp":\s*(\d+)/);
                let timestamp = 0;

                if (match && match[1]) {
                    timestamp = parseInt(match[1], 10);
                } else {
                    const data = JSON.parse(rawData);
                    timestamp = data.timestamp || 0;
                }

                if (Date.now() - timestamp > expiryMs / 2) {
                    keysToRemove.push(key);
                }
            } catch {
                keysToRemove.push(key);
            }
        }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('[Cache] Cleaned', keysToRemove.length, 'old entries');
}

/**
 * Clear all transcription cache
 */
export function clearTranscriptionCache(): void {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('[Cache] Cleared', keysToRemove.length, 'cached transcriptions');
}
