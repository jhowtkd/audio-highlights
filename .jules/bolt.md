## 2024-05-23 - [Audio Waveform Processing Blocking Main Thread]
**Learning:** Processing raw audio data (`getChannelData`) on the main thread with O(N) complexity for large files (e.g., 1 hour audio) can freeze the UI for significant time (~500ms).
**Action:** Always subsample or use a Web Worker when processing large audio buffers for visualization. Visual approximations don't need every single sample.
