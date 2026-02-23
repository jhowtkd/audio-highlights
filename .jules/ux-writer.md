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

## 2026-02-28 - Loading State Improvement

**Copy Type:** Loading State
**Original:** "Não feche esta página"
**Changed To:** "Mantenha esta aba aberta enquanto processamos"
**Learning:** Positive instructions reduce anxiety. "Tab" is more accurate than "Page". Adding "while we process" gives context.
**Rule:** Use positive instructions for wait states ("Keep open" > "Don't close").

## 2026-02-28 - Terminology Update

**Copy Type:** Navigation & Headers
**Original:** "Tasks" / "Novo Upload" / "Excluir task"
**Changed To:** "Meus Projetos" / "Novo Projeto" / "Excluir projeto"
**Learning:** "Task" is technical jargon. Users perceive these as creative "Projects". Consistent terminology builds trust.
**Rule:** Replace "Task" with "Project" (Projeto) in all user-facing strings. Keep "Task" in code only.
