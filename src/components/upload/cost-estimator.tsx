import { FileText, Calculator, Clock, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { estimateTotalCost } from '@/lib/pricing';
import { formatDuration } from '@/lib/format-utils';

interface CostEstimatorProps {
    file: File;
    duration: number;
    onConfirm: () => void;
    onCancel: () => void;
}

export function CostEstimator({ file, duration, onConfirm, onCancel }: CostEstimatorProps) {
    const { min, max, breakdown } = estimateTotalCost(duration);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);

    // Format currency
    const formatMoney = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(val);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                        <Calculator className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Estimativa de Custos
                    </h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Confira os custos estimados antes de processar seu arquivo.
                </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* File Info */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                    <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1 break-all">
                            {file.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(duration)}
                            </span>
                            <span>•</span>
                            <span>{fileSizeMB} MB</span>
                        </div>
                    </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <span>Transcrição (Whisper)</span>
                            <button
                                type="button"
                                className="group relative cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
                                aria-label="$0.006 por minuto"
                            >
                                <Info className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                                <span
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 whitespace-nowrap pointer-events-none transition-opacity"
                                    aria-hidden="true"
                                >
                                    $0.006 / minuto
                                </span>
                            </button>
                        </span>
                        <span className="font-mono text-slate-900 dark:text-slate-100">
                            {formatMoney(breakdown.whisper)}
                        </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <span>Análise AI (GPT-5 Nano)</span>
                            <button
                                type="button"
                                className="group relative cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
                                aria-label="Estimado base tokens"
                            >
                                <Info className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                                <span
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 whitespace-nowrap pointer-events-none transition-opacity"
                                    aria-hidden="true"
                                >
                                    Estimado base tokens
                                </span>
                            </button>
                        </span>
                        <span className="font-mono text-slate-900 dark:text-slate-100">
                            {formatMoney(breakdown.gptMin)} - {formatMoney(breakdown.gptMax)}
                        </span>
                    </div>

                    <div className="my-2 border-t border-slate-100 dark:border-slate-800"></div>

                    <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                            Total Estimado
                        </span>
                        <span className="text-lg font-bold text-green-600 dark:text-green-400 font-mono">
                            ~{formatMoney((min + max) / 2)}
                        </span>
                    </div>
                    <p className="text-xs text-center text-slate-400 mt-2">
                        * Valores aproximados. O custo final depende do tamanho exato da resposta.
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex gap-3">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={onConfirm}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar e Processar
                </Button>
            </div>
        </div>
    );
}
