import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

type D1Result<T> = { results?: T[] };
type Entity = "project" | "cart" | "order" | "profile";

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS user_projects (
    id TEXT PRIMARY KEY, owner_email TEXT NOT NULL, name TEXT NOT NULL,
    product_id INTEGER NOT NULL, prompt TEXT NOT NULL, model TEXT NOT NULL,
    design_json TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS user_cart (
    id TEXT PRIMARY KEY, owner_email TEXT NOT NULL, product_id INTEGER NOT NULL,
    project_name TEXT NOT NULL, size TEXT NOT NULL, quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL, design_json TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS user_orders (
    id TEXT PRIMARY KEY, owner_email TEXT NOT NULL, product_id INTEGER NOT NULL,
    project_name TEXT NOT NULL, size TEXT NOT NULL, quantity INTEGER NOT NULL,
    total INTEGER NOT NULL, status TEXT NOT NULL, address_json TEXT NOT NULL,
    shipping_method TEXT NOT NULL, payment_method TEXT NOT NULL,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS user_profiles (
    owner_email TEXT PRIMARY KEY, display_name TEXT NOT NULL,
    workspace_name TEXT NOT NULL, market TEXT NOT NULL, address_json TEXT NOT NULL,
    plan TEXT NOT NULL, credits_used INTEGER NOT NULL, credits_limit INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS user_projects_owner_idx ON user_projects(owner_email, updated_at)`,
  `CREATE INDEX IF NOT EXISTS user_cart_owner_idx ON user_cart(owner_email, updated_at)`,
  `CREATE INDEX IF NOT EXISTS user_orders_owner_idx ON user_orders(owner_email, created_at)`,
];

async function database() {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) throw new Error("Database binding unavailable");
  return env.DB;
}

async function ensureDatabase(db: D1Database) {
  await db.batch(schemaStatements.map((sql) => db.prepare(sql)));
}

async function queryAll<T>(db: D1Database, sql: string, owner: string) {
  const result = await db.prepare(sql).bind(owner).all<T>() as D1Result<T>;
  return result.results ?? [];
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await database();
  await ensureDatabase(db);
  const [projectRows, cartRows, orderRows, profileRow] = await Promise.all([
    queryAll<Record<string, string | number>>(db, "SELECT * FROM user_projects WHERE owner_email = ? ORDER BY updated_at DESC", user.email),
    queryAll<Record<string, string | number>>(db, "SELECT * FROM user_cart WHERE owner_email = ? ORDER BY updated_at ASC", user.email),
    queryAll<Record<string, string | number>>(db, "SELECT * FROM user_orders WHERE owner_email = ? ORDER BY created_at DESC", user.email),
    db.prepare("SELECT * FROM user_profiles WHERE owner_email = ?").bind(user.email).first<Record<string, string | number>>(),
  ]);

  const projects = projectRows.map((row) => ({
    id: row.id, name: row.name, productId: row.product_id, prompt: row.prompt,
    model: row.model, design: parseJson(String(row.design_json), {}),
    updatedAt: row.updated_at,
  }));
  const cart = cartRows.map((row) => ({
    id: row.id, productId: row.product_id, projectName: row.project_name,
    size: row.size, quantity: row.quantity, unitPrice: row.unit_price,
    design: parseJson(String(row.design_json), {}),
  }));
  const orders = orderRows.map((row) => ({
    id: row.id, productId: row.product_id, projectName: row.project_name,
    size: row.size, quantity: row.quantity, total: row.total, status: row.status,
    createdAt: row.created_at,
  }));
  const profile = profileRow ? {
    displayName: profileRow.display_name,
    workspaceName: profileRow.workspace_name,
    market: profileRow.market,
    address: parseJson(String(profileRow.address_json), {}),
    plan: profileRow.plan,
    creditsUsed: profileRow.credits_used,
    creditsLimit: profileRow.credits_limit,
  } : {
    displayName: user.displayName,
    workspaceName: "coxof POD Studio",
    market: "US",
    address: {},
    plan: "Creator 专业版",
    creditsUsed: 320,
    creditsLimit: 1000,
  };

  return NextResponse.json({ projects, cart, orders, profile, user });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await database();
  await ensureDatabase(db);
  const body = await request.json() as { entity?: Entity; operation?: "upsert" | "delete" | "clear"; data?: Record<string, unknown>; id?: string };
  const now = new Date().toISOString();

  if (body.entity === "project" && body.operation === "upsert" && body.data) {
    const item = body.data;
    await db.prepare(`INSERT INTO user_projects
      (id, owner_email, name, product_id, prompt, model, design_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, product_id=excluded.product_id,
      prompt=excluded.prompt, model=excluded.model, design_json=excluded.design_json,
      updated_at=excluded.updated_at WHERE owner_email=excluded.owner_email`)
      .bind(item.id, user.email, item.name, item.productId, item.prompt, item.model ?? "gemini-flash", JSON.stringify(item.design ?? {}), item.updatedAt ?? now).run();
  } else if (body.entity === "project" && body.operation === "delete" && body.id) {
    await db.prepare("DELETE FROM user_projects WHERE id = ? AND owner_email = ?").bind(body.id, user.email).run();
  } else if (body.entity === "cart" && body.operation === "upsert" && body.data) {
    const item = body.data;
    await db.prepare(`INSERT INTO user_cart
      (id, owner_email, product_id, project_name, size, quantity, unit_price, design_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET product_id=excluded.product_id,
      project_name=excluded.project_name, size=excluded.size, quantity=excluded.quantity,
      unit_price=excluded.unit_price, design_json=excluded.design_json, updated_at=excluded.updated_at
      WHERE owner_email=excluded.owner_email`)
      .bind(item.id, user.email, item.productId, item.projectName, item.size, item.quantity, item.unitPrice, JSON.stringify(item.design ?? {}), now).run();
  } else if (body.entity === "cart" && body.operation === "delete" && body.id) {
    await db.prepare("DELETE FROM user_cart WHERE id = ? AND owner_email = ?").bind(body.id, user.email).run();
  } else if (body.entity === "cart" && body.operation === "clear") {
    await db.prepare("DELETE FROM user_cart WHERE owner_email = ?").bind(user.email).run();
  } else if (body.entity === "order" && body.operation === "upsert" && body.data) {
    const item = body.data;
    await db.prepare(`INSERT INTO user_orders
      (id, owner_email, product_id, project_name, size, quantity, total, status,
       address_json, shipping_method, payment_method, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET status=excluded.status, updated_at=excluded.updated_at
      WHERE owner_email=excluded.owner_email`)
      .bind(item.id, user.email, item.productId, item.projectName, item.size, item.quantity, item.total,
        item.status, JSON.stringify(item.address ?? {}), item.shippingMethod ?? "standard",
        item.paymentMethod ?? "card", item.createdAt ?? now, now).run();
  } else if (body.entity === "profile" && body.operation === "upsert" && body.data) {
    const item = body.data;
    await db.prepare(`INSERT INTO user_profiles
      (owner_email, display_name, workspace_name, market, address_json, plan, credits_used, credits_limit, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(owner_email) DO UPDATE SET display_name=excluded.display_name,
      workspace_name=excluded.workspace_name, market=excluded.market,
      address_json=excluded.address_json, updated_at=excluded.updated_at`)
      .bind(user.email, item.displayName ?? user.displayName, item.workspaceName ?? "coxof POD Studio",
        item.market ?? "US", JSON.stringify(item.address ?? {}), item.plan ?? "Creator 专业版",
        item.creditsUsed ?? 320, item.creditsLimit ?? 1000, now).run();
  } else {
    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
