# DECUPAGEM - Audio Cleanup & Narrative Analysis

Feature para análise automática de áudio que identifica erros de fala, silêncios e desvios narrativos, gerando uma lista de cortes para edição profissional.

## User Review Required

> [!IMPORTANT]
> **Decisão de Arquitetura**: A DECUPAGEM será um fluxo **paralelo** aos Highlights existentes, não os substitui.

> [!WARNING]
> **Dependência de Transcrição**: A funcionalidade requer que o áudio já tenha sido transcrito. A análise usa os `segments` com timestamps de palavra (`words`) para precisão de corte.

---

## Proposed Changes

### Types & Interfaces

#### [NEW] [decupagem.ts](file:///Users/jhonatan/Downloads/audio-highlights-1/src/types/decupagem.ts)

Tipos específicos para a feature:

```typescript
// Tipos de problema identificados
type DecupageProblemType = 
  | 'silence'           // Silêncio > 2s
  | 'filler_words'      // "é...", "então...", "tipo..."
  | 'stutter'           // Gagueira/repetição
  | 'wrong_word'        // Palavra errada/corrigida
  | 'false_start'       // Início falso de frase
  | 'off_topic'         // Foge da narrativa principal
  | 'contradiction'     // Contradiz algo dito antes
  | 'repetition';       // Repete ideia já expressa

// Status de decisão do usuário
type DecisionStatus = 'pending' | 'keep' | 'cut' | 'review';

interface DecupageSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  problemType: DecupageProblemType;
  severity: 'low' | 'medium' | 'high';
  suggestion: 'cut' | 'keep' | 'review';
  reason: string;
  status: DecisionStatus;
}

interface DecupageResult {
  id: string;
  projectId: string;
  originalDuration: number;
  cleanDuration: number;      // Duração estimada após cortes
  timeSaved: number;          // Segundos economizados
  segments: DecupageSegment[];
  narrativeSummary: string;   // Resumo do tema principal
  createdAt: Date;
}

interface EDLExport {
  format: 'cmx3600' | 'fcpxml' | 'csv';
  content: string;
}
```

---

### API Routes

#### [NEW] [route.ts](file:///Users/jhonatan/Downloads/audio-highlights-1/src/app/api/decupagem/route.ts)

Endpoint principal que processa a transcrição e retorna análise de decupagem:

**Responsabilidades:**
1. Receber `segments` com `words` (timestamps de palavra)
2. Detectar silêncios via gaps nos timestamps (`> 2s`)
3. Chamar LLM para análise de erros de fala e narrativa
4. Retornar lista estruturada de cortes sugeridos

**Fluxo:**
```
segments → silence_detection() → llm_analysis() → DecupageResult
```

---

#### [NEW] [route.ts](file:///Users/jhonatan/Downloads/audio-highlights-1/src/app/api/decupagem/export/route.ts)

Endpoint para exportar EDL:

**Formatos suportados:**
- **CMX3600**: Padrão da indústria (DaVinci Resolve, Premiere)
- **FCPXML**: Final Cut Pro
- **CSV**: Planilha simples

---

### Library Functions

#### [NEW] [silence-detector.ts](file:///Users/jhonatan/Downloads/audio-highlights-1/src/lib/silence-detector.ts)

Detecção de silêncios baseada em gaps nos timestamps de palavras:

```typescript
function detectSilences(
  words: WordTimestamp[],
  thresholdMs: number = 2000
): SilenceSegment[]
```

**Algoritmo:**
- Itera pelos `words` comparando `word[n].start` com `word[n-1].end`
- Gaps maiores que threshold são marcados como silêncio

---

#### [NEW] [edl-generator.ts](file:///Users/jhonatan/Downloads/audio-highlights-1/src/lib/edl-generator.ts)

Geração de EDL em múltiplos formatos:

```typescript
function generateEDL(
  segments: DecupageSegment[],
  format: 'cmx3600' | 'fcpxml' | 'csv',
  metadata: { title: string; fps: number }
): string
```

---

#### [MODIFY] [validations.ts](file:///Users/jhonatan/Downloads/audio-highlights-1/src/lib/validations.ts)

Adicionar schema de validação para request de decupagem:

```typescript
export const decupageRequestSchema = z.object({
  segments: z.array(transcriptionSegmentSchema),
  config: z.object({
    silenceThreshold: z.number().min(500).max(10000).default(2000),
    detectFillers: z.boolean().default(true),
    detectOffTopic: z.boolean().default(true),
    narrativeContext: z.string().optional(),
  }),
});
```

---

### UI Components

#### [NEW] [decupagem-view.tsx](file:///Users/jhonatan/Downloads/audio-highlights-1/src/components/decupagem/decupagem-view.tsx)

Componente principal que lista os cortes sugeridos:

- Lista de `DecupageSegment` com ações (keep/cut/review)
- Resumo: duração original vs limpa, tempo economizado
- Botão de exportar EDL
- Indicadores visuais por tipo de problema

---

#### [NEW] [cut-suggestion-card.tsx](file:///Users/jhonatan/Downloads/audio-highlights-1/src/components/decupagem/cut-suggestion-card.tsx)

Card individual para cada sugestão de corte:

- Timestamp (MM:SS → MM:SS)
- Tipo de problema (badge colorido)
- Texto do trecho
- Razão da sugestão
- Botões: ✅ Manter | ✂️ Cortar | 🔍 Revisar

---

### Integration

#### [MODIFY] [page.tsx](file:///Users/jhonatan/Downloads/audio-highlights-1/src/app/page.tsx)

Adicionar nova aba/seção para acessar DECUPAGEM após transcrição:

- Nova tab "Decupagem" ao lado de "Highlights"
- Botão "Analisar para Corte" que dispara `/api/decupagem`

---

## Verification Plan

### Unit Tests

Criar testes em `src/lib/silence-detector.test.ts`:

```bash
npm run test -- silence-detector
```

**Casos a testar:**
1. Detecta silêncio de 3s entre palavras
2. Ignora gaps menores que threshold
3. Múltiplos silêncios consecutivos
4. Edge case: array vazio de words

---

### Integration Tests

Criar teste para API em `src/app/api/decupagem/route.test.ts`:

```bash
npm run test -- decupagem
```

**Casos:**
1. Request válido retorna `DecupageResult`
2. Request sem segments retorna erro 400
3. Silêncios são detectados corretamente

---

### Manual Verification

1. **Upload de áudio teste** com silêncios propositais (> 2s)
2. **Verificar lista de cortes** mostra silêncios detectados
3. **Testar exportação EDL**:
   - Baixar arquivo `.edl` (CMX3600)
   - Importar no DaVinci Resolve ou Premiere
   - Confirmar que marcadores estão nos timestamps corretos

---

## Implementation Order

| Fase | Componente | Dependência |
|------|------------|-------------|
| 1 | Types (`decupagem.ts`) | - |
| 2 | Silence detector (`silence-detector.ts`) | Types |
| 3 | Silence detector tests | Silence detector |
| 4 | Validations schema | Types |
| 5 | API route `/api/decupagem` | Tudo acima |
| 6 | EDL generator | Types |
| 7 | Export route `/api/decupagem/export` | EDL generator |
| 8 | UI Components | API routes |
| 9 | Page integration | UI Components |

---

## LLM Prompt Strategy

O prompt para o GPT analisará a transcrição buscando:

1. **Filler words**: Padrões como "é...", "tipo", "então", "né", "sabe"
2. **Stutters**: Repetições como "eu-eu-eu", "a-a-a"
3. **False starts**: Frases abandonadas no meio
4. **Off-topic**: Trechos que fogem do tema principal
5. **Contradictions**: Afirmações que contradizem algo anterior

O prompt receberá contexto narrativo opcional para melhor identificar desvios.
