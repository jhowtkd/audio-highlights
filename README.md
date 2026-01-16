# AudioHighlights

Ferramenta web para transcrever podcasts e gerar highlights automaticamente usando IA.

## Funcionalidades

- **Upload de Áudio**: Suporta MP3, WAV, M4A, OGG e WebM (até 500MB)
- **Transcrição Automática**: Usa OpenAI Whisper com timestamps precisos
- **Geração de Highlights**: GPT-4 identifica os melhores momentos
- **Configuração Flexível**: Controle duração mínima, máxima, média e quantidade
- **Exportação**: SRT para legendas e Markdown/TXT para texto

## Requisitos

- Node.js 18+
- Chave de API da OpenAI

## Instalação

```bash
# Clone ou entre no diretório
cd audio-highlights

# Instale as dependências
npm install

# Configure a variável de ambiente
cp .env.example .env.local
# Edite .env.local e adicione sua OPENAI_API_KEY

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Configuração

Crie um arquivo `.env.local` na raiz do projeto:

```env
OPENAI_API_KEY=sk-sua-chave-aqui
```

## Como Usar

1. **Upload**: Arraste ou clique para selecionar seu arquivo de áudio
2. **Transcrição**: Aguarde a transcrição automática via Whisper
3. **Configure**: Defina os parâmetros dos highlights:
   - **Duração Mínima**: Menor tamanho aceitável (15-300s)
   - **Duração Média**: Tamanho ideal dos clips
   - **Duração Máxima**: Maior tamanho aceitável (30-600s)
   - **Quantidade**: Número de highlights (1-20)
4. **Gerar**: Clique em "Gerar Highlights"
5. **Exportar**: Baixe em SRT ou Markdown

## Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx                 # Página principal
│   └── api/
│       ├── transcribe/route.ts  # API Whisper
│       └── highlights/route.ts  # API GPT-4
├── components/
│   ├── ui/                      # shadcn/ui
│   ├── upload/                  # Dropzone
│   ├── audio/                   # Player
│   ├── transcription/           # Visualizador
│   └── highlights/              # Config e cards
├── lib/
│   ├── format-utils.ts          # Formatação
│   ├── export.ts                # Exportação
│   └── utils.ts                 # shadcn utils
├── hooks/
│   └── use-project-store.ts     # Zustand store
└── types/
    └── index.ts                 # TypeScript types
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilo**: Tailwind CSS + shadcn/ui
- **IA**: OpenAI (Whisper + GPT-4)
- **Estado**: Zustand
- **Validação**: Zod

## APIs

### POST /api/transcribe

Transcreve um arquivo de áudio usando Whisper.

**Request**: `multipart/form-data` com `file` (áudio)

**Response**:
```json
{
  "success": true,
  "transcription": {
    "id": "...",
    "fullText": "...",
    "segments": [...],
    "duration": 3600
  }
}
```

### POST /api/highlights

Gera highlights a partir dos segmentos de transcrição.

**Request**:
```json
{
  "segments": [...],
  "config": {
    "minDuration": 30,
    "maxDuration": 120,
    "targetDuration": 60,
    "quantity": 5
  }
}
```

**Response**:
```json
{
  "success": true,
  "highlights": [...],
  "stats": {
    "totalDuration": 300,
    "averageDuration": 60,
    "coveragePercent": 8.3
  }
}
```

## Licença

MIT
