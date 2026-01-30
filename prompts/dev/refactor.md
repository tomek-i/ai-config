# Prompt: Refactor Code for Quality & Maintainability

**Goal:** Improve code structure, readability, and maintainability while preserving exact behavior and functionality.

## Refactoring Principles
### Preserve Behavior
- Ensure the refactored code produces identical results
- Maintain all side effects and edge case handling
- Keep the same public interface and contracts
- Verify with existing tests or create new ones if needed

### Improve Readability
- Use descriptive, meaningful names for variables, functions, and classes
- Follow consistent naming conventions throughout the codebase
- Write self-documenting code that reduces the need for comments
- Structure code to follow logical flow and intent

## Code Quality Improvements
### Structure & Organization
- Extract complex logic into well-named functions
- Group related code together and separate unrelated concerns
- Reduce nesting levels through early returns and guard clauses
- Apply single responsibility principle to functions and classes

### Eliminate Code Smells
- Remove duplicate code (DRY principle)
- Replace magic numbers/strings with named constants
- Eliminate long parameter lists through objects or configuration
- Break down large functions into smaller, focused ones

### Design Patterns & Principles
- Apply SOLID principles where appropriate
- Use dependency injection for better testability
- Implement proper error handling strategies
- Consider design patterns for recurring problems

## Technical Improvements
### Performance Considerations
- Optimize algorithms without changing behavior
- Remove unnecessary computations or redundant operations
- Consider memory usage and resource management
- Optimize database queries and API calls if present

### Maintainability Enhancements
- Add type annotations or improve existing ones
- Improve error messages and logging
- Make code more testable through better structure
- Update documentation and comments where necessary

## Validation Checklist
- All existing tests still pass
- No new bugs or regressions introduced
- Code is more readable and maintainable
- Performance has not degraded
- Team coding standards are followed

