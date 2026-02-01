'use client';

import { memo } from 'react';
import { FileText, Tag, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EpisodeAnalysis } from '@/types';

interface EpisodeSummaryProps {
    analysis: EpisodeAnalysis;
    className?: string;
}

export const EpisodeSummary = memo(function EpisodeSummary({ analysis, className }: EpisodeSummaryProps) {
    if (!analysis.summary && analysis.keyTopics.length === 0) {
        return null;
    }

    return (
        <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50 ${className}`}>
            <CardContent className="p-5">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg shrink-0">
                        <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="flex-1 space-y-3">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Resumo do Episódio
                            </h3>
                            {analysis.summary && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {analysis.summary}
                                </p>
                            )}
                        </div>

                        {analysis.keyTopics.length > 0 && (
                            <div>
                                <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                                    <Tag className="h-3 w-3" />
                                    Tópicos Principais
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {analysis.keyTopics.map((topic, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="text-xs bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
                                        >
                                            {topic}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    {analysis.totalHighlightsGenerated}
                                </span>{' '}
                                highlights gerados
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
