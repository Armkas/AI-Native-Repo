import Foundation

/// Decides when continuous listening ends. Pure logic with no timers, so it is testable without a device.
public struct ContinuousListeningPolicy: Equatable {
    /// INV-VOICE-001: continuous mode ends after this much uninterrupted silence. Change only together with the invariant.
    public static let silenceTimeout: TimeInterval = 20

    public init() {}

    public func shouldEnd(silenceDuration: TimeInterval) -> Bool {
        silenceDuration >= Self.silenceTimeout
    }
}
