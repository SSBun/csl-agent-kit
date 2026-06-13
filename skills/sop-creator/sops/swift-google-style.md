---
name: swift-google-style
version: 1.0
owner: Google
scope: global
description: Google Swift style guide covering formatting, structure, naming conventions, and programming practices
globs:
  - "**/*.swift"
alwaysApply: false
---

# Google Swift Style Guide

**Version:** 1.0
**Owner:** Google
**Last Updated:** 2026-06-08

## Purpose

Formatting, structure, and coding conventions for Swift code. Based on Apple's Swift standard library style with Google-specific additions.

## Source File Basics

### File Naming

1. File named after primary entity: `MyType.swift`
2. Protocol conformance extension: `MyType+MyProtocol.swift`
3. Multiple extensions: `MyType+Additions.swift`
4. Related free functions: descriptive name like `Math.swift`

### Encoding and Whitespace

5. UTF-8 encoding only.
6. Only ASCII space (`U+0020`) for whitespace. No tabs.
7. Use special escape sequences (`\t`, `\n`, `\r`, `\"`, `\'`, `\\`, `\0`) over Unicode escapes.
8. Invisible/control characters always escaped. Combining characters unescaped when attached to a character.
9. Never mix literal Unicode and `\u{????}` escapes in the same string.

## Source File Structure

### Imports

10. Import exactly the modules needed — no transitive reliance.
11. Prefer whole-module imports over individual declarations.
12. Imports are first non-comment tokens, grouped and sorted:

```
import CoreLocation
import UIKit

import func Darwin.C.isatty

@testable import MyModuleUnderTest
```

### Declarations

13. Most files contain one top-level type. Related small types allowed.
14. Use **some logical order** for members — not chronological by date added.
15. Use `// MARK: -` to document grouping.
16. Overloaded declarations appear sequentially with no other code between.

## General Formatting

### Column Limit and Braces

17. 100 character column limit. Exceptions: URLs, imports, generated code.
18. K&R braces: no line break before `{`, break after `{` (except closures/empty blocks `{} {`).
19. Break after `}` only if it terminates a statement. `} else {` on one line.

### Statements

20. No semicolons. Ever.
21. One statement per line. Exception: single-statement blocks (`guard let x else { return }`).

### Line Wrapping

22. If it fits on one line, don't wrap.
23. Comma-delimited lists: all on one line OR each on its own line. No mixing.
24. Continuation line with unbreakable token → same indent as original.
25. Vertically-oriented list → indent +2 from original.
26. Open `{` on same line as final continuation, unless continuation is at +2 indent (then `{` on its own line).

```
public func index<Elements: Collection, Element>(
  of element: Element,
  in collection: Elements
) -> Elements.Index?
where
  Elements.Element == Element,
  Element: Equatable
{
  // ...
}
```

### Whitespace

27. Space between conditional keyword and opening paren: `if (x == 0) {`
28. Space around binary/ternary operators. No space around `.`, `..<`, `...`.
29. Space after comma, not before: `[1, 2, 3]`
30. Space after colon in type annotations, conformances, dictionary types: `let x: Int`, `[String: Int]`
31. Two+ spaces before end-of-line comments: `let x = 5  // reason`
32. No horizontal alignment (except tabular data).

### Blank Lines

33. One blank line between consecutive type members.
34. Optional between single-line stored properties or enum cases.
35. Multiple blank lines allowed but never required.

### Parentheses

36. No parens around top-level expression after `if`/`guard`/`while`/`switch`.
37. Optional grouping parens only when ambiguity is real — don't assume readers memorize precedence.

## Specific Constructs

### Comments

38. Non-doc comments use `//`, never `/* */`.

### Properties

39. Declare variables close to first use.
40. One `let`/`var` per statement (except tuple destructuring).

### Switch

41. Cases at same indent as `switch`. Body indented +2.

```swift
switch order {
case .ascending:
  print("Ascending")
case .descending:
  print("Descending")
}
```

### Enums

42. One `case` per line. Comma form only when no associated values and meaning is obvious.
43. Use `indirect enum` instead of per-case `indirect`.
44. No empty parentheses on cases without associated values: `case empty` not `case empty()`.
45. Cases follow logical order. If none obvious, lexicographic.

### Trailing Closures

46. Don't overload functions differing only by trailing closure label.
47. Multiple closures → all labeled, none trailing.
48. Single closure at end → always trailing closure syntax (except control flow ambiguity).
49. No empty `()` before trailing closure: `.map { $0 * $0 }` not `.map() { $0 * $0 }`.

### Trailing Commas

50. Required in multi-line array/dictionary literals.

### Numeric Literals

51. Use `_` separators for long literals. 3-digit decimal, 4-digit hex, domain-specific grouping.

### Attributes

52. Parameterized attributes: own line, lexicographic order, same indent as declaration.
53. Parameterless attributes: may share line with declaration if no rewrapping needed.

## Naming

54. Follow Apple's Swift API Design Guidelines (see `swift-api-design` SOP).
55. Use access control for hiding, not naming conventions. `_` prefix only for language-limitation workarounds.
56. Identifiers: 7-bit ASCII. Unicode only when domain-appropriate (e.g., Greek letters for math).
57. Init params match stored property names. Use explicit `self.` in assignment.

```swift
public init(name: String, phoneNumber: String) {
  self.name = name
  self.phoneNumber = phoneNumber
}
```

58. Static/class properties not suffixed with type name: `UIColor.red` not `UIColor.redColor`.
59. Global constants: `lowerCamelCase`. No Hungarian notation (`k`, `g`) or `UPPER_SNAKE_CASE`.
60. Delegate methods: first arg is source object (unlabeled). See Apple delegate naming patterns.

## Programming Practices

### Safety

61. Compile without warnings. Deprecation warnings are acceptable exceptions.
62. Avoid sentinel values. Use `Optional` for absent values.
63. Use error types for multiple failure states. `throw` separates valid flow from error flow.
64. `try!` forbidden except in tests or literal-only expressions where failure = programmer error.
65. Force-unwrap/force-cast strongly discouraged. Comment the invariant if unavoidable.
66. Implicitly unwrapped optionals only for UI lifecycle (`@IBOutlet`) or ObjC interop. Minimize footprint.
67. Trapping arithmetic (`+`, `-`, `*`) by default. Masking (`&+`, `&-`, `&*`) only for hash functions, crypto, or documented performance reasons.

### Access and Organization

68. Omit explicit access level when default suffices.
69. No `public extension` — specify per-member.
70. Prefer nesting over naming conventions for scoped types (errors, flags inside owning type).

```swift
class Parser {
  enum Error: Swift.Error {
    case invalidToken(String)
  }
}
```

71. Use caseless `enum` as namespace for constants/helpers.

### Control Flow

72. Prefer `guard` for early exits — eliminates nesting pyramid.
73. `for`-`where` when entire loop body would be single `if`:

```swift
for item in collection where item.hasProperty { ... }
```

74. No bare `fallthrough` — combine cases with commas or ranges.
75. Place `let`/`var` individually before each pattern binding element:

```swift
case .labeled(let label, let value):  // ✅
case let .labeled(label, value):       // ❌
```

### Types and Literals

76. Shorthand types: `[Element]`, `[Key: Value]`, `Wrapped?`. Long form only when compiler requires.
77. `Void` for function-type return types. Omit for `func` declarations. `()` for empty arg lists.
78. Use `as` coercion or type annotation for non-default literal types. Avoid init syntax:

```swift
let x: Int32 = 50          // ✅
let x = 50 as Int32        // ✅
let x = Int32(50)          // ❌ (can overflow)
```

79. No playground literals (`#colorLiteral`, `#imageLiteral`) in production code.

### Operators

80. Avoid defining custom operators. Allowed only with clear domain meaning (e.g., matrix math).
81. Overloading existing operators allowed when semantically equivalent to stdlib uses.

## Documentation Comments

82. Use `///` triple-slash. Never `/** */` block style.
83. Begin with single-sentence summary (not complete sentence — omit "this method").
84. `Parameter` (singular) for one arg. `Parameters` (plural grouped) for multiple.
85. `Returns` and `Throws` tags after parameters. Never empty descriptions.
86. Use Apple's markup: `*italic*`, `**bold**`, `` `code` ``, code fences.
87. Document every `open`/`public` declaration. Exceptions:
    - Self-explanatory enum cases
    - Overrides that don't change behavior
    - Test classes/methods
    - Obvious extensions (`/// Add Equatable conformance`)

## References

- [Google Swift Style Guide](https://google.github.io/swift/)
- [Apple's API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/)
