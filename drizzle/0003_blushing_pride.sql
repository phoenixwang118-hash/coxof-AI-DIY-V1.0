CREATE TABLE `category_param_rel` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_code` text NOT NULL,
	`param_id` text NOT NULL,
	`required` integer DEFAULT false NOT NULL,
	`filterable` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`spu_code` text NOT NULL,
	`name` text NOT NULL,
	`category_code` text NOT NULL,
	`price` integer NOT NULL,
	`cost` integer NOT NULL,
	`status` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_spu_code_unique` ON `product` (`spu_code`);--> statement-breakpoint
CREATE TABLE `product_param_def` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`input_type` text NOT NULL,
	`unit` text,
	`options_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT '启用' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_param_def_code_unique` ON `product_param_def` (`code`);--> statement-breakpoint
CREATE TABLE `product_param_value` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` text NOT NULL,
	`param_id` text NOT NULL,
	`value_text` text NOT NULL,
	`updated_at` text NOT NULL
);
