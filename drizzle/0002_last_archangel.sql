CREATE TABLE `admin_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`object_key` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_content` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content_type` text NOT NULL,
	`status` text NOT NULL,
	`summary` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`invited_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_members_email_unique` ON `admin_members` (`email`);