# 🎙️ voxflow

Audio-first chatbot toolkit for transcription-aware, action-oriented conversational workflows.

## Why this exists

This repo is the public, reusable core of a larger production workflow. It is designed to be clean, modular, and easy to adopt in other projects.

## Current scope

- Audio note ingestion patterns\n- Transcription adapters and confidence tagging\n- Context-aware action extraction\n- Conversation-safe response orchestration

## Near-term roadmap

1. Ship a stable ingestion/transcription interface\n2. Add reference pipelines for iMessage/WhatsApp-style inputs\n3. Publish eval harness for transcript quality + action extraction\n4. Add lightweight demo app + CLI

## Related work

- Private implementation roots: qualtrics-audio-chatbot, ops/cos-gateway (integration layer).

## Status

Active build-out. Initial public baseline is focused on clean APIs, examples, and strong docs.

## License

MIT
