# Plan: Descriptive Titles for Clips

## Goal
Improve AI-generated titles to be more descriptive and include episode/project context in the UI.

---

## Problem Statement

1. **AI Quality**: GPT generates generic titles (e.g., "A melhor parte") instead of descriptive ones.
2. **No Context**: Titles don't reference the episode/project name.

---

## Proposed Changes

### 1. Improve GPT Prompt

#### [MODIFY] [route.ts](file:///Users/jhonatan/Downloads/audio-highlights-1/src/app/api/highlights/route.ts)

Update the prompt to:
- Require titles to be **specific and content-related**, not generic.
- Add negative examples (what NOT to do).
- Include `episodeTitle` in the request and use it in titles.

```diff
- \"title\": \"Título curto e magnético (máx 60 chars)\"
+ \"title\": \"[Nome do Episódio] - Título descritivo do conteúdo do trecho (máx 80 chars)\"
```

Add prompt rules:
```
❌ NUNCA use títulos genéricos como:
   - "O melhor momento"
   - "Parte mais importante"
   - "Trecho incrível"

✅ USE títulos que descrevam O QUE está sendo dito:
   - "[Episódio 42] Como a IA vai mudar o marketing em 2025"
   - "[Papo Tech] O erro que 90% dos programadores cometem"
   - "[Entrevista João] A história de como fundou a startup"
```

---

### 2. Add Episode Title to API Request

#### [MODIFY] [route.ts](file:///Users/jhonatan/Downloads/audio-highlights-1/src/app/api/highlights/route.ts)

Accept `episodeTitle` in request body and include in prompt.

#### [MODIFY] [validations.ts](file:///Users/jhonatan/Downloads/audio-highlights-1/src/lib/validations.ts)

Add `episodeTitle` to schema if needed.

---

### 3. Pass Episode Title from Frontend

#### [MODIFY] [tasks/[id]/page.tsx](file:///Users/jhonatan/Downloads/audio-highlights-1/src/app/tasks/%5Bid%5D/page.tsx)

Use `task.filename` (without extension) as the episode title.

#### [MODIFY] [page.tsx](file:///Users/jhonatan/Downloads/audio-highlights-1/src/app/page.tsx)

Use `audioFile.name` as the episode title.

---

### 4. UI Enhancement (Optional)

#### [MODIFY] [highlight-card.tsx](file:///Users/jhonatan/Downloads/audio-highlights-1/src/components/highlights/highlight-card.tsx)

Display the episode name as a subtle badge above the title if not already in the title.

---

## Verification Plan

1. Generate highlights for a test audio.
2. Verify titles include episode name.
3. Verify titles are descriptive (not generic).
4. Check UI displays correctly.

---

## Summary

| File | Change |
|------|--------|
| `route.ts` | Improved prompt + accept `episodeTitle` |
| `validations.ts` | Add `episodeTitle` to schema |
| `tasks/[id]/page.tsx` | Pass filename as `episodeTitle` |
| `page.tsx` | Pass filename as `episodeTitle` |
