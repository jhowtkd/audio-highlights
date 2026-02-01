## 2025-02-18 - Validation Language Consistency

**Copy Type:** Validation Error Messages

**Original:** "File is required" (English in Portuguese app)

**Changed To:** "O arquivo é obrigatório"

**Learning:** This codebase is primarily in Portuguese (UI, constants), but validation schemas were using English defaults.
This creates a jarring experience for users if they encounter these errors.
Aligning backend validation messages with the frontend language is crucial for a consistent voice.

**Rule:** Ensure all validation messages match the application's primary language (Portuguese in this case).
