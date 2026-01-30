## 2026-01-30 - Dropzone Warning Tone

**Copy Type:** Warning message for short audio files

**Original:**
Headline: "Áudio curto detectado ({duration})"
Body: "Para melhores resultados na geração de highlights, recomendamos áudios com mais de 1 minuto. Áudios muito curtos podem não gerar cortes relevantes."

**Changed To:**
Headline: "Áudio com menos de 1 minuto ({duration})"
Body: "Recomendamos áudios mais longos para gerar bons highlights. Você pode continuar, mas o resultado pode ser limitado."

**Learning:**
Users often upload short files for testing. The original message sounded like a system error ("detectado") and was wordy.
The new message is factual ("menos de 1 minuto") and explicitly permissive ("Você pode continuar"), reducing friction/anxiety.

**Rule:**
For warnings that don't block the user:
1. State the condition factually (no "detected").
2. Explain the consequence concisely.
3. Explicitly tell the user they can proceed if applicable ("You can continue...").
