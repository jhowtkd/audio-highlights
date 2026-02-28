import { z } from 'zod';

// Simple transcript sample for POC
const sampleTranscript = `
[00:00:00] Oi, bem-vindo a mais um episódio do nosso podcast sobre tecnologia.
[00:00:15] Hoje vamos falar sobre Inteligência Artificial, um assunto que tá dominando 2025.
[00:01:30] Primeiro, o que é IA Generativa? Basicamente, são modelos que criam conteúdo novo.
[00:03:45] Mas a grande novidade são os agentes autônomos, que não apenas respondem, mas agem no seu computador.
[00:05:20] Então, qual o impacto disso no mercado de trabalho? Na minha visão, vai mudar tudo.
[00:08:10] Muito obrigado por ouvir, até a próxima semana!
`;

const prompt = `Você é um especialista em SEO e Copywriting para YouTube.
Sua missão é gerar Capítulos (Timestamps) e Show Notes a partir de uma transcrição de podcast.

## TRANSCRIÇÃO COM TIMESTAMPS
${sampleTranscript}

## REGRAS PARA CAPÍTULOS
- Identifique os 3 a 5 principais tópicos.
- O primeiro capítulo DEVE obrigatoriamente começar em 00:00.
- Títulos curtos (máximo 50 caracteres) e chamativos (clickbait de SEO).

## FORMATO DE RESPOSTA (JSON PURO)
{
  "showNotes": "Resumo envolvente para a descrição do YouTube em 2 parágrafos, contendo palavras-chave e chamadas para ação.",
  "chapters": [
    {
      "time": "00:00",
      "title": "Introdução"
    },
    {
      "time": "01:30",
      "title": "O Segredo da IA"
    }
  ],
  "seoTitle": "Título do vídeo com alto potencial de clique",
  "tags": ["tag1", "tag2"]
}
`;

function main() {
    console.log("Mock POC Validation");
    console.log("Prompt to be sent to GPT-4o-mini:");
    console.log("--------------------------------------------------");
    console.log(prompt);
    console.log("--------------------------------------------------");
    console.log("Expected Output schema matches what would be mapped in the frontend.");
}

main();
