# Prompt: Generate Comprehensive Unit Tests

**Goal:** Create robust, maintainable unit tests that thoroughly validate code behavior across different scenarios and edge cases.

## Test Coverage Strategy
- **Happy path:** Test normal expected behavior with valid inputs
- **Edge cases:** Boundary values, empty/null inputs, maximum/minimum values
- **Error conditions:** Invalid inputs, exceptions, failure scenarios
- **Integration points:** Test interactions with dependencies, databases, APIs

## Test Structure Guidelines
- Use descriptive test names that explain WHAT is being tested and WHY
- Arrange-Act-Assert pattern: setup → execute → verify
- One assertion per test when possible, or related assertions grouped
- Independent tests that don't rely on execution order

## Mocking & Isolation
- Mock external dependencies (databases, APIs, file systems)
- Use test doubles for complex objects or slow operations
- Verify interactions with mocks when behavior depends on them
- Keep mocks simple and focused on the test scenario

## Code Quality
- Follow the same coding standards as the production code
- Extract common setup into helper methods or fixtures
- Use constants for magic numbers and test data
- Keep tests readable and maintainable

## Framework-Specific Notes
- Adapt to the appropriate testing framework for the language
- Use framework best practices (e.g., pytest fixtures, Jest describe/it, JUnit @Test)
- Leverage framework-specific assertions and matchers when beneficial
