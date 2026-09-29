# 🏆 Golden Feature Template (golden_feature_template.md)

> [!IMPORTANT]
> **Core Agent Directive**:
> When adding or refactoring a business feature module in this repository, **you must strictly follow this template's directory layout and layer separation**, rather than inventing novel runtime abstractions.

---

## 1. Standard Physical Directory Layout

Taking a business feature `FeatureName` as an example, the canonical structure is:

```text
features/<FeatureName>/
├── Interface/                          # 1. Core protocols and contracts (Agent reads first)
│   └── <FeatureName>ServiceProtocol.*  # Declares public methods, parameters, return types, errors
│
├── Implementation/                     # 2. Business orchestration and data logic
│   ├── <FeatureName>Manager.*          # State management and business flow
│   └── <FeatureName>Repository.*       # IO operations (API network calls / DB queries)
│
└── Views/                              # 3. Presentation layer (Rendering and user events only)
    ├── <FeatureName>View.*             # Main feature view / screen
    └── Components/                     # Local subcomponents private to this feature
```

---

## 2. Three-Layer Separation Code Patterns

### Step 1: Abstract Protocol Definition (`Interface/`)
> **Principle**: Only declare "What" the module can do, with zero implementation details. Keep files compact so agents can grasp module capabilities within dozens of lines.

```typescript
// Example: TypeScript Interface Contract
export interface IFeatureItem {
  id: string;
  title: string;
  createdAt: number;
}

export interface IFeatureService {
  /** Fetch list of feature items */
  getItems(): Promise<IFeatureItem[]>;

  /** Execute a business action */
  executeAction(itemId: string, payload: Record<string, unknown>): Promise<boolean>;
}
```

```swift
// Example: Swift Protocol Contract
import Foundation

public protocol FeatureManagerProtocol: ObservableObject {
    var items: [FeatureItem] { get }
    var isLoading: Bool { get }
    var errorMessage: String? { get }

    func fetchItems() async throws
    func executeAction(itemId: String) async -> Result<Bool, Error>
}
```

### Step 2: Business Implementation & Orchestration (`Implementation/`)
> **Principle**: Implements the interface defined in Step 1. Encapsulates network requests, database IO, and state transitions.

```typescript
import { IFeatureService, IFeatureItem } from "../Interface/IFeatureService";

export class FeatureService implements IFeatureService {
  constructor(private readonly apiClient: HttpClient) {}

  async getItems(): Promise<IFeatureItem[]> {
    return await this.apiClient.get<IFeatureItem[]>("/api/features");
  }

  async executeAction(itemId: string, payload: Record<string, unknown>): Promise<boolean> {
    const res = await this.apiClient.post(`/api/features/${itemId}/action`, payload);
    return res.status === 200;
  }
}
```

### Step 3: Presentation Layer (`Views/`)
> **Principle**: Views depend strictly on the abstract Interface or ViewModel/Manager. Never write raw network requests or complex data parsing algorithms directly inside View files.

---

## 📋 3. Feature Acceptance Checklist

Whenever creating or refactoring a Feature, cross-check against this list:

1. [ ] **Interface First**: Declared complete protocols and data types in `Interface/`?
2. [ ] **Zero Magic Literals**: Extracted all business thresholds, limits, and statuses into configuration/dictionaries?
3. [ ] **Closed-Loop Verification**: Ran typecheck and build commands with 0 errors?
4. [ ] **Map & Index Registration**:
   - [ ] Registered feature in `docs/PROJECT_MAP.md`;
   - [ ] Registered interface path in `.agents/context-index.md`;
   - [ ] Documented domain concepts in `docs/domains/` (if applicable).
