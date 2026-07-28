import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

type D1Result<T> = { results?: T[] };

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS admin_orders (
    id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, customer_name TEXT NOT NULL,
    product_name TEXT NOT NULL, amount INTEGER NOT NULL, status TEXT NOT NULL,
    payment_status TEXT NOT NULL, production_status TEXT NOT NULL,
    shipping_status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS admin_customers (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    tier TEXT NOT NULL, status TEXT NOT NULL, order_count INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0, joined_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS admin_products (
    id TEXT PRIMARY KEY, sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    category TEXT NOT NULL, price INTEGER NOT NULL, cost INTEGER NOT NULL,
    status TEXT NOT NULL, stock INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS product (
    id TEXT PRIMARY KEY, spu_code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    category_code TEXT NOT NULL, price INTEGER NOT NULL, cost INTEGER NOT NULL,
    status TEXT NOT NULL, stock INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS product_param_def (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE,
    input_type TEXT NOT NULL, unit TEXT, options_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT '启用', updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS category_param_rel (
    id INTEGER PRIMARY KEY AUTOINCREMENT, category_code TEXT NOT NULL,
    param_id TEXT NOT NULL, required INTEGER NOT NULL DEFAULT 0,
    filterable INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE(category_code, param_id)
  )`,
  `CREATE TABLE IF NOT EXISTS product_param_value (
    id INTEGER PRIMARY KEY AUTOINCREMENT, product_id TEXT NOT NULL,
    param_id TEXT NOT NULL, value_text TEXT NOT NULL, updated_at TEXT NOT NULL,
    UNIQUE(product_id, param_id)
  )`,
  `CREATE TABLE IF NOT EXISTS admin_ai_providers (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, model TEXT NOT NULL, task TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1, requests_today INTEGER NOT NULL DEFAULT 0,
    success_rate INTEGER NOT NULL DEFAULT 100, cost_today INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL,
    target TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS admin_assets (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
    mime_type TEXT NOT NULL, size INTEGER NOT NULL, object_key TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS admin_content (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, content_type TEXT NOT NULL,
    status TEXT NOT NULL, summary TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS admin_members (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL, status TEXT NOT NULL, invited_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS admin_orders_status_idx ON admin_orders(status)`,
  `CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON admin_audit_logs(created_at)`,
  `CREATE INDEX IF NOT EXISTS product_category_idx ON product(category_code, status)`,
  `CREATE INDEX IF NOT EXISTS category_param_template_idx ON category_param_rel(category_code, sort_order)`,
  `CREATE INDEX IF NOT EXISTS product_param_filter_idx ON product_param_value(param_id, value_text)`,
];

async function database() {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) throw new Error("Database binding unavailable");
  return env.DB;
}

async function ensureDatabase(db: D1Database) {
  await db.batch(schemaStatements.map((sql) => db.prepare(sql)));
  const count = await db.prepare("SELECT COUNT(*) AS total FROM admin_orders").first<{ total: number }>();
  if ((count?.total ?? 0) > 0) return;
  const now = new Date().toISOString();
  await db.batch([
    db.prepare("INSERT INTO admin_customers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("CUS-1001", "Emma Wilson", "emma@example.com", "VIP", "正常", 8, 4680, "2026-04-12T08:20:00Z", now),
    db.prepare("INSERT INTO admin_customers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("CUS-1002", "Michael Chen", "michael@example.com", "专业版", "正常", 4, 2190, "2026-05-21T12:00:00Z", now),
    db.prepare("INSERT INTO admin_customers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("CUS-1003", "Sofia Martinez", "sofia@example.com", "免费版", "需关注", 1, 199, "2026-07-18T18:30:00Z", now),
    db.prepare("INSERT INTO admin_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("CX-260724-1088", "CUS-1001", "Emma Wilson", "经典纯棉 T 恤 × 24", 2376, "设计审核", "已付款", "待排产", "未发货", "2026-07-24T04:18:00Z", now),
    db.prepare("INSERT INTO admin_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("CX-260724-1087", "CUS-1002", "Michael Chen", "连帽卫衣 × 12", 2268, "生产中", "已付款", "印刷中", "未发货", "2026-07-24T02:40:00Z", now),
    db.prepare("INSERT INTO admin_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("CX-260723-1086", "CUS-1003", "Sofia Martinez", "艺术海报 × 3", 199, "待付款", "待付款", "未开始", "未发货", "2026-07-23T20:05:00Z", now),
    db.prepare("INSERT INTO admin_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("CX-260723-1085", "CUS-1001", "Emma Wilson", "帆布托特包 × 30", 2850, "已发货", "已付款", "已完成", "运输中", "2026-07-23T11:26:00Z", now),
    db.prepare("INSERT INTO admin_products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("PROD-001", "TEE-001", "经典纯棉 T 恤", "服装", 39, 18, "上架", 186, now),
    db.prepare("INSERT INTO admin_products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("PROD-002", "HOOD-001", "连帽卫衣", "服装", 89, 46, "上架", 92, now),
    db.prepare("INSERT INTO admin_products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("PROD-003", "MUG-001", "陶瓷马克杯", "家居", 29, 11, "上架", 240, now),
    db.prepare("INSERT INTO admin_products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("PROD-004", "POSTER-001", "艺术海报", "家居", 19, 6, "草稿", 0, now),
    db.prepare("INSERT INTO admin_ai_providers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("AI-001", "Gemini", "Gemini 3.1 Flash Image", "快速POD图案、参考图修改", 1, 428, 98, 3180, now),
    db.prepare("INSERT INTO admin_ai_providers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("AI-002", "Gemini", "Gemini 3 Pro Image", "复杂商业版式、高质量设计", 1, 96, 96, 5240, now),
    db.prepare("INSERT INTO admin_ai_providers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("AI-003", "FLUX", "FLUX.2 Pro", "写实场景、材质、AI模特", 1, 142, 97, 6830, now),
    db.prepare("INSERT INTO admin_ai_providers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind("AI-004", "Ideogram", "Ideogram 4.0", "图文排版、标语、商业海报", 0, 0, 0, 0, now),
    db.prepare("INSERT INTO admin_settings VALUES (?, ?, ?)").bind("platform_name", "coxof AI DIY", now),
    db.prepare("INSERT INTO admin_settings VALUES (?, ?, ?)").bind("default_currency", "CNY", now),
    db.prepare("INSERT INTO admin_settings VALUES (?, ?, ?)").bind("order_prefix", "CX", now),
    db.prepare("INSERT INTO admin_audit_logs (actor, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)").bind("system", "初始化后台", "System", "创建后台数据与默认配置", now),
  ]);
}

const eavParamSeeds = [
  ["PAR-MATERIAL", "材质", "material", "tag_input", "", '["纯棉","精梳棉","棉涤混纺","聚酯纤维","帆布","陶瓷","TPU","纸张"]'],
  ["PAR-COLOR", "可选颜色", "color", "multi_select", "", '["白色","黑色","自然色","灰色","海军蓝","天蓝色","红色","粉色","绿色","黄色","紫色"]'],
  ["PAR-SIZE", "可选尺码", "size", "multi_select", "", '["XXS","XS","S","M","L","XL","2XL","3XL","4XL","5XL","A4","A3","A2"]'],
  ["PAR-SIZE-CHART", "详细尺码表", "size_chart", "size_chart", "", "[]"],
  ["PAR-PRINT", "印刷区域", "print_area", "multi_select", "", '["前胸","后背","左胸","左袖","右袖","领口","下摆","双面","满版"]'],
  ["PAR-WEIGHT", "克重", "weight", "number", "g", "[]"],
  ["PAR-CAPACITY", "容量", "capacity", "number", "ml", "[]"],
  ["PAR-COMPAT", "适配型号", "compatibility", "text", "", "[]"],
  ["PAR-FINISH", "表面工艺", "finish", "select", "", '["哑光","亮光","磨砂","无涂层"]'],
];

const eavTemplateSeeds: Record<string, Array<[string, number, number, number]>> = {
  "服装": [["PAR-MATERIAL", 1, 1, 10], ["PAR-COLOR", 1, 1, 20], ["PAR-SIZE", 1, 1, 30], ["PAR-SIZE-CHART", 0, 0, 35], ["PAR-WEIGHT", 0, 1, 40], ["PAR-PRINT", 1, 1, 50]],
  "家居": [["PAR-MATERIAL", 1, 1, 10], ["PAR-COLOR", 1, 1, 20], ["PAR-CAPACITY", 0, 1, 30], ["PAR-SIZE", 0, 1, 40], ["PAR-FINISH", 0, 1, 50], ["PAR-PRINT", 1, 1, 60]],
  "数码": [["PAR-MATERIAL", 1, 1, 10], ["PAR-COLOR", 1, 1, 20], ["PAR-COMPAT", 1, 1, 30], ["PAR-FINISH", 0, 1, 40], ["PAR-PRINT", 1, 1, 50]],
  "配饰": [["PAR-MATERIAL", 1, 1, 10], ["PAR-COLOR", 1, 1, 20], ["PAR-SIZE", 0, 1, 30], ["PAR-PRINT", 1, 1, 40]],
  "其他": [["PAR-MATERIAL", 0, 1, 10], ["PAR-COLOR", 0, 1, 20], ["PAR-SIZE", 0, 1, 30]],
};

async function ensureEavCatalog(db: D1Database) {
  const now = new Date().toISOString();
  const statements = eavParamSeeds.map((seed) =>
    db.prepare(`INSERT INTO product_param_def
      (id, name, code, input_type, unit, options_json, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, '启用', ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        code = excluded.code,
        input_type = excluded.input_type,
        unit = excluded.unit,
        options_json = excluded.options_json,
        status = '启用',
        updated_at = excluded.updated_at`)
      .bind(...seed, now)
  );
  for (const [category, relations] of Object.entries(eavTemplateSeeds)) {
    statements.push(...relations.map(([paramId, required, filterable, sortOrder]) =>
      db.prepare(`INSERT INTO category_param_rel
        (category_code, param_id, required, filterable, sort_order)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(category_code, param_id) DO NOTHING`)
        .bind(category, paramId, required, filterable, sortOrder)
    ));
  }
  statements.push(db.prepare(`INSERT INTO product
    (id, spu_code, name, category_code, price, cost, status, stock, updated_at)
    SELECT id, sku, name, category, price, cost, status, stock, updated_at
    FROM admin_products WHERE id NOT IN (SELECT id FROM product)`));
  await db.batch(statements);
}

async function queryAll<T>(db: D1Database, sql: string) {
  const result = await db.prepare(sql).all<T>() as D1Result<T>;
  return result.results ?? [];
}

function hasParamValue(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  try {
    const parsed = JSON.parse(text);
    return !Array.isArray(parsed) || parsed.some((item) => String(item).trim());
  } catch {
    return true;
  }
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await database();
  await ensureDatabase(db);
  await ensureEavCatalog(db);
  const [orders, customers, products, aiProviders, auditLogs, settings, assets, content, admins, paramDefs, categoryParams, paramValues] = await Promise.all([
    queryAll(db, "SELECT * FROM admin_orders ORDER BY created_at DESC"),
    queryAll(db, "SELECT * FROM admin_customers ORDER BY joined_at DESC"),
    queryAll(db, `SELECT p.*, p.spu_code AS sku, p.category_code AS category,
      COUNT(v.id) AS param_count
      FROM product p LEFT JOIN product_param_value v ON v.product_id = p.id
      GROUP BY p.id ORDER BY p.name`),
    queryAll(db, "SELECT * FROM admin_ai_providers ORDER BY id"),
    queryAll(db, "SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 80"),
    queryAll(db, "SELECT * FROM admin_settings ORDER BY key"),
    queryAll(db, "SELECT * FROM admin_assets ORDER BY created_at DESC"),
    queryAll(db, "SELECT * FROM admin_content ORDER BY updated_at DESC"),
    queryAll(db, "SELECT * FROM admin_members ORDER BY invited_at DESC"),
    queryAll(db, "SELECT * FROM product_param_def WHERE status = '启用' ORDER BY name"),
    queryAll(db, `SELECT r.*, d.name, d.code, d.input_type, d.unit, d.options_json
      FROM category_param_rel r JOIN product_param_def d ON d.id = r.param_id
      WHERE d.status = '启用' ORDER BY r.category_code, r.sort_order`),
    queryAll(db, "SELECT * FROM product_param_value ORDER BY product_id, param_id"),
  ]);
  return NextResponse.json({ orders, customers, products, aiProviders, auditLogs, settings, assets, content, admins, paramDefs, categoryParams, paramValues, user });
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await database();
  await ensureDatabase(db);
  await ensureEavCatalog(db);
  const now = new Date().toISOString();
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      if (form.get("entity") !== "asset") return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
      const file = form.get("file");
      if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "请选择素材文件" }, { status: 400 });
      if (file.size > 12 * 1024 * 1024) return NextResponse.json({ error: "文件不能超过 12MB" }, { status: 400 });
      const assetId = id("AST");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const objectKey = `admin-assets/${assetId}/${safeName}`;
      const { env } = await import("cloudflare:workers");
      if (!env.BUCKET) throw new Error("素材存储暂不可用");
      await env.BUCKET.put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
      const name = String(form.get("name") || file.name).trim();
      const category = String(form.get("category") || "图案").trim();
      await db.batch([
        db.prepare("INSERT INTO admin_assets VALUES (?, ?, ?, ?, ?, ?, ?)").bind(assetId, name, category, file.type || "application/octet-stream", file.size, objectKey, now),
        db.prepare("INSERT INTO admin_audit_logs (actor, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)").bind(user.email, "上传素材", assetId, `${name} · ${category}`, now),
      ]);
      return NextResponse.json({ ok: true, id: assetId });
    }

    const body = await request.json() as Record<string, unknown>;
    const entity = String(body.entity || "");
    const audit = (action: string, target: string, detail: string) =>
      db.prepare("INSERT INTO admin_audit_logs (actor, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)").bind(user.email, action, target, detail, now);

    if (entity === "order") {
      const orderId = id("CX");
      const customerName = String(body.customer_name || "").trim();
      const productName = String(body.product_name || "").trim();
      if (!customerName || !productName || Number(body.amount) <= 0) throw new Error("请完整填写客户、商品和金额");
      await db.batch([
        db.prepare("INSERT INTO admin_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(orderId, String(body.customer_id || "MANUAL"), customerName, productName, Number(body.amount), String(body.status || "待付款"), String(body.payment_status || "待付款"), "未开始", "未发货", now, now),
        audit("创建订单", orderId, `${customerName} · ${productName}`),
      ]);
    } else if (entity === "customer") {
      const customerId = id("CUS");
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      if (!name || !email.includes("@")) throw new Error("请填写有效的客户姓名与邮箱");
      await db.batch([
        db.prepare("INSERT INTO admin_customers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(customerId, name, email, String(body.tier || "免费版"), "正常", 0, 0, now, now),
        audit("新增客户", customerId, `${name} · ${email}`),
      ]);
    } else if (entity === "product") {
      const productId = id("PROD");
      const name = String(body.name || "").trim();
      const spuCode = String(body.spu_code || body.sku || "").trim().toUpperCase();
      const category = String(body.category_code || body.category || "其他");
      const params = body.params && typeof body.params === "object" && !Array.isArray(body.params)
        ? body.params as Record<string, unknown>
        : {};
      if (!name || !spuCode || Number(body.price) < 0) throw new Error("请完整填写商品名称、SPU 编码和价格");
      const requiredResult = await db.prepare(`SELECT r.param_id, d.name
        FROM category_param_rel r JOIN product_param_def d ON d.id = r.param_id
        WHERE r.category_code = ? AND r.required = 1`).bind(category).all<{ param_id: string; name: string }>();
      const requiredParams = requiredResult.results ?? [];
      const missing = requiredParams.filter((param) => !hasParamValue(params[param.param_id]));
      if (missing.length) throw new Error(`请填写必填参数：${missing.map((item) => item.name).join("、")}`);
      const valueStatements = Object.entries(params)
        .filter(([, value]) => hasParamValue(value))
        .map(([paramId, value]) => db.prepare(`INSERT INTO product_param_value
          (product_id, param_id, value_text, updated_at) VALUES (?, ?, ?, ?)`)
          .bind(productId, paramId, String(value), now));
      await db.batch([
        db.prepare(`INSERT INTO product
          (id, spu_code, name, category_code, price, cost, status, stock, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(productId, spuCode, name, category, Number(body.price), Number(body.cost || 0), String(body.status || "草稿"), Number(body.stock || 0), now),
        ...valueStatements,
        audit("新增商品 SPU", productId, `${spuCode} · ${name} · ${category} · ${valueStatements.length} 个参数`),
      ]);
    } else if (entity === "product_params") {
      const productId = String(body.product_id || "");
      const category = String(body.category_code || "");
      const params = body.params && typeof body.params === "object" && !Array.isArray(body.params)
        ? body.params as Record<string, unknown>
        : {};
      const product = await db.prepare("SELECT id FROM product WHERE id = ?").bind(productId).first<{ id: string }>();
      if (!product || !category) throw new Error("商品或类目不存在");
      const templateResult = await db.prepare(`SELECT r.param_id, r.required, d.name
        FROM category_param_rel r JOIN product_param_def d ON d.id = r.param_id
        WHERE r.category_code = ? AND d.status = '启用'`).bind(category).all<{ param_id: string; required: number; name: string }>();
      const template = templateResult.results ?? [];
      if (!template.length) throw new Error("该类目没有可用的参数模板");
      const missing = template.filter((param) => param.required && !hasParamValue(params[param.param_id]));
      if (missing.length) throw new Error(`请填写必填参数：${missing.map((item) => item.name).join("、")}`);
      const allowed = new Set(template.map((param) => param.param_id));
      const values = Object.entries(params).filter(([paramId, value]) => allowed.has(paramId) && hasParamValue(value));
      await db.batch([
        db.prepare("UPDATE product SET category_code = ?, updated_at = ? WHERE id = ?").bind(category, now, productId),
        db.prepare("DELETE FROM product_param_value WHERE product_id = ?").bind(productId),
        ...values.map(([paramId, value]) => db.prepare(`INSERT INTO product_param_value
          (product_id, param_id, value_text, updated_at) VALUES (?, ?, ?, ?)`)
          .bind(productId, paramId, String(value).trim(), now)),
        audit("更新商品参数", productId, `${category} · ${values.length} 个参数`),
      ]);
    } else if (entity === "production") {
      const orderId = String(body.order_id || "");
      if (!orderId) throw new Error("请选择订单");
      await db.batch([
        db.prepare("UPDATE admin_orders SET production_status = '待排产', status = '生产中', updated_at = ? WHERE id = ?").bind(now, orderId),
        audit("新建生产单", orderId, String(body.note || "进入待排产")),
      ]);
    } else if (entity === "shipping") {
      const orderIds = Array.isArray(body.order_ids) ? body.order_ids.map(String) : [];
      if (!orderIds.length) throw new Error("请至少选择一个待发货订单");
      const carrier = String(body.carrier || "USPS Priority");
      const statements = orderIds.flatMap((orderId, index) => [
        db.prepare("UPDATE admin_orders SET shipping_status = '运输中', status = '已发货', updated_at = ? WHERE id = ?").bind(now, orderId),
        audit("批量发货", orderId, `${carrier} · CX${Date.now().toString().slice(-7)}${index}`),
      ]);
      await db.batch(statements);
    } else if (entity === "content") {
      const contentId = id("CNT");
      const title = String(body.title || "").trim();
      if (!title) throw new Error("内容标题不能为空");
      await db.batch([
        db.prepare("INSERT INTO admin_content VALUES (?, ?, ?, ?, ?, ?)").bind(contentId, title, String(body.content_type || "页面内容"), String(body.status || "草稿"), String(body.summary || ""), now),
        audit("新建内容", contentId, title),
      ]);
    } else if (entity === "admin") {
      const adminId = id("ADM");
      const email = String(body.email || "").trim().toLowerCase();
      if (!email.includes("@")) throw new Error("请输入有效的管理员邮箱");
      await db.batch([
        db.prepare("INSERT INTO admin_members VALUES (?, ?, ?, ?, ?, ?)").bind(adminId, String(body.name || email.split("@")[0]), email, String(body.role || "Operations"), "已邀请", now),
        audit("邀请管理员", adminId, `${email} · ${String(body.role || "Operations")}`),
      ]);
    } else if (entity === "refund") {
      const orderId = String(body.order_id || "");
      const amount = Number(body.amount || 0);
      const reason = String(body.reason || "").trim();
      const order = await db.prepare("SELECT amount, payment_status FROM admin_orders WHERE id = ?").bind(orderId).first<{ amount: number; payment_status: string }>();
      if (!order || order.payment_status !== "已付款") throw new Error("请选择可退款的已付款订单");
      if (amount <= 0 || amount > Number(order.amount)) throw new Error("退款金额必须大于 0 且不能超过订单金额");
      if (!reason) throw new Error("请填写退款原因");
      await db.batch([
        db.prepare("UPDATE admin_orders SET payment_status = '已退款', status = '已取消', updated_at = ? WHERE id = ?").bind(now, orderId),
        audit("创建退款", orderId, `${amount} · ${reason}`),
      ]);
    } else if (entity === "settings") {
      const values = body.values && typeof body.values === "object" && !Array.isArray(body.values)
        ? body.values as Record<string, unknown>
        : {};
      const allowedKeys = new Set([
        "platform_name", "default_currency", "order_prefix", "auto_confirm_paid",
        "auto_production", "order_cancel_hours", "email_order_confirm",
        "email_production_update", "webhook_url", "asset_storage", "api_timeout",
        "session_timeout", "enforce_mfa", "allowed_ip", "audit_retention_days",
      ]);
      const entries = Object.entries(values).filter(([key]) => allowedKeys.has(key));
      if (!entries.length) throw new Error("没有可保存的设置");
      await db.batch([
        ...entries.map(([key, value]) => db.prepare(`INSERT INTO admin_settings (key, value, updated_at)
          VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`)
          .bind(key, String(value ?? ""), now)),
        audit("保存系统设置", "System", `更新 ${entries.length} 项设置`),
      ]);
    } else {
      return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "操作失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await database();
  await ensureDatabase(db);
  await ensureEavCatalog(db);
  const body = await request.json() as { entity?: string; id?: string; field?: string; value?: string | number | boolean };
  const allowed: Record<string, { table: string; fields: string[]; updatedField?: string }> = {
    order: { table: "admin_orders", fields: ["status", "payment_status", "production_status", "shipping_status"] },
    customer: { table: "admin_customers", fields: ["status", "tier"] },
    product: { table: "product", fields: ["status", "stock", "price"] },
    ai: { table: "admin_ai_providers", fields: ["enabled"] },
    setting: { table: "admin_settings", fields: ["value"] },
    content: { table: "admin_content", fields: ["status", "title", "summary"] },
    admin: { table: "admin_members", fields: ["status", "role"], updatedField: "" },
  };
  const config = body.entity ? allowed[body.entity] : undefined;
  if (!config || !body.id || !body.field || !config.fields.includes(body.field)) {
    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  }
  const idField = body.entity === "setting" ? "key" : "id";
  const value = typeof body.value === "boolean" ? Number(body.value) : body.value;
  const now = new Date().toISOString();
  const updateStatement = config.updatedField === ""
    ? db.prepare(`UPDATE ${config.table} SET ${body.field} = ? WHERE ${idField} = ?`).bind(value, body.id)
    : db.prepare(`UPDATE ${config.table} SET ${body.field} = ?, ${config.updatedField || "updated_at"} = ? WHERE ${idField} = ?`).bind(value, now, body.id);
  await db.batch([
    updateStatement,
    db.prepare("INSERT INTO admin_audit_logs (actor, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)").bind(user.email, "更新", `${body.entity}:${body.id}`, `${body.field} → ${String(body.value)}`, now),
  ]);
  return NextResponse.json({ ok: true });
}
