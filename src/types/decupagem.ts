export type DecupageProblemType =
    | 'silence'           // Silêncio > 2s
    | 'filler_words'      // "é...", "então...", "tipo..."
    | 'stutter'           // Gagueira/repetição
    | 'wrong_word'        // Palavra errada/corrigida
    | 'false_start'       // Início falso de frase
    | 'off_topic'         // Foge da narrativa principal
    | 'contradiction'     // Contradiz algo dito antes
    | 'repetition';       // Repete ideia já expressa

// Status de decisão do usuário
export type DecisionStatus = 'pending' | 'keep' | 'cut' | 'review';

export interface DecupageSegment {
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

export interface DecupageResult {
    id: string;
    projectId: string;
    originalDuration: number;
    cleanDuration: number;      // Duração estimada após cortes
    timeSaved: number;          // Segundos economizados
    segments: DecupageSegment[];
    narrativeSummary: string;   // Resumo do tema principal
    createdAt: Date;
}

export type EDLFormat = 'cmx3600' | 'fcpxml' | 'csv';

export interface EDLExport {
    format: EDLFormat;
    content: string;
    filename: string;
}
