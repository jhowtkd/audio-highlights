const MOCK_TRANSCRIPT = `
[00:00:00] Bem-vindos ao nosso podcast! Hoje vamos falar sobre produtividade.
[00:00:15] A primeira dica é usar blocos de tempo para focar. A técnica Pomodoro é ótima.
[00:00:30] Em vez de trabalhar 4 horas seguidas, trabalhe 25 minutos e descanse 5.
[00:00:45] Isso ajuda o cérebro a se recuperar e manter a performance ao longo do dia.
[00:01:00] A segunda dica é desativar as notificações do celular durante o foco.
`;

// Mocking OpenAI for the POC to run without a real API key in the CI/Sandbox environment
class MockOpenAI {
  constructor() {
    this.chat = {
      completions: {
        create: async (config) => {
          console.log(`[Mock API Call] Model: ${config.model}`);
          const prompt = config.messages.find(m => m.role === 'system').content;

          let content = '';
          if (prompt.includes('Show Notes')) {
             content = `## Show Notes\n\n**Resumo:** Um episódio focado em técnicas práticas de produtividade.\n\n**Tópicos:**\n- [00:00:15] A Técnica Pomodoro\n- [00:01:00] Gestão de Notificações`;
          } else if (prompt.includes('Twitter')) {
             content = `🧵 Quer ser mais produtivo? Aqui vão 2 dicas rápidas do nosso último episódio:\n\n1️⃣ Use a técnica Pomodoro: 25 min de foco, 5 min de pausa. ⏱️\n2️⃣ Desative as notificações do celular! 🔕\n\n#Produtividade #Foco #Podcast`;
          }

          return {
            choices: [{ message: { content } }]
          };
        }
      }
    };
  }
}

async function runPoc() {
  console.log("🚀 Starting Content Repurposing POC...\n");

  // Use mock for demonstration
  const openai = new MockOpenAI();

  // 1. Generate Show Notes
  console.log("📝 Generating Show Notes...");
  const showNotesResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'Você é um assistente que cria Show Notes estruturados para podcasts.' },
      { role: 'user', content: MOCK_TRANSCRIPT }
    ]
  });
  console.log(showNotesResponse.choices[0].message.content);
  console.log("\n-----------------------------------\n");

  // 2. Generate Social Media Thread (Twitter)
  console.log("🐦 Generating Twitter Thread...");
  const twitterResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'Você é um social media manager. Crie uma thread pro Twitter baseada na transcrição.' },
      { role: 'user', content: MOCK_TRANSCRIPT }
    ]
  });
  console.log(twitterResponse.choices[0].message.content);
  console.log("\n✅ POC Completed Successfully!");
}

runPoc();
