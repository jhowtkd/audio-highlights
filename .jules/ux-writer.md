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

## 2026-03-01 - Refinement of Technical Jargon in Error Messages

**Copy Type:** Error message (Highlights generation & generic processing)
**Original:** "Resposta vazia do GPT" / "Resposta inválida do GPT. Tente novamente." / "Ocorreu um erro inesperado. Tente novamente." / "Tivemos um problema técnico. Por favor, tente novamente."
**Changed To:** "Não foi possível gerar os highlights. Tente novamente." / "Não foi possível processar os resultados. Tente novamente." / "Não foi possível completar a ação. Tente novamente em alguns instantes." / "Não foi possível processar o arquivo. Tente novamente em alguns instantes."
**Learning:** Exposing technical jargon like "GPT" or internal component names confuses users and can induce anxiety, as they don't know what it means for them or what to do about it. Vague messages like "Ocorreu um erro inesperado" are similarly unhelpful. Explaining the *outcome* in user terms ("Não foi possível gerar...") and providing a next step reduces friction.
**Rule:** Always translate technical errors into user-friendly terms. Avoid exposing service names (like GPT) and instead focus on what failed from the user's perspective.
