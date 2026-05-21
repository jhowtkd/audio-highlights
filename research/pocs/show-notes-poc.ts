/**
 * Proof of Concept: Automated Show Notes Generation
 *
 * This POC demonstrates how to leverage existing AI dependencies (OpenAI/Gemini)
 * to generate structured Show Notes (Summaries, Chapters, Quotes) from transcript segments.
 */

interface Segment {
  start: number;
  end: number;
  text: string;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `[${m}:${s}]`;
}

function buildShowNotesPrompt(segments: Segment[]): string {
  const transcriptText = segments
    .map(s => `${formatTimestamp(s.start)} ${s.text}`)
    .join('\n');

  return `Você é um assistente especializado em criar "Show Notes" (notas do episódio) para podcasts e vídeos.
Baseado na transcrição abaixo, gere um resumo estruturado em Markdown com as seguintes seções:
1. **Resumo Executivo:** (1-2 parágrafos)
2. **Capítulos:** (Timestamps e títulos curtos dos assuntos principais)
3. **Principais Aprendizados:** (Bullet points com os melhores insights)
4. **Citações Marcantes:** (Frases exatas que merecem destaque)

TRANSCRIÇÃO:
${transcriptText}

Retorne APENAS o Markdown gerado, sem blocos de código ou texto adicional antes/depois.`;
}

// Simulate running the POC
async function runPOC() {
  const sampleSegments: Segment[] = [
    { start: 0, end: 5, text: "Bem-vindos a mais um episódio do nosso podcast sobre tecnologia." },
    { start: 5, end: 12, text: "Hoje vamos falar sobre como a inteligência artificial está mudando a edição de áudio." },
    { start: 12, end: 30, text: "Antigamente, remover silêncios levava horas de trabalho manual na timeline." },
    { start: 30, end: 45, text: "Com modelos novos, você consegue fazer a decupagem em questão de segundos." },
    { start: 45, end: 60, text: "É uma economia de tempo brutal para qualquer criador de conteúdo." }
  ];

  console.log("--- Gerando Prompt para Show Notes ---");
  const prompt = buildShowNotesPrompt(sampleSegments);
  console.log(prompt);
  console.log("--------------------------------------");
  console.log("POC Finalizado com Sucesso: O prompt estruturado está pronto para ser enviado à API (OpenAI/Gemini).");
}

runPOC();
