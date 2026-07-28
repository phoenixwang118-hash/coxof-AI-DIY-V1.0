CREATE UNIQUE INDEX `category_param_unique` ON `category_param_rel` (`category_code`,`param_id`);--> statement-breakpoint
CREATE INDEX `category_param_template_idx` ON `category_param_rel` (`category_code`,`sort_order`);--> statement-breakpoint
CREATE INDEX `product_category_idx` ON `product` (`category_code`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_param_value_unique` ON `product_param_value` (`product_id`,`param_id`);--> statement-breakpoint
CREATE INDEX `product_param_filter_idx` ON `product_param_value` (`param_id`,`value_text`);