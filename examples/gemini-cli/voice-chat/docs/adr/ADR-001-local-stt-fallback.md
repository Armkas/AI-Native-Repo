# ADR-001: On-device recognition as the fallback for remote speech-to-text

- **Status**: Accepted

## Context

Remote speech-to-text is more accurate, but voice commands are used while driving and walking, where the network drops often.
A user who speaks and gets nothing back stops trusting the feature.

## Decision

`VoiceService` tries the remote recognizer first and, on any failure, the on-device recognizer. Callers see one error type, `VoiceError`, only when both fail.

## Alternatives rejected

- **Retry the remote call** — adds seconds of latency exactly when the network is worst.
- **Queue and transcribe later** — a voice command answered minutes later is useless.
- **On-device only** — measurably lower accuracy for longer sentences.

## Consequences

- The fallback is deliberate complexity: do not "simplify" `VoiceService` to a single recognizer.
- Protected by INV-VOICE-002 and its tests. Revisit if on-device accuracy matches the remote provider.
