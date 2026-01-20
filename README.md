# AudioHighlights

Ferramenta web para transcrever podcasts e gerar highlights automaticamente usando IA.

## Funcionalidades

- **Upload de Áudio/Vídeo**: Suporta MP3, WAV, M4A, MP4, MOV (até 500MB, máx 4 horas)
- **Transcrição Automática**: Usa Groq Whisper com timestamps precisos e chunking automático para arquivos grandes
- **Geração de Highlights**: GPT-5 identifica automaticamente os melhores momentos para clips virais
- **Mix Mode (Storytelling)**: Combina múltiplos trechos não-contíguos em um único vídeo editado
- **Corte de Vídeo Server-Side**: Microserviço FFmpeg no Railway para cortes rápidos (stream copy)
- **Persistência**: Highlights salvos automaticamente - recarregue a página sem perder trabalho
- **Configuração Flexível**: Controle duração mínima, máxima, média e quantidade de highlights
- **Exportação Múltipla**: SRT/VTT para legendas, Markdown/TXT para texto, MP3/MP4 para clips
- **Player Integrado**: Reproduza e navegue pelo áudio/vídeo com controles completos
- **Dark Mode**: Interface adaptável com tema claro/escuro
- **Acessibilidade**: Suporte completo a leitores de tela e navegação por teclado

## Requisitos

- Node.js 18+
- Chave de API da OpenAI

## Instalação

```bash
# Clone ou entre no diretório
cd audio-highlights

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local e adicione sua chave da OpenAI

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Configuração

Crie um arquivo `.env.local` na raiz do projeto:

```env
# OpenAI API Configuration
# Get your API key at: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your-api-key-here

# Optional: OpenAI Organization ID
# OPENAI_ORG_ID=org-your-org-id-here
```

### Obtendo a Chave de API

1. Acesse [platform.openai.com](https://platform.openai.com/api-keys)
2. Crie uma nova chave de API
3. Copie e cole no arquivo `.env.local`

## Como Usar

1. **Upload**: Arraste ou clique para selecionar seu arquivo de áudio
2. **Transcrição**: Aguarde a transcrição automática via Whisper
3. **Visualizar**: Navegue pela transcrição com timestamps clicáveis
4. **Configure**: Defina os parâmetros dos highlights:
   - **Duração Mínima**: Menor tamanho aceitável (30-300s)
   - **Duração Média**: Tamanho ideal dos clips
   - **Duração Máxima**: Maior tamanho aceitável (60-600s)
   - **Quantidade**: Número de highlights (1-20)
   - **Tópicos**: Foque em ou exclua tópicos específicos (opcional)
5. **Gerar**: Clique em "Gerar Highlights"
6. **Exportar**: Baixe individualmente ou em lote nos formatos SRT, Markdown

## Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx                 # Página principal da aplicação
│   ├── layout.tsx               # Layout raiz com fontes
│   ├── globals.css              # Estilos globais (Tailwind v4)
│   └── api/
│       ├── transcribe/route.ts  # API de transcrição (OpenAI Whisper)
│       └── highlights/route.ts  # API de highlights (GPT-4o)
├── components/
│   ├── ui/                      # Componentes shadcn/ui
│   ├── upload/
│   │   └── dropzone.tsx         # Upload de arquivos com validação
│   ├── audio/
│   │   └── player.tsx           # Player de áudio customizado
│   ├── transcription/
│   │   └── transcript-viewer.tsx # Visualizador de transcrição
│   └── highlights/
│       ├── config-panel.tsx     # Painel de configuração
│       ├── highlight-card.tsx   # Card individual de highlight
│       └── highlight-list.tsx   # Lista com estatísticas
├── lib/
│   ├── constants.ts             # Constantes da aplicação
│   ├── validations.ts           # Schemas Zod de validação
│   ├── errors.ts                # Utilitários de tratamento de erros
│   ├── format-utils.ts          # Formatação de tempo/duração
│   ├── export.ts                # Funções de exportação
│   └── utils.ts                 # Utilitários shadcn
└── types/
    ├── index.ts                 # Tipos principais da aplicação
    └── api.ts                   # Tipos de API (OpenAI)
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript 5 (strict mode)
- **UI**: React 19 + Tailwind CSS v4 + shadcn/ui
- **Transcrição**: Groq API (Whisper)
- **Highlights**: OpenAI API (GPT-5)
- **Vídeo**: FFmpeg (microserviço Docker)
- **Validação**: Zod
- **Ícones**: Lucide React
- **Toast**: Sonner
- **Deploy**: Vercel (Frontend) + Railway (FFmpeg)

## APIs

### POST /api/transcribe

Transcreve um arquivo de áudio usando OpenAI Whisper.

**Request**: `multipart/form-data`
- `file`: Arquivo de áudio (MP3, WAV, M4A, OGG, WebM)
- `projectId`: UUID do projeto (opcional)

**Response**:
```json
{
  "success": true,
  "transcription": {
    "id": "uuid",
    "projectId": "uuid",
    "fullText": "Transcrição completa...",
    "segments": [
      {
        "id": "uuid",
        "start": 0.0,
        "end": 5.5,
        "text": "Texto do segmento",
        "confidence": 0.95,
        "words": [...]
      }
    ],
    "language": "pt",
    "duration": 3600,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/highlights

Gera highlights a partir dos segmentos de transcrição usando GPT-4o.

**Request**:
```json
{
  "segments": [...],
  "config": {
    "minDuration": 30,
    "maxDuration": 120,
    "targetDuration": 60,
    "quantity": 5,
    "focusTopics": ["tecnologia", "inovação"],
    "excludeTopics": ["política"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "highlights": [
    {
      "id": "uuid",
      "title": "Título do highlight",
      "summary": "Resumo do conteúdo...",
      "startTime": 120.5,
      "endTime": 180.3,
      "duration": 59.8,
      "transcript": "Transcrição do trecho...",
      "relevanceScore": 95,
      "tags": ["tecnologia", "IA"],
      "reasoning": "Explicação da seleção..."
    }
  ],
  "stats": {
    "totalDuration": 300,
    "averageDuration": 60,
    "coveragePercent": 8.3
  }
}
```

## Scripts

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar em produção
npm run start

# Lint
npm run lint
```

## CI/CD

O projeto inclui GitHub Actions para CI/CD:
- ✅ Lint automático (ESLint)
- ✅ Type checking (TypeScript)
- ✅ Build verification

## Melhorias Implementadas

### Segurança
- ✅ Validação robusta com Zod em todas as APIs
- ✅ Tratamento de erros que não expõe detalhes internos
- ✅ Validação de tipos de arquivo no upload
- ✅ Sanitização de inputs

### Performance
- ✅ Cleanup automático de Object URLs (sem memory leaks)
- ✅ Componentes otimizados
- ✅ Validação no servidor e cliente

### UX/Acessibilidade
- ✅ ARIA labels em todos os controles
- ✅ Confirmação antes de descartar trabalho
- ✅ Mensagens de erro claras e em português
- ✅ Loading states com feedback visual
- ✅ Dark mode suportado

### Manutenibilidade
- ✅ Constantes centralizadas
- ✅ Validação com schemas Zod
- ✅ Tipos TypeScript bem definidos
- ✅ Sem código duplicado
- ✅ Documentação completa

## Licença

MIT
