# Qualtrics Adapter (Secure Pattern)

This folder provides a reusable Qualtrics chat runtime for study deployments.

## Files

- `qualtrics-chat-runtime.js`: client runtime for conversation UI and turn orchestration.
- `qualtrics-config.example.js`: per-study configuration template.
- `server-contract.md`: expected request/response contract for the backend chat endpoint.

## Deployment model

1. Keep **runtime code** in this public repo.
2. Keep **study-specific prompts, QID wiring, and treatment logic** in a private study repo.
3. Keep **all model keys** on a backend service, never in Qualtrics JavaScript.

## Usage

1. Load `qualtrics-chat-runtime.js` into your Qualtrics question JS.
2. Define `window.VOXFLOW_QUALTRICS_CONFIG` for that question (see example file).
3. Point `chatEndpoint` at your backend proxy.
4. Save conversation transcript into an embedded field (e.g., `convo_history`).
