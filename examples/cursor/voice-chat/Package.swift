// swift-tools-version:5.9
import PackageDescription

// The Voice feature as a plain Swift package, so `swift build` / `swift test` verify it without Xcode.
// The app target depends on this module.
let package = Package(
    name: "VoiceChat",
    platforms: [.macOS(.v13), .iOS(.v16)],
    products: [.library(name: "Voice", targets: ["Voice"])],
    targets: [
        .target(name: "Voice", path: "ios/Features/Voice"),
        .testTarget(name: "VoiceTests", dependencies: ["Voice"], path: "ios/Tests/VoiceTests"),
    ]
)
