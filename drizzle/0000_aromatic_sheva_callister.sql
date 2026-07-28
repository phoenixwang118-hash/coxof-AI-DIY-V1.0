CREATE TABLE `admin_ai_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`model` text NOT NULL,
	`task` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`requests_today` integer DEFAULT 0 NOT NULL,
	`success_rate` integer DEFAULT 100 NOT NULL,
	`cost_today` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`tier` text NOT NULL,
	`status` text NOT NULL,
	`order_count` integer DEFAULT 0 NOT NULL,
	`total_spent` integer DEFAULT 0 NOT NULL,
	`joined_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_customers_email_unique` ON `admin_customers` (`email`);--> statement-breakpoint
CREATE TABLE `admin_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`product_name` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text NOT NULL,
	`payment_status` text NOT NULL,
	`production_status` text NOT NULL,
	`shipping_status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_products` (
	`id` text PRIMARY KEY NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`price` integer NOT NULL,
	`cost` integer NOT NULL,
	`status` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_products_sku_unique` ON `admin_products` (`sku`);--> statement-breakpoint
CREATE TABLE `admin_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
