# Qualtrics Chat Endpoint Contract

The Qualtrics runtime in `qualtrics-chat-runtime.js` sends requests to your own backend endpoint.

## Why this exists

- Keeps provider API keys off the client.
- Centralizes moderation, logging, retry policy, and model routing.
- Enables per-study controls without editing core runtime code.

## Request shape

`POST /qualtrics/chat`

```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "userMessage": "latest participant message",
  "isFinalTurn": false,
  "maxTurns": 6,
  "metadata": {
    "responseId": "R_...",
    "surveyId": "SV_...",
    "condition": "treatment_a"
  }
}
```

## Response shape

Return HTTP 200 with one of:

```json
{ "assistantMessage": "..." }
```

or

```json
{ "message": "..." }
```

## Error behavior

- Non-2xx responses are treated as errors in the client.
- Runtime sets the embedded field configured as `apiErrorField` to `"true"` on failure.
- Keep server responses short and deterministic; log full traces server-side.
