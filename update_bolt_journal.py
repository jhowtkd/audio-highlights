import datetime

today = datetime.datetime.now().strftime("%Y-%m-%d")

entry = f"""
## {today} - Waveform Component Memoization with Stable Props

**Bottleneck:** The `Waveform` component is heavy (renders canvas graphics) and was being re-rendered on every parent state change because its `onSeek` prop received an inline arrow function (`onSeek={{(time) => setSeekTo(time)}}`).

**Learning:** Wrapping a component in `React.memo` is ineffective if any of its props change on every render. Inline arrow functions create a new reference on every render, completely breaking the memoization. By passing the state setter function `setSeekTo` directly, a stable reference is provided.

**Action:** When memoizing a component with callback props, always pass stable references (like direct state setters or functions wrapped in `useCallback`) instead of inline arrow functions.

**Code:**
```typescript
// Parent Component (Before)
<Waveform onSeek={{(time) => setSeekTo(time)}} />

// Parent Component (After)
<Waveform onSeek={{setSeekTo}} />

// Child Component
export const Waveform = React.memo(function Waveform({{ ... }}) {{ ... }});
```
"""

with open(".jules/bolt.md", "a") as f:
    f.write(entry)
