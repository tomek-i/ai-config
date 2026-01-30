# Prompt: Analyze & Improve Software Architecture

**Goal:** Evaluate current architecture, identify issues, and suggest improvements for better scalability, maintainability, and performance.

## Architecture Assessment
### Structural Analysis
- **Component boundaries:** Identify clear separation of concerns and responsibilities
- **Dependency flow:** Map how components interact and depend on each other
- **Data flow:** Trace how data moves through the system
- **Layering:** Evaluate the effectiveness of architectural layers (presentation, business, data)

### Quality Attributes
- **Scalability:** How well the system handles increased load
- **Maintainability:** Ease of making changes and adding features
- **Performance:** Response times, throughput, resource utilization
- **Security:** Authentication, authorization, data protection
- **Reliability:** Error handling, fault tolerance, recovery

## Common Architecture Patterns
- **Monolith vs Microservices:** Evaluate trade-offs for current needs
- **Event-driven vs Request-response:** Communication patterns and their implications
- **Layered architecture:** Proper separation and dependency management
- **Domain-driven design:** Bounded contexts and ubiquitous language

## Improvement Recommendations
### Short-term Fixes
- Remove circular dependencies
- Extract reusable components
- Improve error handling patterns
- Standardize interfaces and contracts

### Long-term Enhancements
- Modularize large components
- Introduce design patterns where appropriate
- Improve testability through dependency injection
- Consider caching strategies and performance optimizations

## Documentation & Communication
- Create architecture diagrams showing component relationships
- Document decision rationale and trade-offs
- Define coding standards and conventions
- Establish guidelines for future architectural changes
