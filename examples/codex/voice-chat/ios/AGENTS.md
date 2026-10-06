# 🍏 iOS AGENTS.md

> Stack this file with the root `AGENTS.md` when working under `ios/`.

## Runtime architecture

This directory is the **runtime plane**: Feature modules with MVVM / Clean inside each feature.
The AI Context Layer lives in the root `AGENTS.md` and `docs/`.

## Local rules

1. **Feature layout**: `Features/<Name>/Interface/` (protocols and domain errors) → `Application/` (orchestration and policies) → views. Read `Interface/` first.
2. **Dependency inversion at real boundaries**: cross-module dependencies and external engines go through a protocol in `Interface/`. One real capability → one protocol, not a stack of unused adapters.
3. **UI**: SwiftUI. UIKit only when there is no alternative.
4. **Concurrency**: Swift Concurrency (`async/await`, `Task`, `actor`). No completion handlers or GCD in new code.
5. **Tests**: `Tests/<Feature>Tests/`. A test that protects an invariant carries its ID in the name (`test_INV_VOICE_002_…`).
