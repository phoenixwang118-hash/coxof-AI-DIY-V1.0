"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FormEvent } from "react";

type Section = "dashboard" | "orders" | "customers" | "products" | "assets" | "ai" | "payments" | "production" | "shipping" | "content" | "admins" | "audit" | "settings";
type RecordRow = Record<string, string | number | boolean>;
type AdminData = {
  orders: RecordRow[]; customers: RecordRow[]; products: RecordRow[];
  aiProviders: RecordRow[]; auditLogs: RecordRow[]; settings: RecordRow[];
  assets: RecordRow[]; content: RecordRow[]; admins: RecordRow[];
  paramDefs: RecordRow[]; categoryParams: RecordRow[]; paramValues: RecordRow[];
};
type UpdateFn = (entity: string, id: string, field: string, value: string | number | boolean) => Promise<void>;
type ActionKind = "order" | "customer" | "product" | "productParams" | "asset" | "production" | "shipping" | "content" | "admin" | "refund";
type SizeChart = {
  unit: "cm" | "in";
  tolerance: string;
  columns: string[];
  rows: Array<Record<string, string>>;
};

const menus: { id: Section; label: string; icon: string }[] = [
  { id: "dashboard", label: "运营总览", icon: "⌂" },
  { id: "orders", label: "订单管理", icon: "▤" },
  { id: "customers", label: "客户管理", icon: "◎" },
  { id: "products", label: "商品管理", icon: "▦" },
  { id: "assets", label: "设计素材", icon: "◇" },
  { id: "ai", label: "AI 管理", icon: "✦" },
  { id: "payments", label: "支付与退款", icon: "¥" },
  { id: "production", label: "生产管理", icon: "⚙" },
  { id: "shipping", label: "物流管理", icon: "⌁" },
  { id: "content", label: "内容管理", icon: "▣" },
  { id: "admins", label: "管理员与权限", icon: "♙" },
  { id: "audit", label: "审计日志", icon: "◷" },
  { id: "settings", label: "系统设置", icon: "⚙" },
];

const fallback: AdminData = { orders: [], customers: [], products: [], aiProviders: [], auditLogs: [], settings: [], assets: [], content: [], admins: [], paramDefs: [], categoryParams: [], paramValues: [] };
const statusOptions = ["待付款", "已付款", "设计审核", "生产中", "质检中", "已发货", "已完成", "已取消"];

function money(value: unknown) { return `¥${Number(value || 0).toLocaleString("zh-CN")}`; }
function date(value: unknown) { return new Date(String(value)).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }
function parseParamList(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
  } catch { /* legacy comma-separated value */ }
  return text.split(/[，,]/).map((item) => item.trim()).filter(Boolean);
}
function displayParamValue(value: unknown) {
  const values = parseParamList(value);
  return values.length ? values.join("、") : String(value ?? "");
}
const defaultSizeChart: SizeChart = {
  unit: "cm",
  tolerance: "1-2",
  columns: ["尺码", "衣长", "胸围", "肩宽", "袖长", "腰围", "臀围"],
  rows: ["S", "M", "L", "XL"].map((size) => ({ 尺码: size })),
};
function parseSizeChart(value: unknown, preferredSizes: string[] = []): SizeChart {
  try {
    const parsed = JSON.parse(String(value || ""));
    if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
      return {
        unit: parsed.unit === "in" ? "in" : "cm",
        tolerance: String(parsed.tolerance || ""),
        columns: parsed.columns.map(String).filter(Boolean),
        rows: parsed.rows.map((row: unknown) => row && typeof row === "object" ? Object.fromEntries(Object.entries(row).map(([key, cell]) => [key, String(cell ?? "")])) : {}),
      };
    }
  } catch { /* use the default chart */ }
  return {
    ...defaultSizeChart,
    columns: [...defaultSizeChart.columns],
    rows: (preferredSizes.length ? preferredSizes : ["S", "M", "L", "XL"]).map((size) => ({ 尺码: size })),
  };
}

export default function AdminConsole({ user }: { user: { name: string; email: string } }) {
  const [section, setSection] = useState<Section>("dashboard");
  const [data, setData] = useState<AdminData>(fallback);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("全部");
  const [drawer, setDrawer] = useState<RecordRow | null>(null);
  const [toast, setToast] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [action, setAction] = useState<ActionKind | null>(null);
  const [actionTarget, setActionTarget] = useState<RecordRow | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setData(await response.json());
    } catch {
      setToast("后台数据暂时无法读取，请稍后重试");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function update(entity: string, id: string, field: string, value: string | number | boolean) {
    const response = await fetch("/api/admin", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ entity, id, field, value }) });
    if (!response.ok) return setToast("操作失败，请重试");
    setToast("已保存并记录审计日志");
    await load();
  }

  async function create(payload: Record<string, unknown> | FormData) {
    const response = await fetch("/api/admin", payload instanceof FormData
      ? { method: "POST", body: payload }
      : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json() as { error?: string };
    if (!response.ok) throw new Error(result.error || "操作失败，请重试");
    setAction(null);
    setActionTarget(null);
    setToast("操作成功，后台数据已更新");
    await load();
  }

  function exportCsv(filename: string, rows: RecordRow[]) {
    if (!rows.length) return setToast("当前没有可导出的数据");
    const columns = Object.keys(rows[0]);
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = "\uFEFF" + [columns.join(","), ...rows.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    setToast("导出文件已生成");
  }

  const revenue = data.orders.reduce((sum, item) => sum + (item.payment_status === "已付款" ? Number(item.amount) : 0), 0);
  const filteredOrders = useMemo(() => data.orders.filter((item) => {
    const matchesSearch = `${item.id} ${item.customer_name} ${item.product_name}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (filter === "全部" || item.status === filter);
  }), [data.orders, search, filter]);

  const title = menus.find((item) => item.id === section)?.label || "Dashboard";

  function go(next: Section) {
    setSection(next); setSearch(""); setFilter("全部"); setDrawer(null); setNavOpen(false);
  }

  return <div className="admin-shell">
    <aside className={`admin-side ${navOpen ? "open" : ""}`}>
      <Link className="admin-brand" href="/" aria-label="coxof AI DIY POD 首页">
        <span className="admin-logo-crop">
          <img src="/coxof-ai-diy-pod-logo.png" alt="coxof AI DIY POD" />
        </span>
      </Link>
      <div className="admin-workspace"><i>PW</i><div><strong>品牌工作区</strong><small>Production</small></div><b>⌄</b></div>
      <p className="admin-nav-label">平台管理</p>
      <nav>{menus.map((item) => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => go(item.id)}><i>{item.icon}</i>{item.label}{item.id === "orders" && <em>{data.orders.length}</em>}</button>)}</nav>
      <div className="admin-side-foot"><span className="health-dot" /> 系统运行正常<Link href="/">返回设计工作台 →</Link></div>
    </aside>
    {navOpen && <button className="admin-scrim" aria-label="关闭导航" onClick={() => setNavOpen(false)} />}
    <main className="admin-main">
      <header className="admin-top">
        <div className="admin-title"><button className="admin-menu" onClick={() => setNavOpen(true)}>☰</button><div><small>coxof AI DIY / Admin</small><strong>{title}</strong></div></div>
        <div className="admin-actions"><label><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索订单、客户、商品…" /></label><div className="admin-user"><span>{user.name.slice(0, 2).toUpperCase()}</span><div><strong>{user.name}</strong><small>管理员</small></div></div></div>
      </header>
      <div className="admin-page">
        {loading && <div className="admin-loading"><i /><span>正在载入后台数据…</span></div>}
        {!loading && section === "dashboard" && <Dashboard data={data} revenue={revenue} go={go} />}
        {!loading && section === "orders" && <Orders rows={filteredOrders} filter={filter} setFilter={setFilter} update={update} open={setDrawer} action={() => setAction("order")} exportRows={() => exportCsv("orders", filteredOrders)} />}
        {!loading && section === "customers" && <Customers rows={data.customers} search={search} update={update} open={setDrawer} action={() => setAction("customer")} />}
        {!loading && section === "products" && <Products data={data} search={search} update={update} action={() => setAction("product")} editParams={(product) => { setActionTarget(product); setAction("productParams"); }} />}
        {!loading && section === "assets" && <Assets rows={data.assets} action={() => setAction("asset")} />}
        {!loading && section === "ai" && <AI rows={data.aiProviders} update={update} />}
        {!loading && section === "payments" && <Payments orders={data.orders} action={() => setAction("refund")} />}
        {!loading && section === "production" && <Production orders={data.orders} update={update} action={() => setAction("production")} />}
        {!loading && section === "shipping" && <Shipping orders={data.orders} update={update} action={() => setAction("shipping")} />}
        {!loading && section === "content" && <Content rows={data.content} update={update} action={() => setAction("content")} />}
        {!loading && section === "admins" && <Admins user={user} rows={data.admins} update={update} action={() => setAction("admin")} />}
        {!loading && section === "audit" && <Audit rows={data.auditLogs} exportRows={() => exportCsv("audit-logs", data.auditLogs)} />}
        {!loading && section === "settings" && <Settings rows={data.settings} save={create} />}
      </div>
    </main>
    {drawer && <DetailDrawer item={drawer} close={() => setDrawer(null)} update={update} />}
    {action && <ActionModal kind={action} data={data} target={actionTarget} close={() => { setAction(null); setActionTarget(null); }} submit={create} />}
    {toast && <div className="admin-toast">✓ {toast}</div>}
  </div>;
}

function PageHead({ eyebrow, title, text, action, onAction }: { eyebrow: string; title: string; text: string; action?: string; onAction?: () => void }) {
  return <div className="page-head"><div><span>{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{action && <button className="admin-primary" onClick={onAction}>＋ {action}</button>}</div>;
}

function Dashboard({ data, revenue, go }: { data: AdminData; revenue: number; go: (section: Section) => void }) {
  const activeOrders = data.orders.filter((item) => !["已完成", "已取消"].includes(String(item.status))).length;
  const success = data.aiProviders.length ? Math.round(data.aiProviders.reduce((sum, item) => sum + Number(item.success_rate), 0) / data.aiProviders.length) : 0;
  return <>
    <PageHead eyebrow="运营总览 · 2026年7月24日" title="下午好，Phoenix" text="这里是今天需要处理的订单、生产与AI任务。" />
    <div className="metrics">
      <Metric label="已付款销售额" value={money(revenue)} change="+18.4%" icon="↗" tone="orange" />
      <Metric label="处理中订单" value={activeOrders} change={`${data.orders.length} 个订单`} icon="▤" tone="blue" />
      <Metric label="客户总数" value={data.customers.length} change="本周 +12" icon="◎" tone="green" />
      <Metric label="AI 成功率" value={`${success}%`} change="运行稳定" icon="✦" tone="purple" />
    </div>
    <div className="dash-grid">
      <section className="admin-card wide"><div className="card-head"><div><h2>销售趋势</h2><p>近 7 日已付款销售额</p></div><small>最近 7 天</small></div><div className="chart-bars">{[42,58,49,76,64,91,83].map((height, i) => <div key={i}><span style={{ height: `${height}%` }} /><small>{["周五","周六","周日","周一","周二","周三","今天"][i]}</small></div>)}</div></section>
      <section className="admin-card"><div className="card-head"><div><h2>待办事项</h2><p>优先处理异常</p></div></div><div className="todos"><button onClick={() => go("orders")}><i className="red">3</i><span><b>订单等待设计审核</b><small>避免延误生产</small></span><em>→</em></button><button onClick={() => go("production")}><i className="amber">2</i><span><b>生产任务即将超时</b><small>需要供应商确认</small></span><em>→</em></button><button onClick={() => go("ai")}><i className="purple">1</i><span><b>Ideogram 尚未启用</b><small>配置接口后开启</small></span><em>→</em></button></div></section>
      <section className="admin-card wide"><div className="card-head"><div><h2>最新订单</h2><p>实时业务状态</p></div><button onClick={() => go("orders")}>查看全部 →</button></div><MiniOrders rows={data.orders.slice(0, 4)} /></section>
      <section className="admin-card"><div className="card-head"><div><h2>AI 模型用量</h2><p>今日生成任务</p></div><button onClick={() => go("ai")}>管理 →</button></div><div className="ai-usage">{data.aiProviders.map((item) => <div key={String(item.id)}><span><b>{String(item.name)}</b><small>{String(item.model)}</small></span><strong>{Number(item.requests_today).toLocaleString()}</strong></div>)}</div></section>
    </div>
  </>;
}

function Metric({ label, value, change, icon, tone }: { label: string; value: string | number; change: string; icon: string; tone: string }) {
  return <article className="metric"><span className={`metric-icon ${tone}`}>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{change}</em></div></article>;
}

function Orders({ rows, filter, setFilter, update, open, action, exportRows }: { rows: RecordRow[]; filter: string; setFilter: (v: string) => void; update: UpdateFn; open: (v: RecordRow) => void; action: () => void; exportRows: () => void }) {
  return <><PageHead eyebrow="订单中心" title="订单管理" text="创建订单、审核设计并更新订单状态。" action="创建订单" onAction={action} /><div className="admin-card table-card"><div className="table-tools"><div className="filter-tabs">{["全部","待付款","设计审核","生产中","已发货","已取消"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="outline" onClick={exportRows}>⇩ 导出订单</button></div><div className="data-table orders-table"><div className="tr th"><span>订单</span><span>客户</span><span>商品</span><span>金额</span><span>状态</span><span>更新时间</span><span /></div>{rows.map((item) => <div className="tr" key={String(item.id)}><strong>{String(item.id)}</strong><span>{String(item.customer_name)}</span><span>{String(item.product_name)}</span><strong>{money(item.amount)}</strong><select className={`status status-${String(item.status)}`} value={String(item.status)} onChange={(e) => update("order", String(item.id), "status", e.target.value)}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select><span>{date(item.updated_at)}</span><button className="more" aria-label={`查看订单 ${String(item.id)}`} onClick={() => open(item)}>•••</button></div>)}</div></div></>;
}

function MiniOrders({ rows }: { rows: RecordRow[] }) {
  return <div className="mini-orders">{rows.map((item) => <div key={String(item.id)}><span><b>{String(item.id)}</b><small>{String(item.customer_name)}</small></span><span>{String(item.product_name)}</span><strong>{money(item.amount)}</strong><em>{String(item.status)}</em></div>)}</div>;
}

function Customers({ rows, search, update, open, action }: { rows: RecordRow[]; search: string; update: UpdateFn; open: (v: RecordRow) => void; action: () => void }) {
  const filtered = rows.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageHead eyebrow="CRM" title="客户管理" text="查看客户资料、消费、会员等级、项目与风险状态。" action="新增客户" onAction={action} /><div className="metrics compact"><Metric label="客户总数" value={rows.length} change="本周 +12" icon="◎" tone="green" /><Metric label="VIP 客户" value={rows.filter((r) => r.tier === "VIP").length} change="高价值客户" icon="★" tone="orange" /><Metric label="累计消费" value={money(rows.reduce((s, r) => s + Number(r.total_spent), 0))} change="全部客户" icon="¥" tone="blue" /></div><div className="admin-card table-card"><div className="data-table customer-table"><div className="tr th"><span>客户</span><span>会员</span><span>订单</span><span>累计消费</span><span>状态</span><span>加入时间</span><span /></div>{filtered.map((item) => <div className="tr" key={String(item.id)}><span className="person"><i>{String(item.name).slice(0,2)}</i><b>{String(item.name)}<small>{String(item.email)}</small></b></span><select value={String(item.tier)} onChange={(e) => update("customer", String(item.id), "tier", e.target.value)}><option>免费版</option><option>专业版</option><option>VIP</option></select><strong>{String(item.order_count)}</strong><strong>{money(item.total_spent)}</strong><select value={String(item.status)} onChange={(e) => update("customer", String(item.id), "status", e.target.value)}><option>正常</option><option>需关注</option><option>已停用</option></select><span>{date(item.joined_at)}</span><button className="more" onClick={() => open(item)}>•••</button></div>)}</div></div></>;
}

function Products({ data, search, update, action, editParams }: { data: AdminData; search: string; update: UpdateFn; action: () => void; editParams: (product: RecordRow) => void }) {
  const rows = data.products;
  const filtered = rows.filter((item) => `${item.name} ${item.sku}`.toLowerCase().includes(search.toLowerCase()));
  const templates = Array.from(new Set(data.categoryParams.map((item) => String(item.category_code))));
  const valuesFor = (productId: unknown) => data.paramValues
    .filter((value) => String(value.product_id) === String(productId))
    .slice(0, 3)
    .map((value) => {
      const def = data.paramDefs.find((item) => String(item.id) === String(value.param_id));
      if (String(def?.input_type) === "size_chart") {
        const chart = parseSizeChart(value.value_text);
        return `详细尺码表：${chart.rows.length} 个尺码 × ${Math.max(chart.columns.length - 1, 0)} 项测量`;
      }
      return `${String(def?.name || "参数")}：${displayParamValue(value.value_text)}`;
    });
  return <><PageHead eyebrow="POD 商品目录 · EAV" title="商品管理" text="以 SPU 为主档，按类目模板自动加载标准参数；参数字典统一用于商品筛选与 AI 设计约束。" action="新增商品" onAction={action} />
    <div className="catalog-model-strip">
      <span><b>{rows.length}</b><small>SPU 商品</small></span>
      <span><b>{data.paramDefs.length}</b><small>统一参数</small></span>
      <span><b>{templates.length}</b><small>类目模板</small></span>
      <div>{templates.map((category) => <em key={category}>{category} · {data.categoryParams.filter((item) => item.category_code === category).length} 项</em>)}</div>
    </div>
    <div className="admin-card product-admin-grid">{filtered.map((item, index) => {
      const values = valuesFor(item.id);
      return <article key={String(item.id)}><div className={`product-thumb p${index % 4 + 1}`}><span>{String(item.name).slice(0,1)}</span><em>{String(item.category)}</em></div><div className="product-admin-info"><small>SPU · {String(item.sku)}</small><h3>{String(item.name)}</h3><div><span>售价 <b>{money(item.price)}</b></span><span>成本 <b>{money(item.cost)}</b></span><span>库存 <b>{String(item.stock)}</b></span></div><button className={`product-param-preview ${values.length ? "" : "empty"}`} onClick={() => editParams(item)}>{values.length ? values.map((value) => <em key={value}>{value}</em>) : <em className="muted">待补充类目参数 · 点击填写</em>}<b>修改参数 →</b></button><footer><span>{Number(item.param_count || 0)} 项规格</span><select aria-label={`${String(item.name)}上下架状态`} value={String(item.status)} onChange={(e) => update("product", String(item.id), "status", e.target.value)}><option>上架</option><option>草稿</option><option>下架</option></select></footer></div></article>;
    })}</div></>;
}

function Assets({ rows, action }: { rows: RecordRow[]; action: () => void }) {
  const seeded = [["Vintage Outdoor Badge","图案模板","18 次使用"],["Holiday Typography Kit","字体组合","42 次使用"],["Floral Line Art","插画素材","31 次使用"],["T-shirt Front Mockup","Mockup","128 次使用"],["Canvas Tote Mockup","Mockup","76 次使用"],["Minimal Poster Grid","版式模板","23 次使用"]];
  const assets = [...rows.map((r) => [String(r.name), String(r.category), `${Math.max(1, Math.round(Number(r.size) / 1024))} KB`]), ...seeded];
  return <><PageHead eyebrow="设计资源库" title="Design Assets" text="管理图案、字体、模板、Mockup、授权与标签。" action="上传素材" onAction={action} /><div className="asset-filters"><button className="active">全部</button><button>图案</button><button>字体</button><button>Mockup</button><button>版式</button><button>品牌资源</button></div><div className="asset-grid">{assets.map((item, index) => <article key={`${item[0]}-${index}`}><div className={`asset-preview a${index % 6 + 1}`}><span>{index % 2 ? "Aa" : "✦"}</span></div><h3>{item[0]}</h3><p>{item[1]} · {item[2]}</p><footer><em>商用授权</em><button onClick={action}>•••</button></footer></article>)}</div></>;
}

function AI({ rows, update }: { rows: RecordRow[]; update: UpdateFn }) {
  return <><PageHead eyebrow="模型状态与成本" title="AI 管理" text="启用或停用模型，查看今日用量与成功率。" /><div className="ai-summary"><Metric label="今日生成" value={rows.reduce((s,r) => s + Number(r.requests_today), 0)} change="全部模型" icon="✦" tone="purple" /><Metric label="今日成本" value={money(rows.reduce((s,r) => s + Number(r.cost_today), 0) / 100)} change="预计费用" icon="¥" tone="orange" /><Metric label="平均成功率" value={`${Math.round(rows.reduce((s,r) => s + Number(r.success_rate), 0) / Math.max(rows.length,1))}%`} change="过去 24 小时" icon="↗" tone="green" /></div><div className="admin-card ai-models">{rows.map((item) => <article key={String(item.id)}><div className={`provider-logo ${String(item.name).toLowerCase()}`}>{String(item.name).slice(0,1)}</div><div className="provider-copy"><span><h3>{String(item.model)}</h3><em>{Boolean(item.enabled) ? "运行中" : "未启用"}</em></span><p>{String(item.task)}</p><div><small>今日请求 <b>{String(item.requests_today)}</b></small><small>成功率 <b>{String(item.success_rate)}%</b></small><small>今日成本 <b>{money(Number(item.cost_today)/100)}</b></small></div></div><label className="switch"><input type="checkbox" aria-label={`启用 ${String(item.model)}`} checked={Boolean(item.enabled)} onChange={(e) => update("ai", String(item.id), "enabled", e.target.checked)} /><span /></label></article>)}</div></>;
}

function Payments({ orders, action }: { orders: RecordRow[]; action: () => void }) {
  const paid = orders.filter((o) => o.payment_status === "已付款");
  return <><PageHead eyebrow="财务" title="支付与退款" text="查看付款、退款、账单、对账与优惠活动。" action="创建退款" onAction={action} /><div className="metrics compact"><Metric label="已收款" value={money(paid.reduce((s,o) => s + Number(o.amount),0))} change="本期入账" icon="¥" tone="green" /><Metric label="待付款" value={orders.filter((o) => o.payment_status === "待付款").length} change="需要跟进" icon="◷" tone="orange" /><Metric label="已退款" value={orders.filter((o) => o.payment_status === "已退款").length} change="自动记录审计" icon="↺" tone="blue" /></div><div className="admin-card table-card"><div className="data-table payment-table"><div className="tr th"><span>交易号</span><span>订单</span><span>客户</span><span>金额</span><span>渠道</span><span>状态</span></div>{orders.map((o, i) => <div className="tr" key={String(o.id)}><strong>PAY-{26072400+i}</strong><span>{String(o.id)}</span><span>{String(o.customer_name)}</span><strong>{money(o.amount)}</strong><span>{i%2 ? "PayPal" : "Stripe"}</span><em>{String(o.payment_status)}</em></div>)}</div></div></>;
}

function Production({ orders, update, action }: { orders: RecordRow[]; update: UpdateFn; action: () => void }) {
  return <><PageHead eyebrow="订单履约" title="生产管理" text="新建生产单、排产、印刷、质检并完成生产。" action="新建生产单" onAction={action} /><div className="admin-card table-card"><div className="data-table fulfillment-table"><div className="tr th"><span>订单</span><span>客户与商品</span><span>订单状态</span><span>生产进度</span><span>发货状态</span></div>{orders.map((o) => <div className="tr" key={String(o.id)}><strong>{String(o.id)}</strong><span className="fulfillment-product"><b>{String(o.product_name)}</b><small>{String(o.customer_name)}</small></span><em>{String(o.status)}</em><select aria-label={`${String(o.id)}生产进度`} value={String(o.production_status)} onChange={(e) => update("order", String(o.id), "production_status", e.target.value)}>{["未开始","待排产","印刷中","质检中","已完成"].map((s) => <option key={s}>{s}</option>)}</select><span>{String(o.shipping_status)}</span></div>)}</div></div></>;
}

function Shipping({ orders, update, action }: { orders: RecordRow[]; update: UpdateFn; action: () => void }) {
  return <><PageHead eyebrow="履约配送" title="物流管理" text="管理收货地址、运费模板、物流商、轨迹及异常件。" action="批量发货" onAction={action} /><div className="admin-card table-card"><div className="data-table shipping-table"><div className="tr th"><span>订单</span><span>收件人</span><span>物流方式</span><span>追踪号</span><span>物流状态</span><span>预计送达</span></div>{orders.map((o,i) => <div className="tr" key={String(o.id)}><strong>{String(o.id)}</strong><span>{String(o.customer_name)}</span><span>{i%2 ? "UPS Ground" : "USPS Priority"}</span><span>{o.shipping_status === "运输中" ? `1ZCOXOF260${i}` : "—"}</span><select value={String(o.shipping_status)} onChange={(e) => update("order", String(o.id), "shipping_status", e.target.value)}><option>未发货</option><option>待揽收</option><option>运输中</option><option>已签收</option><option>异常件</option></select><span>{o.shipping_status === "运输中" ? "07/28" : "—"}</span></div>)}</div></div></>;
}

function Content({ rows, update, action }: { rows: RecordRow[]; update: UpdateFn; action: () => void }) {
  const seeded = [["首页 Banner","已发布","07/22 18:20","页面内容"],["新手帮助中心","已发布","07/20 09:12","页面内容"],["POD 设计指南","草稿","07/19 16:45","页面内容"],["订单确认邮件","已启用","07/18 11:08","自动邮件"],["生产完成邮件","已启用","07/18 11:06","自动邮件"],["SEO 默认配置","已发布","07/15 14:32","SEO"]];
  const cards = [...rows.map((r) => [String(r.title), String(r.status), date(r.updated_at), String(r.content_type)]), ...seeded];
  return <><PageHead eyebrow="站点运营" title="内容管理" text="管理 Banner、帮助中心、SEO 页面、通知与邮件模板。" action="新建内容" onAction={action} /><div className="content-grid">{cards.map((r,i) => <article className="admin-card" key={`${r[0]}-${i}`}><span className={`content-icon c${i%6+1}`}>{["▣","?","✎","✉","✓","⌕"][i%6]}</span><div><small>{r[3]}</small><h3>{r[0]}</h3><p>最后更新 {r[2]}</p></div>{i < rows.length ? <select value={r[1]} onChange={(e) => update("content", String(rows[i].id), "status", e.target.value)}><option>草稿</option><option>已发布</option><option>已启用</option><option>已停用</option></select> : <em>{r[1]}</em>}</article>)}</div></>;
}

function Admins({ user, rows, update, action }: { user: { name: string; email: string }; rows: RecordRow[]; update: UpdateFn; action: () => void }) {
  const admins = [[user.name,user.email,"Super Admin","在线"], ...rows.map((r) => [String(r.name),String(r.email),String(r.role),String(r.status)])];
  return <><PageHead eyebrow="权限与安全" title="管理员" text="管理后台账号、角色、权限与停用状态。" action="邀请管理员" onAction={action} /><div className="role-grid">{["Super Admin","Operations","Product Manager","Production","Finance","Support"].map((role,i) => <article className="admin-card" key={role}><span>{["★","▤","▦","⚙","¥","?"][i]}</span><h3>{role}</h3><p>{["全部权限","订单、客户、内容","商品、素材、AI配置","生产与物流","付款、退款、对账","订单与客户有限权限"][i]}</p><small>{admins.filter((a) => a[2] === role).length} 人</small></article>)}</div><div className="admin-card table-card"><div className="data-table admins-table"><div className="tr th"><span>管理员</span><span>角色</span><span>状态</span><span>最近登录</span><span /></div>{admins.map((a,i) => <div className="tr" key={a[1]}><span className="person"><i>{a[0].slice(0,2)}</i><b>{a[0]}<small>{a[1]}</small></b></span><strong>{a[2]}</strong>{i === 0 ? <em>在线</em> : <select value={a[3]} onChange={(e) => update("admin", String(rows[i - 1].id), "status", e.target.value)}><option>已邀请</option><option>启用</option><option>停用</option></select>}<span>{i===0 ? "刚刚" : "—"}</span><button className="more" onClick={action}>•••</button></div>)}</div></div></>;
}

function Audit({ rows, exportRows }: { rows: RecordRow[]; exportRows: () => void }) {
  return <><PageHead eyebrow="安全追踪" title="审计日志" text="查看后台操作、登录与重要数据变更，日志只读。" /><div className="admin-card table-card"><div className="audit-filter"><select><option>全部操作</option><option>订单</option><option>客户</option><option>系统</option></select><button className="outline" onClick={exportRows}>⇩ 导出日志</button></div><div className="data-table audit-table"><div className="tr th"><span>时间</span><span>操作者</span><span>操作</span><span>对象</span><span>详情</span></div>{rows.map((r) => <div className="tr" key={String(r.id)}><span>{date(r.created_at)}</span><strong>{String(r.actor)}</strong><em>{String(r.action)}</em><span>{String(r.target)}</span><span>{String(r.detail)}</span></div>)}</div></div></>;
}

function Settings({ rows, save }: { rows: RecordRow[]; save: (payload: Record<string, unknown>) => Promise<void> }) {
  const stored = Object.fromEntries(rows.map((row) => [String(row.key), String(row.value)]));
  const [tab, setTab] = useState("基础设置");
  const [draft, setDraft] = useState<Record<string, string>>({
    platform_name: stored.platform_name || "coxof AI DIY",
    default_currency: stored.default_currency || "CNY",
    order_prefix: stored.order_prefix || "CX",
    auto_confirm_paid: stored.auto_confirm_paid || "开启",
    auto_production: stored.auto_production || "关闭",
    order_cancel_hours: stored.order_cancel_hours || "24",
    email_order_confirm: stored.email_order_confirm || "开启",
    email_production_update: stored.email_production_update || "开启",
    webhook_url: stored.webhook_url || "",
    asset_storage: stored.asset_storage || "Cloudflare R2",
    api_timeout: stored.api_timeout || "60",
    session_timeout: stored.session_timeout || "120",
    enforce_mfa: stored.enforce_mfa || "关闭",
    allowed_ip: stored.allowed_ip || "",
    audit_retention_days: stored.audit_retention_days || "180",
  });
  const [saving, setSaving] = useState(false);
  const set = (key: string, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const tabs = ["基础设置", "订单规则", "通知设置", "API与存储", "安全策略"];

  async function submit() {
    setSaving(true);
    try { await save({ entity: "settings", values: draft }); } finally { setSaving(false); }
  }

  return <><PageHead eyebrow="平台配置" title="系统设置" text="所有设置均保存到后台，并自动写入审计日志。" /><div className="settings-layout"><nav>{tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav><section className="admin-card settings-form">
    {tab === "基础设置" && <><h2>基础设置</h2><p>配置平台名称、默认货币与订单编号规则。</p><label><span>平台名称</span><input value={draft.platform_name} onChange={(e) => set("platform_name", e.target.value)} /></label><label><span>默认货币</span><select value={draft.default_currency} onChange={(e) => set("default_currency", e.target.value)}><option>CNY</option><option>USD</option><option>EUR</option><option>GBP</option></select></label><label><span>订单号前缀</span><input value={draft.order_prefix} maxLength={8} onChange={(e) => set("order_prefix", e.target.value.toUpperCase())} /></label></>}
    {tab === "订单规则" && <><h2>订单规则</h2><p>控制订单付款、生产与超时取消的自动处理方式。</p><label><span>付款后自动确认</span><select value={draft.auto_confirm_paid} onChange={(e) => set("auto_confirm_paid", e.target.value)}><option>开启</option><option>关闭</option></select></label><label><span>设计确认后自动排产</span><select value={draft.auto_production} onChange={(e) => set("auto_production", e.target.value)}><option>开启</option><option>关闭</option></select></label><label><span>未付款自动取消（小时）</span><input type="number" min="1" value={draft.order_cancel_hours} onChange={(e) => set("order_cancel_hours", e.target.value)} /></label></>}
    {tab === "通知设置" && <><h2>通知设置</h2><p>选择向客户发送的关键订单通知。</p><label><span>订单确认邮件</span><select value={draft.email_order_confirm} onChange={(e) => set("email_order_confirm", e.target.value)}><option>开启</option><option>关闭</option></select></label><label><span>生产进度邮件</span><select value={draft.email_production_update} onChange={(e) => set("email_production_update", e.target.value)}><option>开启</option><option>关闭</option></select></label><div className="setting-notice"><b>通知记录</b><p>发送动作会记录到审计日志；正式邮件服务接入后沿用这里的开关。</p></div></>}
    {tab === "API与存储" && <><h2>API 与存储</h2><p>配置业务回调地址、素材存储策略与接口超时。</p><label><span>订单 Webhook 地址</span><input type="url" value={draft.webhook_url} onChange={(e) => set("webhook_url", e.target.value)} placeholder="https://api.example.com/orders" /></label><label><span>素材存储</span><select value={draft.asset_storage} onChange={(e) => set("asset_storage", e.target.value)}><option>Cloudflare R2</option><option>外部对象存储</option></select></label><label><span>API 超时（秒）</span><input type="number" min="10" max="300" value={draft.api_timeout} onChange={(e) => set("api_timeout", e.target.value)} /></label></>}
    {tab === "安全策略" && <><h2>安全策略</h2><p>配置管理员会话、多因素认证与审计保留周期。</p><label><span>管理员会话超时（分钟）</span><input type="number" min="15" value={draft.session_timeout} onChange={(e) => set("session_timeout", e.target.value)} /></label><label><span>强制多因素认证</span><select value={draft.enforce_mfa} onChange={(e) => set("enforce_mfa", e.target.value)}><option>开启</option><option>关闭</option></select></label><label><span>允许的办公 IP（可留空）</span><input value={draft.allowed_ip} onChange={(e) => set("allowed_ip", e.target.value)} placeholder="例如 203.0.113.0/24" /></label><label><span>审计日志保留（天）</span><input type="number" min="30" value={draft.audit_retention_days} onChange={(e) => set("audit_retention_days", e.target.value)} /></label></>}
    <footer><button className="admin-primary" onClick={submit} disabled={saving}>{saving ? "正在保存…" : "保存设置"}</button></footer>
  </section></div></>;
}

function ActionModal({ kind, data, target, close, submit }: { kind: ActionKind; data: AdminData; target: RecordRow | null; close: () => void; submit: (payload: Record<string, unknown> | FormData) => Promise<void> }) {
  const labels: Record<ActionKind, [string, string]> = {
    order: ["创建订单", "录入客户、商品与付款信息"],
    customer: ["新增客户", "创建客户档案与会员等级"],
    product: ["新增商品", "录入 POD 商品、SKU、价格与库存"],
    productParams: ["修改商品参数", "按类目模板补充或更新商品规格"],
    asset: ["上传素材", "支持图片、字体、PDF 与设计文件，最大 12MB"],
    production: ["新建生产单", "将已确认订单安排进入待排产"],
    shipping: ["批量发货", "选择多个订单并统一设置物流商"],
    content: ["新建内容", "创建页面、Banner、邮件或 SEO 内容"],
    admin: ["邀请管理员", "发送后台邀请并分配角色"],
    refund: ["创建退款", "选择已付款订单并记录退款原因"],
  };
  const availableShipping = data.orders.filter((o) => !["运输中", "已签收"].includes(String(o.shipping_status)));
  const [draft, setDraft] = useState<Record<string, string>>({
    customer_name: "", product_name: "", amount: "", status: "待付款", payment_status: "待付款",
    name: "", email: "", tier: "免费版", sku: "", category: String(target?.category || "服装"), price: "", cost: "", stock: "0",
    product_status: "上架", asset_category: "图案", order_id: String(data.orders[0]?.id || ""), note: "",
    carrier: "USPS Priority", title: "", content_type: "页面内容", content_status: "草稿", summary: "", role: "Operations",
    refund_order_id: String(data.orders.find((o) => o.payment_status === "已付款")?.id || ""), refund_amount: "", refund_reason: "",
  });
  const [selectedOrders, setSelectedOrders] = useState<string[]>(availableShipping.map((o) => String(o.id)));
  const [paramValues, setParamValues] = useState<Record<string, string>>(
    Object.fromEntries(data.paramValues.filter((value) => String(value.product_id) === String(target?.id)).map((value) => [String(value.param_id), String(value.value_text)])),
  );
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const field = (name: string, value: string) => setDraft((current) => ({ ...current, [name]: value }));
  const selectedCategoryParams = data.categoryParams.filter((item) => String(item.category_code) === draft.category);
  const parameterField = (param: RecordRow) => {
    const id = String(param.param_id);
    const inputType = String(param.input_type);
    const value = paramValues[id] || "";
    let options: string[] = [];
    try { options = JSON.parse(String(param.options_json || "[]")) as string[]; } catch { options = []; }
    const change = (next: string) => setParamValues((current) => ({ ...current, [id]: next }));
    if (inputType === "size_chart") {
      const sizeParam = data.paramDefs.find((definition) => String(definition.code) === "size");
      const selectedSizes = parseParamList(paramValues[String(sizeParam?.id || "")]);
      const chart = parseSizeChart(value, selectedSizes);
      const saveChart = (next: SizeChart) => change(JSON.stringify(next));
      const renameColumn = (columnIndex: number, nextName: string) => {
        const oldName = chart.columns[columnIndex];
        const cleanName = nextName.trimStart();
        const columns = chart.columns.map((column, index) => index === columnIndex ? cleanName : column);
        const rows = chart.rows.map((row) => {
          const nextRow = { ...row };
          delete nextRow[oldName];
          nextRow[cleanName] = row[oldName] || "";
          return nextRow;
        });
        saveChart({ ...chart, columns, rows });
      };
      const updateCell = (rowIndex: number, column: string, cellValue: string) => {
        const rows = chart.rows.map((row, index) => index === rowIndex ? { ...row, [column]: cellValue } : row);
        saveChart({ ...chart, rows });
      };
      const addColumn = () => {
        let index = chart.columns.length;
        let name = `测量项${index}`;
        while (chart.columns.includes(name)) { index += 1; name = `测量项${index}`; }
        saveChart({ ...chart, columns: [...chart.columns, name], rows: chart.rows.map((row) => ({ ...row, [name]: "" })) });
      };
      const removeColumn = (columnIndex: number) => {
        if (columnIndex === 0 || chart.columns.length <= 2) return;
        const removed = chart.columns[columnIndex];
        saveChart({
          ...chart,
          columns: chart.columns.filter((_, index) => index !== columnIndex),
          rows: chart.rows.map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => key !== removed))),
        });
      };
      const addRow = () => saveChart({ ...chart, rows: [...chart.rows, Object.fromEntries(chart.columns.map((column) => [column, ""]))] });
      const syncSizes = () => {
        if (!selectedSizes.length) return;
        const sizeColumn = chart.columns[0];
        const currentBySize = new Map(chart.rows.map((row) => [row[sizeColumn], row]));
        saveChart({
          ...chart,
          rows: selectedSizes.map((size) => ({ ...Object.fromEntries(chart.columns.map((column) => [column, ""])), ...currentBySize.get(size), [sizeColumn]: size })),
        });
      };
      return <div className="size-chart-editor">
        <div className="size-chart-toolbar">
          <label><span>计量单位</span><select value={chart.unit} onChange={(event) => saveChart({ ...chart, unit: event.target.value === "in" ? "in" : "cm" })}><option value="cm">厘米 cm</option><option value="in">英寸 in</option></select></label>
          <label><span>允许误差（±）</span><input value={chart.tolerance} onChange={(event) => saveChart({ ...chart, tolerance: event.target.value })} placeholder="例如 1-2" /></label>
          <button type="button" disabled={!selectedSizes.length} onClick={syncSizes}>↻ 同步可选尺码</button>
          <button type="button" onClick={addColumn}>＋ 测量列</button>
        </div>
        <div className="size-chart-scroll">
          <table>
            <thead><tr>{chart.columns.map((column, columnIndex) => <th key={`${column}-${columnIndex}`}><input aria-label={`第${columnIndex + 1}列名称`} value={column} readOnly={columnIndex === 0} onChange={(event) => renameColumn(columnIndex, event.target.value)} />{columnIndex > 0 && <button type="button" aria-label={`删除${column}列`} onClick={() => removeColumn(columnIndex)}>×</button>}</th>)}<th /></tr></thead>
            <tbody>{chart.rows.map((row, rowIndex) => <tr key={rowIndex}>{chart.columns.map((column, columnIndex) => <td key={`${column}-${columnIndex}`}><input aria-label={`${row[column] || `第${rowIndex + 1}行`}${column}`} value={row[column] || ""} onChange={(event) => updateCell(rowIndex, column, event.target.value)} placeholder={columnIndex === 0 ? "如 XL" : "0"} /></td>)}<td><button type="button" aria-label={`删除第${rowIndex + 1}行`} onClick={() => saveChart({ ...chart, rows: chart.rows.filter((_, index) => index !== rowIndex) })}>×</button></td></tr>)}</tbody>
          </table>
        </div>
        <button className="size-chart-add-row" type="button" onClick={addRow}>＋ 添加尺码行</button>
        <p>第一列填写尺码名称；其余列可改为裙长、腰围、臀围、衣长、胸围等。</p>
      </div>;
    }
    if (inputType === "select") return <select required={Boolean(param.required)} value={value} onChange={(event) => change(event.target.value)}><option value="">请选择</option>{options.map((option) => <option key={option}>{option}</option>)}</select>;
    if (inputType === "multi_select" || inputType === "tag_input") {
      const selected = parseParamList(value);
      const toggle = (option: string) => change(JSON.stringify(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]));
      const addCustom = (custom: string) => {
        const next = custom.trim();
        if (next && !selected.includes(next)) change(JSON.stringify([...selected, next]));
      };
      return <div className={`multi-param ${inputType === "tag_input" ? "free-entry" : ""}`}>
        {options.length > 0 && <div className="multi-param-options">{options.map((option) => <button type="button" key={option} className={selected.includes(option) ? "active" : ""} onClick={() => toggle(option)}><i>{selected.includes(option) ? "✓" : "+"}</i>{option}</button>)}</div>}
        <div className="multi-param-custom"><input aria-label={`添加${String(param.name)}自定义值`} placeholder={inputType === "tag_input" ? "填写材质后按回车，例如 95%棉+5%氨纶" : `添加其他${String(param.name)}`} onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          addCustom(event.currentTarget.value);
          event.currentTarget.value = "";
        }} /><button type="button" onClick={(event) => {
          const input = event.currentTarget.previousElementSibling as HTMLInputElement | null;
          if (!input) return;
          addCustom(input.value);
          input.value = "";
        }}>添加</button></div>
        {selected.length > 0 && <div className="multi-param-selected"><span>已选择 {selected.length} 项</span>{selected.map((item) => <button type="button" key={item} onClick={() => toggle(item)}>{item}<i>×</i></button>)}</div>}
      </div>;
    }
    if (inputType === "number") return <input required={Boolean(param.required)} value={value} onChange={(event) => change(event.target.value)} type="number" min="0" placeholder={String(param.unit || "")} />;
    if (inputType === "boolean") return <select required={Boolean(param.required)} value={value} onChange={(event) => change(event.target.value)}><option value="">请选择</option><option value="是">是</option><option value="否">否</option></select>;
    return <input required={Boolean(param.required)} value={value} onChange={(event) => change(event.target.value)} />;
  };

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (kind === "product" || kind === "productParams") {
        const missing = selectedCategoryParams.filter((param) => Boolean(param.required) && parseParamList(paramValues[String(param.param_id)]).length === 0);
        if (missing.length) throw new Error(`请填写必填参数：${missing.map((param) => String(param.name)).join("、")}`);
      }
      if (kind === "asset") {
        if (!file) throw new Error("请选择要上传的素材文件");
        const form = new FormData();
        form.set("entity", "asset");
        form.set("name", draft.name || file.name);
        form.set("category", draft.asset_category);
        form.set("file", file);
        await submit(form);
      } else {
        const payloads: Record<ActionKind, Record<string, unknown>> = {
          order: { entity: kind, customer_name: draft.customer_name, product_name: draft.product_name, amount: Number(draft.amount), status: draft.status, payment_status: draft.payment_status },
          customer: { entity: kind, name: draft.name, email: draft.email, tier: draft.tier },
          product: { entity: kind, name: draft.name, spu_code: draft.sku, category_code: draft.category, price: Number(draft.price), cost: Number(draft.cost), stock: Number(draft.stock), status: draft.product_status, params: paramValues },
          productParams: { entity: "product_params", product_id: target?.id, category_code: draft.category, params: paramValues },
          asset: {},
          production: { entity: kind, order_id: draft.order_id, note: draft.note },
          shipping: { entity: kind, order_ids: selectedOrders, carrier: draft.carrier },
          content: { entity: kind, title: draft.title, content_type: draft.content_type, status: draft.content_status, summary: draft.summary },
          admin: { entity: kind, name: draft.name, email: draft.email, role: draft.role },
          refund: { entity: kind, order_id: draft.refund_order_id, amount: Number(draft.refund_amount), reason: draft.refund_reason },
        };
        await submit(payloads[kind]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "操作失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  return <div className="action-modal-wrap">
    <button className="action-modal-scrim" aria-label="关闭" onClick={close} />
    <form className="action-modal" onSubmit={save}>
      <header><div><small>ADMIN ACTION</small><h2>{labels[kind][0]}</h2><p>{labels[kind][1]}</p></div><button type="button" onClick={close}>×</button></header>
      <section className="action-form">
        {kind === "order" && <>
          <label><span>客户姓名 *</span><input autoFocus required value={draft.customer_name} onChange={(e) => field("customer_name", e.target.value)} placeholder="例如 Emma Wilson" /></label>
          <label><span>商品与数量 *</span><input required value={draft.product_name} onChange={(e) => field("product_name", e.target.value)} placeholder="例如 经典纯棉 T 恤 × 10" /></label>
          <label><span>订单金额 *</span><input required min="0.01" step="0.01" type="number" value={draft.amount} onChange={(e) => field("amount", e.target.value)} /></label>
          <label><span>订单状态</span><select value={draft.status} onChange={(e) => field("status", e.target.value)}>{statusOptions.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label><span>付款状态</span><select value={draft.payment_status} onChange={(e) => field("payment_status", e.target.value)}><option>待付款</option><option>已付款</option></select></label>
        </>}
        {kind === "customer" && <>
          <label><span>客户姓名 *</span><input autoFocus required value={draft.name} onChange={(e) => field("name", e.target.value)} /></label>
          <label><span>邮箱 *</span><input required type="email" value={draft.email} onChange={(e) => field("email", e.target.value)} /></label>
          <label><span>会员等级</span><select value={draft.tier} onChange={(e) => field("tier", e.target.value)}><option>免费版</option><option>专业版</option><option>VIP</option></select></label>
        </>}
        {kind === "product" && <>
          <label><span>商品名称 *</span><input autoFocus required value={draft.name} onChange={(e) => field("name", e.target.value)} /></label>
          <label><span>SPU 编码 *</span><input required value={draft.sku} onChange={(e) => field("sku", e.target.value.toUpperCase())} placeholder="TEE-002" /></label>
          <label><span>类目模板</span><select value={draft.category} onChange={(e) => { field("category", e.target.value); setParamValues({}); }}><option>服装</option><option>家居</option><option>数码</option><option>配饰</option><option>其他</option></select></label>
          <div className="field-row"><label><span>售价 *</span><input required type="number" min="0" value={draft.price} onChange={(e) => field("price", e.target.value)} /></label><label><span>成本</span><input type="number" min="0" value={draft.cost} onChange={(e) => field("cost", e.target.value)} /></label><label><span>库存</span><input type="number" min="0" value={draft.stock} onChange={(e) => field("stock", e.target.value)} /></label></div>
          <div className="eav-fields"><header><div><b>{draft.category}参数模板</b><small>选择类目后自动加载 · * 为必填</small></div><em>{selectedCategoryParams.length} 项参数</em></header><div>{selectedCategoryParams.map((param) => <label className={String(param.input_type) === "size_chart" ? "size-chart-field" : ""} key={String(param.param_id)}><span>{String(param.name)}{Boolean(param.required) ? " *" : ""}{param.unit ? `（${String(param.unit)}）` : ""}</span>{parameterField(param)}{String(param.input_type) === "multi_select" && (() => { let options: string[] = []; try { options = JSON.parse(String(param.options_json || "[]")); } catch { /* empty */ } return <datalist id={`options-${String(param.param_id)}`}>{options.map((option) => <option key={option} value={option} />)}</datalist>; })()}</label>)}</div></div>
          <label><span>状态（上架后同步前台）</span><select value={draft.product_status} onChange={(e) => field("product_status", e.target.value)}><option>上架</option><option>草稿</option><option>下架</option></select></label>
        </>}
        {kind === "productParams" && <>
          <div className="parameter-product-summary"><span><small>SPU</small><b>{String(target?.sku || "")}</b></span><span><small>商品</small><b>{String(target?.name || "")}</b></span></div>
          <label><span>类目模板</span><select value={draft.category} onChange={(e) => { field("category", e.target.value); setParamValues({}); }}><option>服装</option><option>家居</option><option>数码</option><option>配饰</option><option>其他</option></select></label>
          {selectedCategoryParams.length ? <div className="eav-fields"><header><div><b>{draft.category}参数模板</b><small>修改后保存，商品卡片立即更新 · * 为必填</small></div><em>{selectedCategoryParams.length} 项参数</em></header><div>{selectedCategoryParams.map((param) => <label className={String(param.input_type) === "size_chart" ? "size-chart-field" : ""} key={String(param.param_id)}><span>{String(param.name)}{Boolean(param.required) ? " *" : ""}{param.unit ? `（${String(param.unit)}）` : ""}</span>{parameterField(param)}{String(param.input_type) === "multi_select" && (() => { let options: string[] = []; try { options = JSON.parse(String(param.options_json || "[]")); } catch { /* empty */ } return <datalist id={`options-${String(param.param_id)}`}>{options.map((option) => <option key={option} value={option} />)}</datalist>; })()}</label>)}</div></div> : <div className="empty-param-template"><b>这个类目还没有参数模板</b><span>请先选择已有模板类目，或后续在类目模板管理中绑定参数。</span></div>}
        </>}
        {kind === "asset" && <>
          <label><span>素材名称</span><input value={draft.name} onChange={(e) => field("name", e.target.value)} placeholder="留空则使用文件名" /></label>
          <label><span>素材分类</span><select value={draft.asset_category} onChange={(e) => field("asset_category", e.target.value)}><option>图案</option><option>字体</option><option>Mockup</option><option>版式</option><option>品牌资源</option></select></label>
          <label className="file-drop"><input required type="file" accept="image/*,.pdf,.svg,.ai,.psd,.ttf,.otf,.zip" onChange={(e) => setFile(e.target.files?.[0] || null)} /><b>{file ? file.name : "点击选择或拖入素材文件"}</b><small>{file ? `${Math.round(file.size / 1024)} KB` : "PNG、JPG、SVG、PDF、字体或设计文件"}</small></label>
        </>}
        {kind === "production" && <>
          <label><span>选择订单 *</span><select required value={draft.order_id} onChange={(e) => field("order_id", e.target.value)}>{data.orders.map((o) => <option key={String(o.id)} value={String(o.id)}>{String(o.id)} · {String(o.product_name)}</option>)}</select></label>
          <label><span>生产备注</span><textarea value={draft.note} onChange={(e) => field("note", e.target.value)} placeholder="工艺、交期、供应商要求…" /></label>
        </>}
        {kind === "shipping" && <>
          <label><span>物流商</span><select value={draft.carrier} onChange={(e) => field("carrier", e.target.value)}><option>USPS Priority</option><option>UPS Ground</option><option>FedEx Ground</option><option>DHL Express</option></select></label>
          <fieldset className="order-checks"><legend>选择待发货订单 *</legend>{availableShipping.length ? availableShipping.map((o) => <label key={String(o.id)}><input type="checkbox" checked={selectedOrders.includes(String(o.id))} onChange={(e) => setSelectedOrders((current) => e.target.checked ? [...current, String(o.id)] : current.filter((id) => id !== String(o.id)))} /><span><b>{String(o.id)}</b><small>{String(o.customer_name)} · {String(o.product_name)}</small></span></label>) : <p>没有待发货订单</p>}</fieldset>
        </>}
        {kind === "content" && <>
          <label><span>内容标题 *</span><input autoFocus required value={draft.title} onChange={(e) => field("title", e.target.value)} /></label>
          <label><span>内容类型</span><select value={draft.content_type} onChange={(e) => field("content_type", e.target.value)}><option>页面内容</option><option>Banner</option><option>自动邮件</option><option>SEO</option><option>帮助中心</option></select></label>
          <label><span>摘要</span><textarea value={draft.summary} onChange={(e) => field("summary", e.target.value)} /></label>
          <label><span>状态</span><select value={draft.content_status} onChange={(e) => field("content_status", e.target.value)}><option>草稿</option><option>已发布</option><option>已启用</option></select></label>
        </>}
        {kind === "admin" && <>
          <label><span>管理员姓名</span><input autoFocus value={draft.name} onChange={(e) => field("name", e.target.value)} /></label>
          <label><span>邮箱 *</span><input required type="email" value={draft.email} onChange={(e) => field("email", e.target.value)} /></label>
          <label><span>角色</span><select value={draft.role} onChange={(e) => field("role", e.target.value)}><option>Operations</option><option>Product Manager</option><option>Production</option><option>Finance</option><option>Support</option></select></label>
        </>}
        {kind === "refund" && <>
          <label><span>已付款订单 *</span><select required value={draft.refund_order_id} onChange={(e) => { field("refund_order_id", e.target.value); const order = data.orders.find((o) => String(o.id) === e.target.value); if (order) field("refund_amount", String(order.amount)); }}><option value="">请选择订单</option>{data.orders.filter((o) => o.payment_status === "已付款").map((o) => <option key={String(o.id)} value={String(o.id)}>{String(o.id)} · {String(o.customer_name)} · {money(o.amount)}</option>)}</select></label>
          <label><span>退款金额 *</span><input required type="number" min="0.01" step="0.01" value={draft.refund_amount} onChange={(e) => field("refund_amount", e.target.value)} /></label>
          <label><span>退款原因 *</span><textarea required value={draft.refund_reason} onChange={(e) => field("refund_reason", e.target.value)} placeholder="客户取消、质量问题或重复付款…" /></label>
        </>}
        {error && <p className="form-error">{error}</p>}
      </section>
      <footer><button type="button" className="outline" onClick={close}>取消</button><button className="admin-primary" disabled={saving}>{saving ? "正在保存…" : kind === "shipping" ? `确认发货（${selectedOrders.length}）` : "确认保存"}</button></footer>
    </form>
  </div>;
}

function DetailDrawer({ item, close, update }: { item: RecordRow; close: () => void; update: UpdateFn }) {
  const isOrder = Boolean(item.product_name);
  return <div className="drawer-wrap"><button className="drawer-scrim" aria-label="关闭详情" onClick={close} /><aside className="detail-drawer"><header><div><small>{isOrder ? "订单详情" : "客户详情"}</small><h2>{String(isOrder ? item.id : item.name)}</h2></div><button onClick={close}>×</button></header>{isOrder ? <><section><h3>客户与商品</h3><dl><div><dt>客户</dt><dd>{String(item.customer_name)}</dd></div><div><dt>商品</dt><dd>{String(item.product_name)}</dd></div><div><dt>订单金额</dt><dd>{money(item.amount)}</dd></div><div><dt>创建时间</dt><dd>{date(item.created_at)}</dd></div></dl></section><section><h3>订单流程</h3><label>订单状态<select value={String(item.status)} onChange={(e) => update("order", String(item.id), "status", e.target.value)}>{statusOptions.map((s) => <option key={s}>{s}</option>)}</select></label><label>付款状态<select value={String(item.payment_status)} onChange={(e) => update("order", String(item.id), "payment_status", e.target.value)}><option>待付款</option><option>已付款</option><option>退款中</option><option>已退款</option></select></label><label>生产状态<select value={String(item.production_status)} onChange={(e) => update("order", String(item.id), "production_status", e.target.value)}><option>未开始</option><option>待排产</option><option>印刷中</option><option>质检中</option><option>已完成</option></select></label></section></> : <><section><h3>客户资料</h3><dl><div><dt>邮箱</dt><dd>{String(item.email)}</dd></div><div><dt>会员等级</dt><dd>{String(item.tier)}</dd></div><div><dt>订单数量</dt><dd>{String(item.order_count)}</dd></div><div><dt>累计消费</dt><dd>{money(item.total_spent)}</dd></div></dl></section><section><h3>账户状态</h3><label>状态<select value={String(item.status)} onChange={(e) => update("customer", String(item.id), "status", e.target.value)}><option>正常</option><option>需关注</option><option>已停用</option></select></label></section></>}<footer><button className="outline" onClick={close}>关闭</button><button className="admin-primary" onClick={close}>完成</button></footer></aside></div>;
}
