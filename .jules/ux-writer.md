## 2026-01-29 - Empty State Improvement

**Copy Type:** Empty State
**Original:** "Nenhuma task ainda" / "Faça upload de um arquivo de áudio para começar!"
**Changed To:** "Nenhum áudio enviado" / "Envie seu primeiro arquivo para gerar highlights automaticamente."
**Learning:** "Task" is internal jargon. Users think in terms of their content ("audio"). "Faça upload" is passive; "Envie" is active. Adding the "why" (benefits) in empty states increases motivation.
**Rule:** Avoid "task" in user-facing copy unless it refers to a specific workflow item the user created. Use content-first terms (Audio, Video, Project).

## 2026-02-03 - Improved Audio Error Message

**Copy Type:** Error message for audio duration limit
**Original:** "Áudio muito longo. Máximo permitido: 4 horas"
**Changed To:** "O áudio excede o limite de 4 horas. Divida o arquivo em partes menores."
**Learning:** "Áudio muito longo" was too robotic and "Máximo permitido" was passive. The new copy explains the limit and offers a solution (split the file), matching the helpful tone of the file size error.
**Rule:** Error messages for limits should:
1. State the limit clearly.
2. Provide an actionable solution (e.g., "Split the file").
3. Use active voice.

## 2026-02-26 - Short Audio Warning Improvement

**Copy Type:** Warning message
**Original:** "Você pode continuar, mas a geração de highlights funciona melhor com áudios acima de 1 minuto."
**Changed To:** "Recomendamos áudios acima de 1 minuto para highlights melhores."
**Learning:** Reassuring permissions ("Você pode continuar") are redundant when the UI state is non-blocking (warning color vs error color). Users prefer concise, actionable advice over wordy clarifications.
**Rule:** For non-blocking warnings, skip the "You can continue" preamble and state the recommendation directly.

## 2026-02-27 - AI Context Explanation in Warnings

**Copy Type:** Warning message (Short Audio)
**Original:** "Recomendamos áudios acima de 1 minuto para highlights melhores."
**Changed To:** "A IA precisa de mais contexto para encontrar os melhores momentos. Recomendamos arquivos com pelo menos 1 minuto."
**Learning:** Simply stating a recommendation ("Recomendamos...") can feel arbitrary. Explaining the *technical reason* in simple terms ("A IA precisa de mais contexto") educates the user and justifies the constraint, likely increasing compliance.
**Rule:** When warning about AI limitations, briefly explain the technical "why" (e.g., context, audio clarity) to build trust and understanding.

## 2026-05-18 - Error Message Tone Decision

**Copy Type:** Error messages / Empty states for missing processing data

**Original:**
- "Não foi possível processar / Tivemos um problema técnico. Por favor, tente novamente."
- "Este projeto ainda não foi processado ou não existe."

**Changed To:**
- "Erro no processamento / Não conseguimos processar o arquivo. Verifique sua conexão e tente novamente."
- "Este projeto não existe ou ainda está na fila de processamento."

**Learning:** Generic failure messages ("Tivemos um problema técnico" / "Não foi possível processar") provide users with dead ends. Changing these to explicit error states ("Erro no processamento") with potential causes ("Verifique sua conexão e tente novamente") makes the errors actionable. Similarly, empty states for missing projects must clarify they might still be in the queue, reassuring users.

**Rule:** For this app, ALWAYS:
1. Explain what went wrong with an actionable next step when an error occurs (e.g. "Verifique sua conexão").
2. Reassure the user in empty states involving processing queues (e.g. "ainda está na fila de processamento").

**Pattern to follow:**
- ❌ "Não foi possível [ação] / Tivemos um problema"
- ✅ "Erro no [processo] / [Ação] não funcionou. [Sugerir solução]"
