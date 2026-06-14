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
## 2025-02-12 - Error Message Unification & Clarity

**Copy Type:** Error messages in `src/lib/constants.ts`

**Original:**
- `FILE_TOO_LARGE: 'O arquivo excede o limite de 500MB. Comprima o áudio ou divida em partes menores.'`
- `NO_FILE_PROVIDED: 'Nenhum arquivo enviado'`
- `TRANSCRIPTION_FAILED: 'Não foi possível transcrever o áudio. Verifique o arquivo e tente novamente.'`
- `HIGHLIGHTS_FAILED: 'Não foi possível gerar os highlights. Tente novamente em alguns instantes.'`

**Changed To:**
- `FILE_TOO_LARGE: 'Arquivo deve ter menos de 500MB. Comprima o arquivo ou divida em partes menores.'`
- `NO_FILE_PROVIDED: 'Nenhum arquivo enviado. Selecione um arquivo para começar.'`
- `TRANSCRIPTION_FAILED: 'Não foi possível processar o arquivo. Verifique se o formato é válido e tente novamente.'`
- `HIGHLIGHTS_FAILED: 'Não foi possível gerar os cortes. Tente novamente em alguns instantes.'`

**Learning:** Unifying terminology (e.g., using "Arquivo" instead of mixing "Arquivo" and "Áudio", using "Processamento" instead of "Transcrição", and "Cortes" instead of "Highlights") improves clarity. Adding next steps to messages without a clear path forward (like `NO_FILE_PROVIDED`) provides better UX. Using clear, neutral constraint descriptions ("Arquivo deve ter menos de...") instead of blame-y phrasing ("O arquivo excede o limite...") is friendlier.

**Rule:** For this app, ALWAYS:
1. Unify terminology: "Arquivo", "Projeto" / "Processamento", "Cortes".
2. Add a clear next action for the user to resolve the error.
3. State constraints clearly and neutrally.
