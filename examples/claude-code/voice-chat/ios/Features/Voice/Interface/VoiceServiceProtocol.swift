import Foundation

/// The only errors callers of the Voice feature see. Provider-specific errors never cross this boundary.
public enum VoiceError: Error, Equatable {
    case recognitionFailed
}

/// Converts a recorded audio file into text.
///
/// Contract (docs/domains/voice.md):
/// - Input: a temporary recording. The service deletes it before returning, whatever the outcome (INV-VOICE-003).
/// - Output: the transcript.
/// - Errors: only `VoiceError`; provider errors are mapped at this boundary.
/// - Fallback: when the remote recognizer fails, the on-device recognizer is used (INV-VOICE-002).
/// - Side effects: never executes user commands, never keeps raw audio.
public protocol VoiceServiceProtocol {
    func transcribe(audioFileURL: URL) async throws -> String
}

/// One speech-to-text engine: a remote provider or the on-device recognizer.
/// Concrete engines live in infrastructure code, outside this feature.
public protocol SpeechRecognizer {
    func recognize(audioFileURL: URL) async throws -> String
}
