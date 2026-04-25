import { z } from 'zod';

export const sourceTypes = ['rss', 'reddit'] as const;
export const itemReadStates = ['unread', 'read'] as const;
export const enrichmentStates = [
  'pending',
  'complete',
  'needs_review',
  'failed',
] as const;
export const companyMatchStatuses = [
  'validated',
  'needs_review',
  'rejected',
] as const;
export const relationshipTypes = [
  'mentioned',
  'competitor',
  'customer',
  'supplier',
] as const;
export const jobTypes = [
  'source.refresh',
  'item.enrich',
  'stock.refresh',
] as const;
export const jobStates = [
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
] as const;

export type SourceType = (typeof sourceTypes)[number];
export type ItemReadState = (typeof itemReadStates)[number];
export type EnrichmentState = (typeof enrichmentStates)[number];
export type CompanyMatchStatus = (typeof companyMatchStatuses)[number];
export type RelationshipType = (typeof relationshipTypes)[number];
export type JobType = (typeof jobTypes)[number];
export type JobState = (typeof jobStates)[number];

export const sourceTypeSchema = z.enum(sourceTypes);
export const itemReadStateSchema = z.enum(itemReadStates);
export const enrichmentStateSchema = z.enum(enrichmentStates);
export const companyMatchStatusSchema = z.enum(companyMatchStatuses);
export const relationshipTypeSchema = z.enum(relationshipTypes);
export const jobTypeSchema = z.enum(jobTypes);
export const jobStateSchema = z.enum(jobStates);
