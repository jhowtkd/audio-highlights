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
## 2024-04-17 - Confirmation Dialog Tone and Specificity

**Copy Type:** Confirmation dialog for retranscription action

**Original:** "Tem certeza que deseja retranscrever este arquivo? Isso irá apagar os resultados atuais e gastar créditos novamente." inside a native `window.confirm()`.

**Changed To:**
Title: "Retranscrever '${task.filename}'?"
Description: "Os resultados atuais serão apagados e seus créditos serão gastos novamente. Esta ação não pode ser desfeita."
Buttons: "Cancelar" / "Retranscrever"

**Learning:** Native `window.confirm()` dialogs use vague button labels ("OK"/"Cancel") and often lead to overly wordy or alarming phrasing like "Tem certeza...". Users need to know exactly what action they are taking and on what specific item.

**Rule:** For this app, ALWAYS:
1. Use specific actions as titles instead of vague questions. Start with the action and item name (e.g., "Retranscrever 'audio.mp3'?").
2. State the consequences clearly in a separate description.
3. Use action-specific button labels (e.g., "Retranscrever") instead of generic ones (e.g., "OK").
4. Avoid native `window.confirm()` in favor of the design system's `AlertDialog` for a better user experience.
