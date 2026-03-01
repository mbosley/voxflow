# 🎙️ voxflow

Audio-first chatbot toolkit for transcription-aware, action-oriented conversational workflows.

## Why this exists

This repo is the public, reusable core of a larger production workflow. It is designed to be clean, modular, and easy to adopt in other projects.

## Current scope

- Audio note ingestion patterns
- Transcription adapters and confidence tagging
- Context-aware action extraction
- Conversation-safe response orchestration
- Survey chatbot adapters (including Qualtrics runtime patterns)

## Near-term roadmap

1. Ship a stable ingestion/transcription interface
2. Add reference pipelines for iMessage/WhatsApp-style inputs
3. Publish eval harness for transcript quality + action extraction
4. Add lightweight demo app + CLI

## Related work

- Private implementation roots: qualtrics-audio-chatbot, ops/cos-gateway (integration layer).

## Qualtrics adapter

A secure Qualtrics deployment template now lives in:

- `adapters/qualtrics/README.md`
- `adapters/qualtrics/qualtrics-chat-runtime.js`
- `adapters/qualtrics/qualtrics-config.example.js`
- `adapters/qualtrics/server-contract.md`

Use this split:
- Public repo: reusable runtime/UI/orchestration code
- Private study repo: prompts, QID mappings, treatment scripts
- Backend service: model keys + provider calls

## Status

Active build-out. Initial public baseline is focused on clean APIs, examples, and strong docs.

## License

MIT
