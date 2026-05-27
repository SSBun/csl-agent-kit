You are analyzing the data model of a software project. Your task is to document all data entities, their relationships, and the storage strategy.

## Target Project
- Path: {{PROJECT_PATH}}
- Detected tech stack: {{TECH_STACK}}

## Context
Read these reports first for context:
- {{PROJECT_PATH}}/docs/project-structure.md
- {{PROJECT_PATH}}/docs/dependencies.md

## Instructions

1. **Identify data storage backends**:
   - SQL databases (PostgreSQL, MySQL, SQLite)
   - NoSQL databases (MongoDB, DynamoDB, Firestore)
   - Key-value stores (Redis)
   - Search engines (Elasticsearch)
   - File storage

2. **Find data model definitions**:
   - ORM models (ActiveRecord, SQLAlchemy, Prisma, TypeORM, GORM, etc.)
   - Migration files (schema evolution)
   - Schema definitions (GraphQL, OpenAPI, Protobuf)
   - Raw SQL schemas

3. **For each entity/table**, document:
   - Name and purpose
   - Columns/fields with types
   - Constraints (PK, FK, NOT NULL, UNIQUE, CHECK)
   - Indexes
   - Relationships to other entities

4. **Map entity relationships**:
   - Draw an ER diagram (ASCII or Mermaid)
   - Identify 1:1, 1:N, N:M relationships
   - Note join tables

5. **Analyze migrations**:
   - Migration tool used
   - Schema evolution approach
   - Notable schema changes

6. **Check data validation**:
   - Schema-level constraints
   - Application-level validation rules
   - Input sanitization

## Output Format

Write your analysis using the template at:
{{SKILL_PATH}}/templates/data-model.md

Save the filled template to:
{{PROJECT_PATH}}/docs/data-model.md

## Rules
- Read-only. Do not modify any files.
- Do not execute database queries against production databases.
- If migration files exist, infer schema from them rather than connecting to a database.
