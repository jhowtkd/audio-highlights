'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Search, X, Loader2, Sparkles } from 'lucide-react';
import { formatTime } from '@/lib/format-utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TranscriptionSegment } from '@/types';

interface SearchResult {
  segmentId: string;
  text: string;
  startTime: number;
  endTime: number;
  relevanceScore: number;
  matchReason: string;
}

interface TranscriptViewerProps {
  segments: TranscriptionSegment[];
  currentTime: number;
  onSegmentClick: (startTime: number) => void;
  className?: string;
}

export function TranscriptViewer({
  segments,
  currentTime,
  onSegmentClick,
  className,
}: TranscriptViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Encontra o segmento ativo baseado no tempo atual
  const activeSegmentIndex = segments.findIndex(
    (segment) => currentTime >= segment.start && currentTime < segment.end
  );

  // Get IDs of matching segments for highlighting
  const matchingSegmentIds = new Set(searchResults.map(r => r.segmentId));

  // Auto-scroll para o segmento ativo
  useEffect(() => {
    if (activeSegmentRef.current && containerRef.current && !showSearchResults) {
      const container = containerRef.current;
      const activeElement = activeSegmentRef.current;

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();

      const isVisible =
        activeRect.top >= containerRect.top &&
        activeRect.bottom <= containerRect.bottom;

      if (!isVisible) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeSegmentIndex, showSearchResults]);

  // Semantic search handler
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || segments.length === 0) return;

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          segments: segments.map(s => ({
            id: s.id,
            start: s.start,
            end: s.end,
            text: s.text,
          })),
          maxResults: 10,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, segments]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      clearSearch();
    }
  }, [handleSearch, clearSearch]);

  if (segments.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 text-slate-500', className)}>
        Nenhuma transcrição disponível
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Busca semântica... (ex: 'fale sobre dinheiro')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          size="sm"
          className="shrink-0"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-1" />
              Buscar
            </>
          )}
        </Button>
      </div>

      {/* Search Results Banner */}
      {showSearchResults && (
        <div className="flex items-center justify-between mb-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <span className="text-sm text-blue-700 dark:text-blue-400">
            {isSearching ? (
              'Buscando...'
            ) : searchResults.length > 0 ? (
              <>
                <span className="font-medium">{searchResults.length}</span> resultados para &ldquo;{searchQuery}&rdquo;
              </>
            ) : (
              <>Nenhum resultado para &ldquo;{searchQuery}&rdquo;</>
            )}
          </span>
          <Button variant="ghost" size="sm" onClick={clearSearch}>
            Limpar
          </Button>
        </div>
      )}

      {/* Transcript */}
      <div
        ref={containerRef}
        className={cn(
          'flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700',
          className
        )}
      >
        {/* If showing search results, display them first */}
        {showSearchResults && searchResults.length > 0 ? (
          <div className="space-y-2">
            {searchResults.map((result) => (
              <div
                key={result.segmentId}
                onClick={() => {
                  onSegmentClick(result.startTime);
                  clearSearch();
                }}
                className="p-3 rounded-lg cursor-pointer transition-all duration-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 hover:border-blue-400"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono px-2 py-1 rounded shrink-0 bg-blue-500 text-white">
                    {formatTime(result.startTime)}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-100">
                      {result.text}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {result.matchReason} • Score: {result.relevanceScore}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Regular transcript view
          segments.map((segment, index) => {
            const isActive = index === activeSegmentIndex;
            const isMatch = matchingSegmentIds.has(segment.id);

            return (
              <div
                key={segment.id}
                ref={isActive ? activeSegmentRef : null}
                onClick={() => onSegmentClick(segment.start)}
                className={cn(
                  'p-3 rounded-lg cursor-pointer transition-all duration-200',
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500'
                    : isMatch
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 border-transparent'
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'text-xs font-mono px-2 py-1 rounded shrink-0',
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {formatTime(segment.start)}
                  </span>

                  <p
                    className={cn(
                      'text-sm leading-relaxed',
                      isActive
                        ? 'text-slate-900 dark:text-slate-100 font-medium'
                        : 'text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {segment.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
