'use client';

import { useState } from 'react';
import { Play, Clock, Copy, Download, Star, Film, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTime, formatDuration } from '@/lib/format-utils';
import { cn } from '@/lib/utils';
import type { GeneratedHighlight, EmotionTone, HookType, ContentArchetype } from '@/types';

interface HighlightCardProps {
  highlight: GeneratedHighlight;
  index: number;
  onPlay: (startTime: number) => void;
  onExport: (highlight: GeneratedHighlight, format: 'srt' | 'txt') => void;
  onCopy: (text: string) => void;
  onDownloadVideo?: (highlight: GeneratedHighlight) => void;
  className?: string;
}

// Configuração de emoções com ícones e cores
const EMOTION_CONFIG: Record<EmotionTone, { icon: string; label: string; color: string }> = {
  excited: { icon: '🔥', label: 'Empolgante', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  humorous: { icon: '😂', label: 'Divertido', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  dramatic: { icon: '🎭', label: 'Dramático', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  informative: { icon: '💡', label: 'Informativo', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  controversial: { icon: '⚡', label: 'Polêmico', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  inspirational: { icon: '✨', label: 'Inspirador', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

// Configuração de tipos de Hook (pesquisa viralidade 2025)
const HOOK_TYPE_CONFIG: Record<HookType, { icon: string; label: string; color: string }> = {
  promise: { icon: '🎯', label: 'Promessa', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  fear: { icon: '😰', label: 'Medo/Alerta', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  curiosity: { icon: '🤔', label: 'Curiosidade', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  contrarian: { icon: '🔄', label: 'Contrariano', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  in_media_res: { icon: '🎬', label: 'In Media Res', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

// Configuração de arquétipos de conteúdo
const ARCHETYPE_CONFIG: Record<ContentArchetype, { icon: string; label: string }> = {
  story: { icon: '📖', label: 'História' },
  hot_take: { icon: '🔥', label: 'Hot Take' },
  tutorial: { icon: '📚', label: 'Tutorial' },
  human_moment: { icon: '💫', label: 'Momento Humano' },
  revelation: { icon: '💡', label: 'Revelação' },
};

export function HighlightCard({
  highlight,
  index,
  onPlay,
  onExport,
  onCopy,
  onDownloadVideo,
  className,
}: HighlightCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(highlight.title);

  const scoreColor =
    highlight.relevanceScore >= 90
      ? 'text-green-600 dark:text-green-400'
      : highlight.relevanceScore >= 70
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-slate-600 dark:text-slate-400';

  const emotionConfig = highlight.emotionTone ? EMOTION_CONFIG[highlight.emotionTone] : null;

  return (
    <Card className={cn('border-slate-200 dark:border-slate-800 overflow-hidden', className)}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 shrink-0">
                #{index + 1}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {selectedTitle}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {formatTime(highlight.startTime)} - {formatTime(highlight.endTime)}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>{formatDuration(highlight.duration)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Emotion Badge */}
              {emotionConfig && (
                <Badge className={cn('text-xs font-medium', emotionConfig.color)}>
                  {emotionConfig.icon} {emotionConfig.label}
                </Badge>
              )}

              {/* Score */}
              <div className={cn('flex items-center gap-1', scoreColor)}>
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-bold">{highlight.relevanceScore}</span>
              </div>
            </div>
          </div>

          {/* Viral Factors - Expandido */}
          {highlight.viralFactors && (
            <div className="mt-3 space-y-2">
              {/* Linha 1: Hook Type + Archetype */}
              <div className="flex items-center gap-2 flex-wrap">
                {highlight.viralFactors.hookType && HOOK_TYPE_CONFIG[highlight.viralFactors.hookType] && (
                  <Badge className={cn('text-xs font-medium', HOOK_TYPE_CONFIG[highlight.viralFactors.hookType].color)}>
                    {HOOK_TYPE_CONFIG[highlight.viralFactors.hookType].icon} {HOOK_TYPE_CONFIG[highlight.viralFactors.hookType].label}
                  </Badge>
                )}
                {highlight.viralFactors.contentArchetype && ARCHETYPE_CONFIG[highlight.viralFactors.contentArchetype] && (
                  <Badge variant="outline" className="text-xs font-medium">
                    {ARCHETYPE_CONFIG[highlight.viralFactors.contentArchetype].icon} {ARCHETYPE_CONFIG[highlight.viralFactors.contentArchetype].label}
                  </Badge>
                )}
                {highlight.viralFactors.loopPotential && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                    🔄 Loop
                  </span>
                )}
              </div>

              {/* Linha 2: Métricas visuais */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1" title="Salvabilidade: quão útil/educacional">
                  💾 <span className="font-medium">{highlight.viralFactors.saveability || 0}/10</span>
                </div>
                <div className="flex items-center gap-1" title="Compartilhabilidade: quão emocional">
                  🔗 <span className="font-medium">{highlight.viralFactors.shareability || 0}/10</span>
                </div>
                <div className="flex items-center gap-1" title="Chance de assistir até o final">
                  ▶️ <span className="font-medium">{highlight.viralFactors.completionPotential || highlight.viralFactors.emotionalIntensity}/10</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Hook Analysis */}
          {highlight.hookAnalysis && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-3 border border-green-200/50 dark:border-green-800/50">
              <div className="flex items-center gap-1 mb-1 text-xs font-medium text-green-700 dark:text-green-400">
                🎣 Análise do Hook (primeiros 3 segundos)
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {highlight.hookAnalysis}
              </p>
              {highlight.openingLine && (
                <p className="mt-2 text-sm italic text-slate-600 dark:text-slate-400">
                  &ldquo;{highlight.openingLine}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Summary */}
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {highlight.summary}
          </p>

          {/* Suggested Titles */}
          {highlight.suggestedTitles && highlight.suggestedTitles.length > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showDetails ? 'Ocultar opções' : 'Ver títulos alternativos'}
              </button>
              {showDetails && (
                <div className="space-y-1">
                  {[highlight.title, ...highlight.suggestedTitles].map((title, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedTitle(title)}
                      className={cn(
                        'block w-full text-left text-xs p-2 rounded border transition-all',
                        selectedTitle === title
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      )}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quotable Lines */}
          {highlight.quotableLines && highlight.quotableLines.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg p-3 border border-amber-200/50 dark:border-amber-800/50">
              <div className="flex items-center gap-1 mb-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                <Quote className="h-3 w-3" />
                Frases para Redes Sociais
              </div>
              <div className="space-y-2">
                {highlight.quotableLines.map((quote, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 italic">
                      &ldquo;{quote}&rdquo;
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={() => onCopy(quote)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript Preview */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
            <p className="text-sm text-slate-700 dark:text-slate-300 italic line-clamp-3">
              &ldquo;{highlight.transcript}&rdquo;
            </p>
          </div>

          {/* Tags */}
          {highlight.tags && highlight.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {highlight.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => onPlay(highlight.startTime)}
            className="flex-1 sm:flex-none"
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Play
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onCopy(highlight.transcript)}
            className="flex-1 sm:flex-none"
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copiar
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport(highlight, 'srt')}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            SRT
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport(highlight, 'txt')}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            TXT
          </Button>

          {onDownloadVideo && (
            <Button
              size="sm"
              variant="default"
              className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => onDownloadVideo(highlight)}
            >
              <Film className="h-3.5 w-3.5 mr-1.5" />
              Baixar Clip
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
