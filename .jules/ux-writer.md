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
## 2024-05-18 - Project Terminology Consistency

**Copy Type:** Button labels and Dialog titles

**Original:** Mixed terminology like "Limpar concluídas", "Ver Resultado", "Adicionar novo áudio", "Arraste seu áudio aqui".

**Changed To:** Unified terminology using "Projeto" and "Arquivo" concepts: "Remover projetos concluídos", "Abrir projeto", "Criar novo projeto", "Arraste seu arquivo aqui".

**Learning:** This app previously mixed "Áudio" and "Projeto" concepts in the UI. Users upload media (audio or video), but the app treats the processing and resulting transcription/highlights as a "Project" (as seen in the "Meus Projetos" header and "Novo projeto" button). Also, specifying "áudio" in the dropzone was misleading since the app accepts video files too. Unifying the language around "Projeto" and "Arquivo" makes the interface clearer and more cohesive.

**Rule:** For this app, ALWAYS:
1. Refer to the overall workflow/item as a "Projeto" (not just "Resultado" or generic "Concluídas").
2. Refer to the uploaded media generally as "Arquivo" rather than strictly "Áudio", since video formats are also supported.
3. Keep action verbs specific and related to the object (e.g., "Abrir projeto" instead of "Ver").
