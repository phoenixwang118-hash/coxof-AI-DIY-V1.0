import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

type CatalogRow = {
  id: string;
  spu_code: string;
  name: string;
  category_code: string;
  price: number;
  param_values: string | null;
};
type SizeChart = {
  unit: "cm" | "in";
  tolerance: string;
  columns: string[];
  rows: Array<Record<string, string>>;
};

async function database() {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) throw new Error("Database binding unavailable");
  return env.DB;
}

function stableNumericId(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return 10000 + (hash >>> 0);
}

function visualType(name: string, category: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("半身裙") || normalized.includes("skirt")) return "skirt";
  if (normalized.includes("连衣裙") || normalized.includes("dress")) return "dress";
  if (normalized.includes("卫衣") || normalized.includes("hoodie")) return "2";
  if (normalized.includes("t 恤") || normalized.includes("t恤") || normalized.includes("shirt")) return "1";
  if (normalized.includes("马克杯") || normalized.includes("mug")) return "3";
  if (normalized.includes("挂画") || normalized.includes("画布")) return "4";
  if (normalized.includes("海报") || normalized.includes("poster")) return "5";
  if (normalized.includes("抱枕") || normalized.includes("pillow")) return "6";
  if (normalized.includes("手机壳") || normalized.includes("case")) return "7";
  if (normalized.includes("托特") || normalized.includes("tote")) return "8";
  return category === "服装" ? "apparel" : "generic";
}

function toneFor(type: string) {
  if (type === "2") return "black";
  if (type === "skirt") return "rose";
  if (type === "dress") return "lavender";
  return type === "3" ? "white" : type === "7" ? "blue" : "cream";
}

function displayParam(value: string | undefined) {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean).join(" / ");
  } catch { /* legacy scalar value */ }
  return value;
}
function sizeChartParam(value: string | undefined): SizeChart | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || !Array.isArray(parsed.columns) || !Array.isArray(parsed.rows) || !parsed.rows.length) return undefined;
    return {
      unit: parsed.unit === "in" ? "in" : "cm",
      tolerance: String(parsed.tolerance || ""),
      columns: parsed.columns.map(String).filter(Boolean),
      rows: parsed.rows.map((row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, cell]) => [key, String(cell ?? "")]))),
    };
  } catch {
    return undefined;
  }
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await database();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS product (
      id TEXT PRIMARY KEY, spu_code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      category_code TEXT NOT NULL, price INTEGER NOT NULL, cost INTEGER NOT NULL,
      status TEXT NOT NULL, stock INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS product_param_def (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE,
      input_type TEXT NOT NULL, unit TEXT, options_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT '启用', updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS product_param_value (
      id INTEGER PRIMARY KEY AUTOINCREMENT, product_id TEXT NOT NULL,
      param_id TEXT NOT NULL, value_text TEXT NOT NULL, updated_at TEXT NOT NULL,
      UNIQUE(product_id, param_id)
    )`),
  ]);
  // Publish the existing skirt created before the storefront/catalog sync was
  // introduced. Future products use the admin-selected status normally.
  await db.prepare(`UPDATE product SET status = '上架', updated_at = ?
    WHERE status = '草稿'
    AND (name LIKE '%半身裙%' OR LOWER(name) LIKE '%skirt%' OR LOWER(spu_code) LIKE '%skirt%')`)
    .bind(new Date().toISOString())
    .run();

  const result = await db.prepare(`SELECT p.id, p.spu_code, p.name, p.category_code, p.price,
    GROUP_CONCAT(d.code || '=' || v.value_text, '||') AS param_values
    FROM product p
    LEFT JOIN product_param_value v ON v.product_id = p.id
    LEFT JOIN product_param_def d ON d.id = v.param_id
    WHERE p.status = '上架'
    GROUP BY p.id
    ORDER BY p.updated_at DESC`).all<CatalogRow>();

  const products = (result.results ?? []).map((row) => {
    const params = Object.fromEntries(
      String(row.param_values || "")
        .split("||")
        .filter(Boolean)
        .map((entry) => {
          const separator = entry.indexOf("=");
          return separator > -1 ? [entry.slice(0, separator), entry.slice(separator + 1)] : [entry, ""];
        }),
    );
    const type = visualType(row.name, row.category_code);
    return {
      id: stableNumericId(row.id),
      sourceId: row.id,
      spuCode: row.spu_code,
      name: row.name,
      category: row.category_code,
      price: `¥${Number(row.price)}`,
      size: displayParam(params.size) || displayParam(params.print_area) || "按类目规格",
      sizes: displayParam(params.size).split(" / ").filter(Boolean),
      colors: displayParam(params.color).split(" / ").filter(Boolean),
      materials: displayParam(params.material).split(" / ").filter(Boolean),
      printAreas: displayParam(params.print_area).split(" / ").filter(Boolean),
      sizeChart: sizeChartParam(params.size_chart),
      tone: toneFor(type),
      visualType: type,
      badge: "新品",
    };
  });

  return NextResponse.json({ products }, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
