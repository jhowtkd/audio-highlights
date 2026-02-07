'use client';

import { useState, memo } from 'react';
import { Sparkles, Clock, Hash, Info, Layers, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDuration } from '@/lib/format-utils';
import type { HighlightConfig } from '@/types';

interface ConfigPanelProps {
  onGenerate: (config: HighlightConfig) => void;
  isGenerating: boolean;
  audioDuration: number;
}

const DEFAULT_CONFIG: HighlightConfig = {
  minDuration: 30,
  maxDuration: 120,
  targetDuration: 60,
  quantity: 5,
  isMix: false,
  mixDuration: 180, // 3 min default for mix
};

export const ConfigPanel = memo(function ConfigPanel({ onGenerate, isGenerating, audioDuration }: ConfigPanelProps) {
  const [config, setConfig] = useState<HighlightConfig>(DEFAULT_CONFIG);

  const handleMinDurationChange = (value: number[]) => {
    const newMin = value[0];
    setConfig((prev) => ({
      ...prev,
      minDuration: newMin,
      // Garante que max e target são maiores que min
      maxDuration: Math.max(prev.maxDuration, newMin),
      targetDuration: Math.max(Math.min(prev.targetDuration, prev.maxDuration), newMin),
    }));
  };

  const handleMaxDurationChange = (value: number[]) => {
    const newMax = value[0];
    setConfig((prev) => ({
      ...prev,
      maxDuration: newMax,
      // Garante que min e target são menores que max
      minDuration: Math.min(prev.minDuration, newMax),
      targetDuration: Math.min(Math.max(prev.targetDuration, prev.minDuration), newMax),
    }));
  };

  const handleTargetDurationChange = (value: number[]) => {
    const newTarget = value[0];
    setConfig((prev) => ({
      ...prev,
      targetDuration: Math.max(prev.minDuration, Math.min(newTarget, prev.maxDuration)),
    }));
  };

  const handleMixDurationChange = (value: number[]) => {
    setConfig((prev) => ({
      ...prev,
      mixDuration: value[0],
    }));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setConfig((prev) => ({
      ...prev,
      quantity: Math.max(1, Math.min(20, value)),
    }));
  };

  const toggleMixMode = () => {
    setConfig((prev) => ({
      ...prev,
      isMix: !prev.isMix,
    }));
  };

  const handleSubmit = () => {
    console.log('🔘 Botão clicado no ConfigPanel', config);
    onGenerate(config);
  };

  // Estima a cobertura baseado na configuração
  const estimatedCoverage = audioDuration > 0
    ? config.isMix
      ? ((config.mixDuration || 180) / audioDuration) * 100
      : ((config.targetDuration * config.quantity) / audioDuration) * 100
    : 0;

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Configurar Highlights
            </CardTitle>
            <CardDescription>
              Customize a duração e estilo dos seus cortes
            </CardDescription>
          </div>
          <Button
            variant={config.isMix ? "default" : "outline"}
            onClick={toggleMixMode}
            className={`gap-2 ${config.isMix ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
          >
            {config.isMix ? <Workflow className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
            {config.isMix ? 'Modo Storytelling (Mix)' : 'Modo Padrão'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">

        {config.isMix ? (
          // CONTROLES DO MODO MIX
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900">
              <h4 className="font-medium text-indigo-900 dark:text-indigo-100 flex items-center gap-2 mb-2">
                <Workflow className="h-4 w-4" />
                O que é o Modo Storytelling?
              </h4>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Neste modo, a IA analisa todo o conteúdo e cria <strong>um único vídeo longo</strong> (Mix)
                que conta uma história coesa conectando os melhores momentos em uma narrativa fluida.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  Duração Total do Mix
                </Label>
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {formatDuration(config.mixDuration || 180)}
                </span>
              </div>
              <Slider
                value={[config.mixDuration || 180]}
                min={60}
                max={600}
                step={15}
                onValueChange={handleMixDurationChange}
                className="py-4"
              />
              <p className="text-xs text-slate-500">
                Tempo total estimado do vídeo
              </p>
            </div>
          </div>
        ) : (
          // CONTROLES DO MODO PADRÃO
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Duração Mínima */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  Duração Mínima
                </Label>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {formatDuration(config.minDuration)}
                </span>
              </div>
              <Slider
                value={[config.minDuration]}
                min={15}
                max={300}
                step={5}
                onValueChange={handleMinDurationChange}
              />
              <p className="text-xs text-slate-500">
                Evita cortes muito curtos que perdem o contexto
              </p>
            </div>

            {/* Duração Média (Target) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  Duração Média
                </Label>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {formatDuration(config.targetDuration)}
                </span>
              </div>
              <Slider
                value={[config.targetDuration]}
                min={config.minDuration}
                max={config.maxDuration}
                step={5}
                onValueChange={handleTargetDurationChange}
              />
              <p className="text-xs text-slate-500">
                A IA buscará manter os cortes próximos deste tempo
              </p>
            </div>

            {/* Duração Máxima */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  Duração Máxima
                </Label>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {formatDuration(config.maxDuration)}
                </span>
              </div>
              <Slider
                value={[config.maxDuration]}
                min={30}
                max={600}
                step={10}
                onValueChange={handleMaxDurationChange}
              />
              <p className="text-xs text-slate-500">
                Impede que os cortes fiquem longos demais
              </p>
            </div>

            {/* Quantidade */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="quantity" className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-slate-500" />
                  Quantidade de Highlights
                </Label>
              </div>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={20}
                value={config.quantity}
                onChange={handleQuantityChange}
                className="w-full"
              />
              <p className="text-xs text-slate-500">
                Número máximo de cortes a serem gerados
              </p>
            </div>
          </div>
        )}

        {/* Resumo da Configuração */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Info className="h-4 w-4" />
            Resumo
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            {config.isMix ? (
              <p>
                Gerar <span className="font-medium text-indigo-600">1 Mix Storytelling</span> de aproximadamente{' '}
                <span className="font-medium">{formatDuration(config.mixDuration || 180)}</span>.
              </p>
            ) : (
              <p>
                <span className="font-medium">{config.quantity}</span> highlights de{' '}
                <span className="font-medium">{formatDuration(config.minDuration)}</span> a{' '}
                <span className="font-medium">{formatDuration(config.maxDuration)}</span>
              </p>
            )}

            {audioDuration > 0 && (
              <p>
                Cobertura estimada:{' '}
                <span className="font-medium">{estimatedCoverage.toFixed(1)}%</span> do áudio
              </p>
            )}

            {audioDuration > 0 && !config.isMix && (
              <p>
                Duração total estimada:{' '}
                <span className="font-medium">
                  {formatDuration(config.targetDuration * config.quantity)}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Botão de Gerar */}
        <Button
          onClick={handleSubmit}
          disabled={isGenerating}
          className={`w-full ${config.isMix ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
          size="lg"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              {config.isMix ? 'Criando Storytelling...' : 'Gerando Highlights...'}
            </>
          ) : (
            <>
              {config.isMix ? <Workflow className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {config.isMix ? 'Gerar Mix Storytelling' : 'Gerar Highlights'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
});
