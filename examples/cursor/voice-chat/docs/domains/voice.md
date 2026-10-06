# DOMAIN: Voice

## Responsibilities

Recording, speech-to-text and the continuous-listening mode. It is the core of the app's voice interaction.
It does **not** decide what a transcript means: intent handling belongs to the feature that consumes the text.

## Key workflow

Record → transcribe (remote provider, on-device fallback) → hand the transcript to the caller → delete the recording.

## Rules

The rules that must never break live in [voice_invariants.md](../invariants/voice_invariants.md):
INV-VOICE-001 (20 s silence ends continuous mode), INV-VOICE-002 (on-device fallback), INV-VOICE-003 (no raw audio kept).
Why the fallback is on-device rather than a retry: [ADR-001](../adr/ADR-001-local-stt-fallback.md).

## Mappings

- **Interface**: `ios/Features/Voice/Interface/VoiceServiceProtocol.swift` (`VoiceServiceProtocol`, `SpeechRecognizer`, `VoiceError`)
- **Implementation**: `ios/Features/Voice/Application/` (`VoiceService`, `ContinuousListeningPolicy`)
- **Tests**: `ios/Tests/VoiceTests/VoiceServiceTests.swift`
