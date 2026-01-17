'use client';

import { useState } from 'react';
import { Sparkles, Clock, Hash, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDuration } from '@/lib/format-utils';
import { PLATFORM_TEMPLATES } from '@/lib/constants';
import type { HighlightConfig, PlatformTemplate } from '@/types';

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
  platform: 'custom',
};

export function ConfigPanel({ onGenerate, isGenerating, audioDuration }: ConfigPanelProps) {
  const [config, setConfig] = useState<HighlightConfig>(DEFAULT_CONFIG);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformTemplate>('custom');

  const handlePlatformSelect = (platform: PlatformTemplate) => {
    setSelectedPlatform(platform);
    const template = PLATFORM_TEMPLATES[platform];
    setConfig((prev) => ({
      ...prev,
      platform,
      minDuration: template.minDuration,
      maxDuration: template.maxDuration,
      targetDuration: template.targetDuration,
    }));
  };

  const handleMinDurationChange = (value: number[]) => {
    const newMin = value[0];
    setSelectedPlatform('custom');
    setConfig((prev) => ({
      ...prev,
      platform: 'custom',
      minDuration: newMin,
      // Garante que max e target são maiores que min
      maxDuration: Math.max(prev.maxDuration, newMin),
      targetDuration: Math.max(Math.min(prev.targetDuration, prev.maxDuration), newMin),
    }));
  };

  const handleMaxDurationChange = (value: number[]) => {
    const newMax = value[0];
    setSelectedPlatform('custom');
    setConfig((prev) => ({
      ...prev,
      platform: 'custom',
      maxDuration: newMax,
      // Garante que min e target são menores que max
      minDuration: Math.min(prev.minDuration, newMax),
      targetDuration: Math.min(Math.max(prev.targetDuration, prev.minDuration), newMax),
    }));
  };

  const handleTargetDurationChange = (value: number[]) => {
    const newTarget = value[0];
    setSelectedPlatform('custom');
    setConfig((prev) => ({
      ...prev,
      platform: 'custom',
      targetDuration: Math.max(prev.minDuration, Math.min(newTarget, prev.maxDuration)),
    }));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setConfig((prev) => ({
      ...prev,
      quantity: Math.max(1, Math.min(20, value)),
    }));
  };

  const handleSubmit = () => {
    console.log('🔘 Botão clicado no ConfigPanel');
    onGenerate(config);
  };

  // Estima a cobertura baseado na configuração
  const estimatedCoverage = audioDuration > 0
    ? ((config.targetDuration * config.quantity) / audioDuration) * 100
    : 0;

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-blue-500" />
          Configurar Highlights
        </CardTitle>
        <CardDescription>
          Escolha uma plataforma ou configure manualmente
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Platform Selector */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            🎯 Plataforma
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(PLATFORM_TEMPLATES) as [PlatformTemplate, typeof PLATFORM_TEMPLATES[PlatformTemplate]][]).map(([key, template]) => (
              <button
                key={key}
                type="button"
                onClick={() => handlePlatformSelect(key)}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${selectedPlatform === key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
              >
                <span className="text-lg">{template.icon}</span>
                <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                  {template.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {template.description}
                </span>
              </button>
            ))}
          </div>
        </div>
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
            Nenhum highlight será menor que isso
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
            Duração ideal de cada highlight
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
            Nenhum highlight será maior que isso
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
            Entre 1 e 20 highlights
          </p>
        </div>

        {/* Resumo da Configuração */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Info className="h-4 w-4" />
            Resumo
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p>
              <span className="font-medium">{config.quantity}</span> highlights de{' '}
              <span className="font-medium">{formatDuration(config.minDuration)}</span> a{' '}
              <span className="font-medium">{formatDuration(config.maxDuration)}</span>
            </p>
            <p>
              Duração total estimada:{' '}
              <span className="font-medium">
                {formatDuration(config.targetDuration * config.quantity)}
              </span>
            </p>
            {audioDuration > 0 && (
              <p>
                Cobertura estimada:{' '}
                <span className="font-medium">{estimatedCoverage.toFixed(1)}%</span> do áudio
              </p>
            )}
          </div>
        </div>

        {/* Botão de Gerar */}
        <Button
          onClick={handleSubmit}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Gerando Highlights...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar Highlights
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
