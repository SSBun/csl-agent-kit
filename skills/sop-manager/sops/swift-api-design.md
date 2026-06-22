---
name: swift-api-design
version: 1.0
owner: Swift / Apple
scope: global
description: Swift API design guidelines for naming, parameters, and argument labels
globs:
  - "**/*.swift"
alwaysApply: false
---

# Swift API Design Guidelines

**Version:** 1.0
**Owner:** Swift / Apple
**Last Updated:** 2026-06-05

## Purpose

Authoritative rules for designing Swift APIs. Apply to every public declaration, method, property, and type name in Swift code.

## Fundamentals

1. **Clarity at point of use** is the primary goal. Entities are declared once but used repeatedly. Always evaluate a use case, not just the declaration.
2. **Clarity > brevity.** Compact code is a non-goal. Brevity is a side-effect of the type system, not a design target.
3. **Write a documentation comment for every declaration.** If you can't describe it simply, redesign the API.
   - Use Swift's Markdown dialect
   - Begin with a summary (single sentence fragment, ending with period)
   - Functions/methods: describe what it *does* and *returns*
   - Subscripts: describe what it *accesses*
   - Initializers: describe what it *creates*
   - Other declarations: describe what it *is*
   - Use recognized symbol command keywords: `Parameter`, `Returns`, `Throws`, `Complexity`, `Note`, `SeeAlso`, etc.

## Naming

### Promote Clear Usage

4. **Include all words needed to avoid ambiguity.**
   ```swift
   employees.remove(at: x)   // ✅ clear: removes element at position
   employees.remove(x)        // ❌ unclear: removing x? or at x?
   ```

5. **Omit needless words.** Drop words that repeat type information already known at the call site.
   ```swift
   remove(_ member: Element)       // ✅
   removeElement(_ member: Element) // ❌ "Element" adds nothing
   ```

6. **Name by role, not type.**
   ```swift
   var greeting = "Hello"                    // ✅
   var string = "Hello"                      // ❌
   func restock(from supplier: WidgetFactory) // ✅
   func restock(from widgetFactory: WidgetFactory) // ❌
   ```

7. **Compensate for weak type information.** When parameter type is `Any`, `AnyObject`, `NSObject`, `Int`, or `String`, add a role noun.
   ```swift
   func addObserver(_ observer: NSObject, forKeyPath path: String) // ✅
   func add(_ observer: NSObject, for keyPath: String)             // ❌
   ```

### Strive for Fluent Usage

8. **Prefer names that form grammatical English phrases.**
   ```swift
   x.insert(y, at: z)         // ✅ "x, insert y at z"
   x.subviews(havingColor: y) // ✅ "x's subviews having color y"
   ```

9. **Begin factory methods with `make`.** e.g. `x.makeIterator()`.

10. **First argument of init/factory calls should NOT form a phrase with the base name.**
    ```swift
    Color(red: 32, green: 64, blue: 128)        // ✅
    Color(havingRGBValuesRed: 32, green: 64, andBlue: 128) // ❌
    ```

11. **Name by side-effects:**
    - No side-effects → noun phrase: `x.distance(to: y)`, `i.successor()`
    - Side-effects → imperative verb: `print(x)`, `x.sort()`, `x.append(y)`

12. **Mutating/nonmutating pairs:**
    - Verb-based: imperative for mutating, "ed"/"ing" suffix for nonmutating
      ```swift
      x.reverse()       // mutating
      let y = x.reversed()  // nonmutating
      ```
    - Noun-based: noun for nonmutating, "form" prefix for mutating
      ```swift
      x = y.union(z)    // nonmutating
      y.formUnion(z)    // mutating
      ```

13. **Boolean methods/properties read as assertions:** `x.isEmpty`, `line1.intersects(line2)`.

14. **Protocols:** "what something is" → noun (`Collection`). "capability" → `-able`, `-ible`, `-ing` (`Equatable`, `ProgressReporting`).

15. **Types, properties, variables, constants** → read as nouns.

### Use Terminology Well

16. **Avoid obscure terms** when a common word works equally well.

17. **Stick to established meaning** for terms of art. Don't surprise experts or confuse beginners.

18. **Avoid abbreviations.** If used, meaning must be easily found by web search.

19. **Embrace precedent.** Use `Array` not `List`. Use `sin(x)` not `verticalPositionOnUnitCircleAtOriginOfEndOfRadiusWithAngle(x)`.

## Conventions

### General

20. **Document complexity** of any computed property that is not O(1).

21. **Prefer methods and properties over free functions.** Free functions only when: no obvious `self`, unconstrained generic, or established domain notation.

22. **Follow case conventions.** Types/protocols → `UpperCamelCase`. Everything else → `lowerCamelCase`.
    - Common acronyms: uniformly up- or down-cased: `utf8`, `UTF8`, `ASCII`, `SMTP`
    - Other acronyms: treat as ordinary words: `radar`, `scuba`

23. **Methods can share a base name** when they share the same basic meaning or operate in distinct domains. Avoid overloading on return type.

### Parameters

24. **Choose parameter names for documentation.** They don't appear at call site but explain in doc comments.
    ```swift
    func filter(_ predicate: (Element) -> Bool) -> [Element]     // ✅
    func filter(_ includedInResult: (Element) -> Bool) -> [Element] // ❌
    ```

25. **Use defaulted parameters** to simplify common uses. One method with defaults > method family.

26. **Defaulted parameters go at the end** of the parameter list.

27. **Prefer `#fileID`** in production APIs. Use `#filePath` only in test helpers/scripts. Use `#file` for Swift ≤5.2 compatibility.

### Argument Labels

28. **Omit all labels** when arguments can't be distinguished: `min(number1, number2)`.

29. **Omit first label** in value-preserving type conversions: `Int64(someUInt32)`. Use a label for narrowing conversions: `init(truncating source: UInt64)`.

30. **First argument forms a prepositional phrase** → give it a label starting at the preposition: `x.removeBoxes(havingLength: 12)`.

31. **First argument forms a grammatical phrase** → omit its label: `x.addSubview(y)`.

32. **Label all other arguments.**

## Special Instructions

33. **Label tuple members and name closure parameters** in your API.

34. **Take care with unconstrained polymorphism** (`Any`, `AnyObject`, unconstrained generics). Avoid ambiguous overload sets. Name overloads explicitly: `append(contentsOf:)` vs `append(_:)`.

## References

- [Swift API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/)
