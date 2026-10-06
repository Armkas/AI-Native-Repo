import XCTest
@testable import Voice

/// Test names carry the invariant IDs from docs/invariants/voice_invariants.md,
/// so `grep -r INV_VOICE_002` shows how each rule is enforced.
final class VoiceServiceTests: XCTestCase {
    private struct ProviderDown: Error {}

    private struct StubRecognizer: SpeechRecognizer {
        let result: Result<String, Error>
        func recognize(audioFileURL: URL) async throws -> String { try result.get() }
    }

    private func makeRecording() throws -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(UUID().uuidString).m4a")
        try Data([0x00]).write(to: url)
        return url
    }

    func test_INV_VOICE_001_continuousListeningEndsAfter20SecondsOfSilence() {
        let policy = ContinuousListeningPolicy()
        XCTAssertFalse(policy.shouldEnd(silenceDuration: 19.9))
        XCTAssertTrue(policy.shouldEnd(silenceDuration: 20))
    }

    func test_INV_VOICE_002_remoteFailureFallsBackToLocalRecognition() async throws {
        let service = VoiceService(remote: StubRecognizer(result: .failure(ProviderDown())),
                                   local: StubRecognizer(result: .success("turn left")))
        let transcript = try await service.transcribe(audioFileURL: try makeRecording())
        XCTAssertEqual(transcript, "turn left")
    }

    func test_INV_VOICE_002_providerErrorsAreMappedToVoiceError() async throws {
        let service = VoiceService(remote: StubRecognizer(result: .failure(ProviderDown())),
                                   local: StubRecognizer(result: .failure(ProviderDown())))
        do {
            _ = try await service.transcribe(audioFileURL: try makeRecording())
            XCTFail("expected VoiceError.recognitionFailed")
        } catch let error as VoiceError {
            XCTAssertEqual(error, .recognitionFailed)
        }
    }

    func test_INV_VOICE_003_recordingIsDeletedAfterSuccess() async throws {
        let recording = try makeRecording()
        let service = VoiceService(remote: StubRecognizer(result: .success("hello")),
                                   local: StubRecognizer(result: .failure(ProviderDown())))
        _ = try await service.transcribe(audioFileURL: recording)
        XCTAssertFalse(FileManager.default.fileExists(atPath: recording.path))
    }

    func test_INV_VOICE_003_recordingIsDeletedAfterFailure() async throws {
        let recording = try makeRecording()
        let service = VoiceService(remote: StubRecognizer(result: .failure(ProviderDown())),
                                   local: StubRecognizer(result: .failure(ProviderDown())))
        _ = try? await service.transcribe(audioFileURL: recording)
        XCTAssertFalse(FileManager.default.fileExists(atPath: recording.path))
    }
}
