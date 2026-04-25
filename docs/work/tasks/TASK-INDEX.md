# Task Index

Tasks are defined inside the plan files. This index maps each task ID to its owning plan.

## PLAN-001: Project Foundation

- TASK-001: Initialize TypeScript T3 Monorepo
- TASK-002: Create Shared Package Skeletons
- TASK-003: Add Worker App Skeleton
- TASK-004: Standardize Test, Lint, Format, and Typecheck Commands
- TASK-005: Record Foundation Implementation Notes

## PLAN-002: Data, Config, and Jobs

- TASK-006: Define Shared Domain Schemas
- TASK-007: Implement Drizzle Schema and Migrations
- TASK-008: Implement Repository Layer
- TASK-009: Implement YAML Config Loader
- TASK-010: Implement DB-Backed Job Service
- TASK-011: Connect Worker Runtime to Job Service

## PLAN-003: Source Ingestion

- TASK-012: Define Source Adapter Interface
- TASK-013: Implement RSS/Atom Adapter
- TASK-014: Implement Reddit Public Feed Adapter
- TASK-015: Implement Source Refresh Service
- TASK-016: Wire Source Refresh Job Handler

## PLAN-004: Market, LLM, and Enrichment

- TASK-017: Define Market Data Provider Interface
- TASK-018: Implement Yahoo Finance Market Provider
- TASK-019: Define LLM Provider and Enrichment Output Schemas
- TASK-020: Implement AI SDK OpenAI-Compatible LLM Provider
- TASK-021: Implement Company/Ticker Matching Service
- TASK-022: Implement Item Enrichment Service
- TASK-023: Wire Enrichment and Stock Refresh Job Handlers
- TASK-024: Implement Correction Service

## PLAN-005: Web API and UI

- TASK-025: Implement Application Service Facade
- TASK-026: Implement Inbox and Item Services
- TASK-027: Implement tRPC Routers
- TASK-028: Build App Shell and Navigation
- TASK-029: Build Inbox List and Filters
- TASK-030: Build Item Detail Page
- TASK-031: Build Source Status Page
- TASK-032: Add Empty, Loading, and Error States

## PLAN-006: v1 Verification and Release

- TASK-033: Add Local Development Documentation
- TASK-034: Add Seed and Fixture Data for Local UI Testing
- TASK-035: Add End-to-End Manual Verification Script
- TASK-036: Verify Worker and Job Recovery Behavior
- TASK-037: Verify No Out-of-Scope Feature Drift
- TASK-038: Finalize Work Tracking for v1.0 Completion
