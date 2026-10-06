# Voice Invariants

> Rules that hold whatever the implementation. Change one only when the product requirement changes —
> and then change its test in the same commit. Test names carry the ID with underscores (`INV_VOICE_002`).

- **INV-VOICE-001 — Silence ends continuous mode**: after 20 seconds of uninterrupted silence, continuous listening ends.
  Enforced by `test_INV_VOICE_001_continuousListeningEndsAfter20SecondsOfSilence`.
- **INV-VOICE-002 — Recognition survives a network failure**: when the remote recognizer fails, the on-device recognizer is used; callers only ever see `VoiceError`.
  Enforced by `test_INV_VOICE_002_remoteFailureFallsBackToLocalRecognition`, `test_INV_VOICE_002_providerErrorsAreMappedToVoiceError`.
- **INV-VOICE-003 — No raw audio is kept**: a recording is deleted before `transcribe` returns, on success and on failure.
  Enforced by `test_INV_VOICE_003_recordingIsDeletedAfterSuccess`, `test_INV_VOICE_003_recordingIsDeletedAfterFailure`.
