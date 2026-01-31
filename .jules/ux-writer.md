## 2026-01-29 - Empty State Improvement

**Copy Type:** Empty State

**Original:**
"Nenhuma task ainda" / "Faça upload de um arquivo de áudio para começar!"

**Changed To:**
"Nenhum áudio enviado" / "Envie seu primeiro arquivo para gerar highlights automaticamente."

**Learning:**
"Task" é jargão interno; usuários pensam em termos do próprio conteúdo ("áudio"). "Faça upload" é mais passivo do que "Envie". Incluir o "porquê" (benefício) em empty states aumenta a motivação.

**Rule:**
Evitar "task" em textos voltados ao usuário, a menos que se refira a um item específico de workflow criado por ele. Priorizar termos centrados no conteúdo (Áudio, Vídeo, Projeto).


## 2026-01-30 - Dropzone Warning Tone

**Copy Type:** Warning message para áudios curtos

**Original:**
Headline: "Áudio curto detectado ({duration})"
Body: "Para melhores resultados na geração de highlights, recomendamos áudios com mais de 1 minuto. Áudios muito curtos podem não gerar cortes relevantes."

**Changed To:**
Headline: "Áudio com menos de 1 minuto ({duration})"
Body: "Recomendamos áudios mais longos para gerar bons highlights. Você pode continuar, mas o resultado pode ser limitado."

**Learning:**
Usuários frequentemente enviam arquivos curtos só para testar. A mensagem original soava como erro de sistema ("detectado") e era prolixa. A nova mensagem é factual ("menos de 1 minuto") e explicitamente permissiva ("Você pode continuar"), reduzindo fricção e ansiedade.

**Rule:**
Para avisos que não bloqueiam o usuário:
1. Explicar a condição de forma factual (sem "detectado").
2. Explicar a consequência de forma concisa.
3. Deixar claro que o usuário pode continuar, quando aplicável ("Você pode continuar...").
