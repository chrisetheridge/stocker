CREATE TABLE `enrichment_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`source_item_id` text NOT NULL,
	`state` text NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`error_message` text,
	`raw_llm_output_json` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`source_item_id`) REFERENCES `source_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `item_companies` (
	`id` text PRIMARY KEY NOT NULL,
	`source_item_id` text NOT NULL,
	`company_name` text NOT NULL,
	`ticker` text,
	`exchange` text,
	`relationship_type` text NOT NULL,
	`relevance_explanation` text NOT NULL,
	`confidence` real NOT NULL,
	`match_status` text NOT NULL,
	`evidence_text` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`source_item_id`) REFERENCES `source_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `item_companies_source_item_idx` ON `item_companies` (`source_item_id`);--> statement-breakpoint
CREATE INDEX `item_companies_ticker_idx` ON `item_companies` (`ticker`);--> statement-breakpoint
CREATE TABLE `item_enrichments` (
	`id` text PRIMARY KEY NOT NULL,
	`source_item_id` text NOT NULL,
	`state` text NOT NULL,
	`summary` text,
	`model_provider` text,
	`model_name` text,
	`prompt_version` text,
	`completed_at` text,
	`error_message` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`source_item_id`) REFERENCES `source_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `item_enrichments_source_item_unique` ON `item_enrichments` (`source_item_id`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`state` text DEFAULT 'queued' NOT NULL,
	`payload_json` text NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`run_after` text NOT NULL,
	`locked_at` text,
	`locked_by` text,
	`last_error_message` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `jobs_state_idx` ON `jobs` (`state`);--> statement-breakpoint
CREATE INDEX `jobs_run_after_idx` ON `jobs` (`run_after`);--> statement-breakpoint
CREATE TABLE `source_items` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`external_id` text NOT NULL,
	`canonical_url` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`author` text,
	`published_at` text,
	`fetched_at` text NOT NULL,
	`source_metadata_json` text NOT NULL,
	`read_state` text DEFAULT 'unread' NOT NULL,
	`saved_for_research` integer DEFAULT false NOT NULL,
	`enrichment_state` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_items_source_external_unique` ON `source_items` (`source_id`,`external_id`);--> statement-breakpoint
CREATE INDEX `source_items_enrichment_state_idx` ON `source_items` (`enrichment_state`);--> statement-breakpoint
CREATE INDEX `source_items_saved_for_research_idx` ON `source_items` (`saved_for_research`);--> statement-breakpoint
CREATE INDEX `source_items_read_state_idx` ON `source_items` (`read_state`);--> statement-breakpoint
CREATE INDEX `source_items_published_at_idx` ON `source_items` (`published_at`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`config_json` text NOT NULL,
	`last_fetched_at` text,
	`last_success_at` text,
	`last_error_at` text,
	`last_error_message` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sources_type_idx` ON `sources` (`type`);--> statement-breakpoint
CREATE TABLE `stock_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`ticker` text NOT NULL,
	`exchange` text,
	`company_name` text,
	`price` real,
	`currency` text,
	`daily_change` real,
	`daily_change_percent` real,
	`market_cap` real,
	`sector` text,
	`provider` text NOT NULL,
	`captured_at` text NOT NULL,
	`stale_after` text NOT NULL,
	`raw_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `stock_snapshots_ticker_idx` ON `stock_snapshots` (`ticker`);--> statement-breakpoint
CREATE TABLE `ticker_corrections` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`correct_ticker` text NOT NULL,
	`correct_exchange` text,
	`notes` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ticker_corrections_unique` ON `ticker_corrections` (`company_name`,`correct_ticker`,`correct_exchange`);