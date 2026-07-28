import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const adminOrders = sqliteTable("admin_orders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  productName: text("product_name").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
  paymentStatus: text("payment_status").notNull(),
  productionStatus: text("production_status").notNull(),
  shippingStatus: text("shipping_status").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const adminCustomers = sqliteTable("admin_customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  tier: text("tier").notNull(),
  status: text("status").notNull(),
  orderCount: integer("order_count").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  joinedAt: text("joined_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const adminProducts = sqliteTable("admin_products", {
  id: text("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  cost: integer("cost").notNull(),
  status: text("status").notNull(),
  stock: integer("stock").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

// Canonical SPU + EAV catalog model. `admin_products` remains temporarily for
// backwards-compatible migration of existing demo records.
export const product = sqliteTable("product", {
  id: text("id").primaryKey(),
  spuCode: text("spu_code").notNull().unique(),
  name: text("name").notNull(),
  categoryCode: text("category_code").notNull(),
  price: integer("price").notNull(),
  cost: integer("cost").notNull(),
  status: text("status").notNull(),
  stock: integer("stock").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("product_category_idx").on(table.categoryCode, table.status),
]);

export const productParamDef = sqliteTable("product_param_def", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  inputType: text("input_type").notNull(),
  unit: text("unit"),
  optionsJson: text("options_json").notNull().default("[]"),
  status: text("status").notNull().default("启用"),
  updatedAt: text("updated_at").notNull(),
});

export const categoryParamRel = sqliteTable("category_param_rel", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryCode: text("category_code").notNull(),
  paramId: text("param_id").notNull(),
  required: integer("required", { mode: "boolean" }).notNull().default(false),
  filterable: integer("filterable", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [
  uniqueIndex("category_param_unique").on(table.categoryCode, table.paramId),
  index("category_param_template_idx").on(table.categoryCode, table.sortOrder),
]);

export const productParamValue = sqliteTable("product_param_value", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: text("product_id").notNull(),
  paramId: text("param_id").notNull(),
  valueText: text("value_text").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("product_param_value_unique").on(table.productId, table.paramId),
  index("product_param_filter_idx").on(table.paramId, table.valueText),
]);

export const adminAiProviders = sqliteTable("admin_ai_providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  model: text("model").notNull(),
  task: text("task").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  requestsToday: integer("requests_today").notNull().default(0),
  successRate: integer("success_rate").notNull().default(100),
  costToday: integer("cost_today").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const adminSettings = sqliteTable("admin_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const adminAuditLogs = sqliteTable("admin_audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  detail: text("detail").notNull(),
  createdAt: text("created_at").notNull(),
});

export const adminAssets = sqliteTable("admin_assets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  objectKey: text("object_key").notNull(),
  createdAt: text("created_at").notNull(),
});

export const adminContent = sqliteTable("admin_content", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  contentType: text("content_type").notNull(),
  status: text("status").notNull(),
  summary: text("summary").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const adminMembers = sqliteTable("admin_members", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  status: text("status").notNull(),
  invitedAt: text("invited_at").notNull(),
});

export const userProjects = sqliteTable("user_projects", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  name: text("name").notNull(),
  productId: integer("product_id").notNull(),
  prompt: text("prompt").notNull(),
  model: text("model").notNull(),
  designJson: text("design_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const userCart = sqliteTable("user_cart", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  productId: integer("product_id").notNull(),
  projectName: text("project_name").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  designJson: text("design_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const userOrders = sqliteTable("user_orders", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  productId: integer("product_id").notNull(),
  projectName: text("project_name").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull(),
  addressJson: text("address_json").notNull(),
  shippingMethod: text("shipping_method").notNull(),
  paymentMethod: text("payment_method").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const userProfiles = sqliteTable("user_profiles", {
  ownerEmail: text("owner_email").primaryKey(),
  displayName: text("display_name").notNull(),
  workspaceName: text("workspace_name").notNull(),
  market: text("market").notNull(),
  addressJson: text("address_json").notNull(),
  plan: text("plan").notNull(),
  creditsUsed: integer("credits_used").notNull(),
  creditsLimit: integer("credits_limit").notNull(),
  updatedAt: text("updated_at").notNull(),
});
