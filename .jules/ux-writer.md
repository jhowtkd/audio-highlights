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

## 2026-03-01 - Error Message Tone Consistency

**Copy Type:** System Error Messages

**Original:**
"O arquivo excede o limite de 500MB. Comprima o áudio ou divida em partes menores."
"O áudio excede o limite de 4 horas. Divida o arquivo em partes menores."
"Formato inválido. Aceitamos: MP3..."

**Changed To:**
"Arquivo muito grande (máx. 500MB). Tente comprimir ou dividir."
"Áudio muito longo (máx. 4h). Divida em partes menores."
"Formato não suportado. Use MP3..."

**Learning:**
Current error messages were too wordy and passive ("excede o limite"). Users want to know *what* is wrong and *how* to fix it quickly.
-   Conciseness: Removing "O arquivo excede o limite de" -> "Arquivo very large (max. X)".
-   Tone: "Formato inválido" felt a bit blame-y. "Formato não suportado" is neutral.
-   Actionability: Kept or improved the "how to fix" part ("Tente comprimir", "Use MP3").

**Rule:**
For error limits:
1.  State the problem concisely (Subject + Problem).
2.  State the limit clearly in parentheses or short phrase.
3.  Offer a solution immediately.
4.  Avoid passive "exceeds limit" phrasing.
