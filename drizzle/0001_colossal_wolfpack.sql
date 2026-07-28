CREATE TABLE `user_cart` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`product_id` integer NOT NULL,
	`project_name` text NOT NULL,
	`size` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`design_json` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`product_id` integer NOT NULL,
	`project_name` text NOT NULL,
	`size` text NOT NULL,
	`quantity` integer NOT NULL,
	`total` integer NOT NULL,
	`status` text NOT NULL,
	`address_json` text NOT NULL,
	`shipping_method` text NOT NULL,
	`payment_method` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`owner_email` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`workspace_name` text NOT NULL,
	`market` text NOT NULL,
	`address_json` text NOT NULL,
	`plan` text NOT NULL,
	`credits_used` integer NOT NULL,
	`credits_limit` integer NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`name` text NOT NULL,
	`product_id` integer NOT NULL,
	`prompt` text NOT NULL,
	`model` text NOT NULL,
	`design_json` text NOT NULL,
	`updated_at` text NOT NULL
);
