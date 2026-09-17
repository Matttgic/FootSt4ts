CREATE TABLE `budget` (
	`key` text PRIMARY KEY NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`limit` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cache` (
	`key` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`collected_at` text NOT NULL,
	`expires_at` integer NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE TABLE `entities` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entity_provider` ON `entities` (`kind`,`provider`,`provider_id`);--> statement-breakpoint
CREATE TABLE `locks` (
	`key` text PRIMARY KEY NOT NULL,
	`until` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mappings` (
	`key` text PRIMARY KEY NOT NULL,
	`internal_id` text NOT NULL,
	`evidence` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `observations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_id` text NOT NULL,
	`kind` text NOT NULL,
	`source` text NOT NULL,
	`collected_at` text NOT NULL,
	`reference` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `observations_entity_time` ON `observations` (`entity_id`,`collected_at`);--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`published_at` text NOT NULL,
	`kickoff` text NOT NULL,
	`version` text NOT NULL,
	`payload` text NOT NULL,
	`result` text
);
--> statement-breakpoint
CREATE INDEX `predictions_match` ON `predictions` (`match_id`);