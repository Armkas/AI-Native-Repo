import Foundation

/// Default `VoiceServiceProtocol`: remote recognition first, on-device recognition as fallback.
/// Read the protocol and docs/domains/voice.md first; drill down here only for a bug or a change in this behavior.
public final class VoiceService: VoiceServiceProtocol {
    private let remote: SpeechRecognizer
    private let local: SpeechRecognizer
    private let fileManager: FileManager

    public init(remote: SpeechRecognizer, local: SpeechRecognizer, fileManager: FileManager = .default) {
        self.remote = remote
        self.local = local
        self.fileManager = fileManager
    }

    public func transcribe(audioFileURL: URL) async throws -> String {
        // INV-VOICE-003: raw audio never outlives this call, whatever the outcome.
        defer { try? fileManager.removeItem(at: audioFileURL) }
        do {
            return try await remote.recognize(audioFileURL: audioFileURL)
        } catch {
            // INV-VOICE-002: a remote failure falls back to on-device recognition (ADR-001).
            do {
                return try await local.recognize(audioFileURL: audioFileURL)
            } catch {
                throw VoiceError.recognitionFailed
            }
        }
    }
}
