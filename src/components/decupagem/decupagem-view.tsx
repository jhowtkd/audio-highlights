import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Download, Play, RefreshCw, Scissors } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CutSuggestionCard } from './cut-suggestion-card';
import type { DecupageResult } from '@/types/decupagem';
import type { TranscriptionSegment } from '@/types';
import { toast } from 'sonner';

interface DecupagemViewProps {
    segments: TranscriptionSegment[];
    projectId: string; // Passed for potential future persistence
}

export const DecupagemView = memo(function DecupagemView({ segments, projectId }: DecupagemViewProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<DecupageResult | null>(null);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/decupagem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    segments,
                    config: {
                        detectFillers: true,
                        silenceThreshold: 2000
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Não foi possível concluir a análise');
            }

            const data = await response.json();
            if (data.success) {
                setResult(data.data);
                toast.success('Análise de decupagem concluída!');
            }
        } catch (error) {
            toast.error('Não foi possível analisar o áudio. Tente novamente em alguns instantes.');
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAction = (id: string, action: 'keep' | 'cut' | 'review') => {
        if (!result) return;

        const updatedSegments = result.segments.map(seg =>
            seg.id === id ? { ...seg, status: action } : seg
        );

        // Recalculate stats
        const cutDuration = updatedSegments
            .filter(s => s.status === 'cut') // Only count confirmed cuts
            .reduce((acc, s) => acc + (s.endTime - s.startTime), 0);

        setResult({
            ...result,
            segments: updatedSegments,
            timeSaved: cutDuration,
            cleanDuration: result.originalDuration - cutDuration
        });
    };

    const handleExport = async (format: 'cmx3600' | 'csv') => {
        if (!result) return;

        try {
            const response = await fetch('/api/decupagem/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    segments: result.segments,
                    format,
                    title: `Decupagem Project ${projectId.substring(0, 8)}`
                })
            });

            if (!response.ok) throw new Error('Não foi possível iniciar a exportação');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `decupagem.${format === 'csv' ? 'csv' : 'edl'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`Exportado como ${format.toUpperCase()}`);
        } catch {
            toast.error('Não foi possível exportar o arquivo. Tente novamente.');
        }
    };

    if (!result && !isAnalyzing) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="bg-primary/10 p-4 rounded-full">
                    <Scissors className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Assistente de Decupagem</h2>
                <p className="text-muted-foreground max-w-md">
                    Identifique automaticamente silêncios, gagueiras, vícios de linguagem e desvios narrativos para agilizar sua edição.
                </p>
                <Button size="lg" onClick={handleAnalyze}>
                    <Play className="w-4 h-4 mr-2" /> Iniciar Análise
                </Button>
            </div>
        );
    }

    if (isAnalyzing) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                <h2 className="text-xl font-semibold">Analisando áudio...</h2>
                <p className="text-muted-foreground">Isso pode levar alguns instantes.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm rounded-lg border">
            {/* Header Stats */}
            <div className="p-4 border-b flex justify-between items-center bg-card/50">
                <div>
                    <h3 className="font-semibold text-lg">Sugestões de Corte</h3>
                    <p className="text-xs text-muted-foreground">
                        Original: {Math.round(result!.originalDuration)}s → Limpo: {Math.round(result!.cleanDuration)}s
                        <span className="ml-2 text-green-500 font-bold">(-{Math.round(result!.timeSaved)}s)</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                        <Download className="w-4 h-4 mr-2" /> CSV
                    </Button>
                    <Button size="sm" onClick={() => handleExport('cmx3600')}>
                        <Download className="w-4 h-4 mr-2" /> EDL
                    </Button>
                </div>
            </div>

            {/* Narrative Summary */}
            {result?.narrativeSummary && (
                <div className="p-3 bg-muted/30 border-b">
                    <p className="text-sm italic text-muted-foreground">
                        Note: {result.narrativeSummary}
                    </p>
                </div>
            )}

            {/* List */}
            <ScrollArea className="flex-1 p-4">
                {result?.segments.length === 0 ? (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Nenhum problema detectado!</AlertTitle>
                        <AlertDescription>
                            Seu áudio parece estar limpo de silêncios longos ou erros óbvios.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-4">
                        {result?.segments.map((segment) => (
                            <CutSuggestionCard
                                key={segment.id}
                                segment={segment}
                                onAction={handleAction}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
});
