import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Search, Clock, Scissors } from 'lucide-react';
import type { DecupageSegment, DecupageProblemType } from '@/types/decupagem';
import { cn } from '@/lib/utils';

interface CutSuggestionCardProps {
    segment: DecupageSegment;
    onAction: (id: string, action: 'keep' | 'cut' | 'review') => void;
}

const PROBLEM_CONFIG: Record<DecupageProblemType, { label: string; color: string }> = {
    silence: { label: 'Silêncio', color: 'bg-gray-500' },
    filler_words: { label: 'Vício de Ling.', color: 'bg-yellow-500' },
    stutter: { label: 'Gagueira', color: 'bg-orange-500' },
    wrong_word: { label: 'Palavra Errada', color: 'bg-red-400' },
    false_start: { label: 'Início Falso', color: 'bg-purple-500' },
    off_topic: { label: 'Fora do Tema', color: 'bg-blue-500' },
    contradiction: { label: 'Contradição', color: 'bg-red-600' },
    repetition: { label: 'Repetição', color: 'bg-indigo-500' },
};

function formatDuration(start: number, end: number) {
    return (end - start).toFixed(1) + 's';
}

function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function CutSuggestionCard({ segment, onAction }: CutSuggestionCardProps) {
    const config = PROBLEM_CONFIG[segment.problemType];

    return (
        <Card className={cn("mb-3 border-l-4 transition-all", {
            "border-l-red-500 opacity-60": segment.status === 'cut',
            "border-l-green-500": segment.status === 'keep',
            "border-l-yellow-400": segment.status === 'review' || segment.status === 'pending',
        })}>
            <CardContent className="p-4 pb-2">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2 items-center">
                        <Badge className={config.color}>{config.label}</Badge>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(segment.startTime)} - {formatTime(segment.endTime)} ({formatDuration(segment.startTime, segment.endTime)})
                        </div>
                    </div>
                    {segment.status !== 'pending' && (
                        <Badge variant="outline" className="capitalize text-xs">
                            {segment.status === 'keep' ? 'Manter' : segment.status === 'cut' ? 'Cortar' : 'Revisar'}
                        </Badge>
                    )}
                </div>

                <p className="text-sm font-medium italic text-muted-foreground mb-2">
                    &quot;{segment.text}&quot;
                </p>

                <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Motivo:</span> {segment.reason}
                </p>
            </CardContent>

            <CardFooter className="p-2 bg-muted/20 flex justify-end gap-2">
                <Button
                    size="sm"
                    variant={segment.status === 'keep' ? "default" : "ghost"}
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => onAction(segment.id, 'keep')}
                    title="Manter (Ignorar corte)"
                >
                    <Check className="w-4 h-4 text-green-600" />
                </Button>
                <Button
                    size="sm"
                    variant={segment.status === 'cut' ? "default" : "ghost"}
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => onAction(segment.id, 'cut')}
                    title="Confirmar Corte"
                >
                    <Scissors className="w-4 h-4 text-red-600" />
                </Button>
                <Button
                    size="sm"
                    variant={segment.status === 'review' ? "default" : "ghost"}
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => onAction(segment.id, 'review')}
                    title="Marcar para Revisão"
                >
                    <Search className="w-4 h-4 text-yellow-600" />
                </Button>
            </CardFooter>
        </Card>
    );
}
