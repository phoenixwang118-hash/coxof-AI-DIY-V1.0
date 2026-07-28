"use client";

import { useEffect, useMemo, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type View = "landing" | "dashboard" | "catalog" | "product" | "assets" | "design" | "canvas" | "mockup" | "projects" | "cart" | "checkout" | "orders" | "account" | "help";
type GenerationModel = "gemini-flash" | "gemini-pro" | "flux-pro";
type DesignState = { variant: number; headline: string; subline: string; color: string; scale: number; rotation: number; x: number; y: number };
type Project = { id: string; name: string; productId: number; prompt: string; model?: GenerationModel; design: DesignState; updatedAt: string };
type Order = { id: string; productId: number; projectName: string; size: string; quantity: number; total: number; status: string; createdAt: string };
type CartItem = { id: string; productId: number; projectName: string; size: string; quantity: number; unitPrice: number; design: DesignState };
type Address = { name: string; phone: string; country: string; state: string; city: string; line1: string; postalCode: string };
type ProSettings = { style: string; illustration: string; typography: string; layout: string; composition: string };
type ReferenceImage = { name: string; url: string };
type WorkspaceProfile = { displayName: string; workspaceName: string; market: string; address: Address; plan: string; creditsUsed: number; creditsLimit: number };
type HelpArticle = { icon: string; title: string; text: string; body: string[] };
type CatalogProduct = {
  id: number; name: string; category: string; price: string; size: string; tone: string; visualType: string;
  badge?: string; sourceId?: string; spuCode?: string;
  sizes?: string[]; colors?: string[]; materials?: string[]; printAreas?: string[];
  sizeChart?: { unit: "cm" | "in"; tolerance: string; columns: string[]; rows: Array<Record<string, string>> };
};

const defaultProducts: CatalogProduct[] = [
  { id: 1, name: "经典纯棉 T 恤", category: "服装", price: "¥39", size: "前胸 / 后背", tone: "cream", visualType: "1", badge: "热门", sizes: ["S","M","L","XL","2XL"], colors: ["自然白","经典黑","沙岩灰"], materials: ["纯棉"], printAreas: ["前胸","后背"] },
  { id: 2, name: "连帽卫衣", category: "服装", price: "¥89", size: "前胸 / 后背 / 左袖", tone: "black", visualType: "2", sizes: ["S","M","L","XL","2XL"], colors: ["经典黑","自然白","灰色"], materials: ["棉涤混纺"], printAreas: ["前胸","后背","左袖"] },
  { id: 3, name: "陶瓷马克杯", category: "家居", price: "¥29", size: "20×8.5 cm", tone: "white", visualType: "3" },
  { id: 4, name: "装饰挂画", category: "家居", price: "¥99", size: "40×60 cm", tone: "sand", visualType: "4", badge: "新品" },
  { id: 5, name: "艺术海报", category: "家居", price: "¥19", size: "A2 / 42×59.4 cm", tone: "pink", visualType: "5" },
  { id: 6, name: "方形抱枕", category: "家居", price: "¥49", size: "45×45 cm", tone: "yellow", visualType: "6" },
  { id: 7, name: "手机壳", category: "数码", price: "¥35", size: "多机型适配", tone: "blue", visualType: "7" },
  { id: 8, name: "帆布托特包", category: "配饰", price: "¥45", size: "35×40 cm", tone: "canvas", visualType: "8" },
];

const baseCategories = ["全部", "服装", "家居", "数码", "配饰"];
const designAssets = [
  { id: 1, title: "复古户外徽章", category: "热门模板", headline: "EXPLORE MORE", subline: "COXOF OUTDOORS", color: "#eee3c5", variant: 1 },
  { id: 2, title: "落日公路系列", category: "复古美式", headline: "KEEP MOVING", subline: "OPEN ROAD CLUB", color: "#f2d49d", variant: 2 },
  { id: 3, title: "海岸旅行系列", category: "夏日旅行", headline: "COASTAL DAYS", subline: "PACIFIC EDITION", color: "#e8dfbd", variant: 3 },
  { id: 4, title: "自然植物系列", category: "植物花卉", headline: "GROW WILD", subline: "BOTANICAL CLUB", color: "#282d24", variant: 4 },
  { id: 5, title: "宠物姓名模板", category: "个性定制", headline: "BEST FRIEND", subline: "CUSTOM PET CLUB", color: "#eee3c5", variant: 1 },
  { id: 6, title: "节日礼物模板", category: "节日设计", headline: "MERRY & BRIGHT", subline: "HOLIDAY EDITION", color: "#f2d49d", variant: 2 },
];
const modelOptions: { id: GenerationModel; name: string; badge: string; description: string; strength: string }[] = [
  { id: "gemini-flash", name: "Gemini 3.1 Flash Image", badge: "推荐", description: "快速批量、文字图案、参考图修改", strength: "速度与成本平衡" },
  { id: "gemini-pro", name: "Gemini 3 Pro Image", badge: "高质量", description: "复杂商业版式、精细文字与 Mockup", strength: "商业设计质量" },
  { id: "flux-pro", name: "FLUX.2 Pro", badge: "写实", description: "产品场景、材质光影与 AI 模特", strength: "写实视觉表现" },
];
const initialDesign: DesignState = { variant: 1, headline: "EXPLORE MORE", subline: "COXOF OUTDOORS", color: "#eee3c5", scale: 100, rotation: 0, x: 0, y: 0 };
const initialPro: ProSettings = { style: "复古徽章", illustration: "扁平矢量", typography: "粗衬线体", layout: "居中徽章", composition: "主体突出" };
const helpArticles: HelpArticle[] = [
  { icon: "✦", title: "AI 设计", text: "模型选择、提示词、文生图和图生图", body: ["先选择商品，再选择文生图或图生图。", "描述主题、文字、风格和目标市场后生成四个方案。", "选择方案进入 Canvas，可继续调整文字、颜色、大小和位置。"] },
  { icon: "□", title: "Canvas 编辑", text: "文字、图层、安全区和透明 PNG", body: ["拖动图案可以改变位置，右侧参数可以精确控制。", "图案应保持在安全印刷区内，避免裁切。", "完成后可导出 4500 × 5400 px 透明 PNG。"] },
  { icon: "♙", title: "Mockup 与商品", text: "商品规格、样机预览和生产文件", body: ["Mockup 会同步当前商品、颜色、尺码和印刷区域。", "确认数量与效果后可保存项目或加入购物车。", "正式生产前仍建议检查材质和工艺限制。"] },
  { icon: "▤", title: "订单与配送", text: "结算、订单状态、运费和物流", body: ["购物车支持修改数量、返回编辑或移除商品。", "结算分为地址、配送和付款确认三步。", "订单创建后可以在订单中心查看或取消。"] },
  { icon: "◎", title: "账户与点数", text: "套餐、AI 点数和品牌工作区", body: ["账户中心可修改品牌名称、默认市场与地址。", "AI 生成会记录点数使用量。", "套餐可在账户中心切换并保存到工作区。"] },
  { icon: "!", title: "生产要求", text: "300 DPI、色彩、印刷区和质量检查", body: ["推荐使用透明背景 PNG 和 300 DPI 输出。", "不同商品的可印刷区域由后台类目参数模板控制。", "深色商品建议检查白墨层和图案对比度。"] },
];

function makeId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `cx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ProductArt({ product, compact = false }: { product: CatalogProduct; compact?: boolean }) {
  return (
    <div className={`product-art tone-${product.tone} ${compact ? "compact" : ""}`}>
      <div className={`product-object object-${product.visualType}`}>
        <span>{product.visualType === "skirt" ? "YOUR\nDESIGN" : product.id % 2 ? "MAKE\nYOURS" : "COXOF"}</span>
      </div>
    </div>
  );
}

function Artwork({ design, reference, onMove }: { design: DesignState; reference?: ReferenceImage | null; onMove?: (x: number, y: number) => void }) {
  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!onMove) return;
    event.preventDefault();
    const target = event.currentTarget;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = design.x;
    const originY = design.y;
    target.setPointerCapture(pointerId);
    const move = (next: PointerEvent) => {
      onMove(
        Math.max(-90, Math.min(90, originX + next.clientX - startX)),
        Math.max(-90, Math.min(90, originY + next.clientY - startY)),
      );
    };
    const end = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", end);
      target.removeEventListener("pointercancel", end);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", end);
    target.addEventListener("pointercancel", end);
  }

  return <div className={`generated art-${design.variant} ${onMove ? "draggable-art" : ""}`} style={{ color: design.color }} onPointerDown={startDrag}>
    {reference && <img className="reference-layer" src={reference.url} alt="" />}
    <div className="art-transform" style={{ transform: `translate(${design.x}px,${design.y}px) rotate(${design.rotation}deg) scale(${design.scale / 100})` }}>
      <i className="sun" /><i className="mountain" /><strong>{design.headline || "YOUR TEXT"}</strong><small>{design.subline || "COXOF ORIGINAL"}</small>
    </div>
  </div>;
}

function Flow({ active }: { active: number }) {
  return <div className="steps flow-steps">{["产品","AI 设计","Canvas","Mockup"].map((label, i) => <span key={label} className={active === i + 1 ? "active" : active > i + 1 ? "done" : ""}><b>{active > i + 1 ? "✓" : i + 1}</b>{label}</span>)}</div>;
}

function Landing({ start, workspace, catalog }: { start: () => void; workspace: () => void; catalog: () => void }) {
  const gallery = [
    { variant: 1, headline: "WILD", subline: "BOTANICAL CLUB", color: "#f5d78d", name: "植物花卉" },
    { variant: 2, headline: "GO WEST", subline: "DESERT EDITION", color: "#ffd27f", name: "复古户外" },
    { variant: 3, headline: "COAST", subline: "SUMMER DAYS", color: "#d9f4ff", name: "夏日旅行" },
    { variant: 4, headline: "BLOOM", subline: "FLORAL STUDIO", color: "#ffe1ed", name: "浪漫花型" },
    { variant: 2, headline: "CREATE", subline: "YOUR OWN WAY", color: "#f1dcff", name: "潮流文字" },
    { variant: 1, headline: "MERRY", subline: "HOLIDAY CLUB", color: "#fff1c6", name: "节日礼物" },
  ];
  return <div className="landing-page one-page-landing">
    <header className="landing-nav one-nav">
      <a className="landing-brand" href="#top" aria-label="coxof AI DIY POD 首页">
        <span className="brand-logo-crop landing-logo-crop">
          <img src="/coxof-ai-diy-pod-logo.png" alt="coxof AI DIY POD" />
        </span>
      </a>
      <nav><button onClick={catalog}>产品目录</button><button onClick={workspace}>我的项目</button></nav>
      <div><button className="landing-login" onClick={workspace}>进入工作台</button><button className="landing-cta small" onClick={start}>免费开始设计 ↗</button></div>
    </header>
    <main id="top" className="one-page-main">
      <section className="one-page-hero">
        <div className="landing-grid" /><div className="landing-glow one" /><div className="landing-glow two" />
        <div className="one-flow">
          <span><b>01</b><i>◫</i><strong>选择商品</strong><small>T恤 · 马克杯 · 海报</small></span>
          <em>→</em>
          <span><b>02</b><i>✦</i><strong>AI 生成图案</strong><small>文字或参考图创作</small></span>
          <em>→</em>
          <span><b>03</b><i>✓</i><strong>预览并下单</strong><small>Mockup 确认生产</small></span>
          <button onClick={start}>开始创作 <b>→</b></button>
        </div>
        <div className="one-copy">
          <span className="landing-kicker"><i /> AI 设计 × POD 商品定制</span>
          <h1>一个想法，<br /><em>马上变成商品。</em></h1>
          <p>输入文字或上传图片，AI 自动生成商业图案、商品 Mockup，并完成定制下单。</p>
          <div className="landing-actions"><button className="landing-cta" onClick={start}>✦ 免费生成第一款 <b>→</b></button><button className="landing-ghost" onClick={catalog}>选择商品</button></div>
          <div className="one-models"><span><i /> Ideogram</span><span><i /> Gemini</span><span><i /> FLUX</span></div>
        </div>
        <div className="one-showcase">
          <div className="one-product-card">
            <span className="visual-badge">AI GENERATED</span>
            <ProductArt product={defaultProducts[0]} />
            <div className="product-caption"><span><small>当前商品</small><strong>经典纯棉 T 恤</strong></span><b>效果预览 ✓</b></div>
          </div>
        </div>
        <div className="one-patterns">
          <div className="one-pattern-head"><span>DESIGN WALL</span><strong>选择灵感，生成你的版本</strong></div>
          <div className="one-pattern-grid">{gallery.map((item, index) => <button key={`${item.name}-${index}`} onClick={start} className={`one-pattern pattern-${index + 1}`} aria-label={`生成${item.name}图案`}><Artwork design={{...initialDesign, variant:item.variant, headline:item.headline, subline:item.subline, color:item.color}} /><span>{item.name}</span></button>)}</div>
        </div>
      </section>
    </main>
  </div>;
}

export default function Home() {
  const [products, setProducts] = useState<CatalogProduct[]>(defaultProducts);
  const [view, setView] = useState<View>("landing");
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState<CatalogProduct>(defaultProducts[0]);
  const [mode, setMode] = useState<"text" | "image">("text");
  const [model, setModel] = useState<GenerationModel>("gemini-flash");
  const [control, setControl] = useState<"auto" | "pro">("auto");
  const [proSettings, setProSettings] = useState<ProSettings>(initialPro);
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [prompt, setPrompt] = useState("复古日落下的山脉与松树，加入 “EXPLORE MORE” 英文字体，适合美国户外爱好者");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(1);
  const [design, setDesign] = useState<DesignState>(initialDesign);
  const [undoDesign, setUndoDesign] = useState<DesignState | null>(null);
  const [redoDesign, setRedoDesign] = useState<DesignState | null>(null);
  const [projectName, setProjectName] = useState("户外复古系列 01");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("M");
  const [productColor, setProductColor] = useState("自然白");
  const [printArea, setPrintArea] = useState("前胸");
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [address, setAddress] = useState<Address>({ name: "Phoenix Wang", phone: "", country: "United States", state: "", city: "", line1: "", postalCode: "" });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");
  const [assetCategory, setAssetCategory] = useState("全部");
  const [assetQuery, setAssetQuery] = useState("");
  const [galleryView, setGalleryView] = useState<"front" | "detail" | "print">("front");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [checkoutError, setCheckoutError] = useState("");
  const [avatar, setAvatar] = useState("");
  const [planOpen, setPlanOpen] = useState(false);
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [helpQuery, setHelpQuery] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [cloudReady, setCloudReady] = useState(false);
  const [profile, setProfile] = useState<WorkspaceProfile>({
    displayName: "Phoenix Wang", workspaceName: "coxof POD Studio", market: "US",
    address: { name: "Phoenix Wang", phone: "", country: "United States", state: "", city: "", line1: "", postalCode: "" },
    plan: "Creator 专业版", creditsUsed: 320, creditsLimit: 1000,
  });

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        if (!response.ok) throw new Error("catalog unavailable");
        const data = await response.json() as { products?: CatalogProduct[] };
        const managed = data.products ?? [];
        const managedNames = new Set(managed.map((item) => item.name));
        setProducts([...managed, ...defaultProducts.filter((item) => !managedNames.has(item.name))]);
      } catch {
        setProducts(defaultProducts);
      }
    };
    const timer = window.setTimeout(loadCatalog, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setAvatar(localStorage.getItem("coxof-avatar") || "");
  }, []);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const response = await fetch("/api/workspace", { cache: "no-store" });
        if (!response.ok) throw new Error("workspace unavailable");
        const data = await response.json() as { projects: Project[]; orders: Order[]; cart: CartItem[]; profile: WorkspaceProfile };
        setProjects(data.projects ?? []);
        setOrders(data.orders ?? []);
        setCart(data.cart ?? []);
        if (data.profile) {
          setProfile(data.profile);
          if (data.profile.address && Object.keys(data.profile.address).length) {
            setAddress({ ...profile.address, ...data.profile.address });
          }
        }
        setCloudReady(true);
      } catch {
        try {
          setProjects(JSON.parse(localStorage.getItem("coxof-projects") || "[]"));
          setOrders(JSON.parse(localStorage.getItem("coxof-orders") || "[]"));
          setCart(JSON.parse(localStorage.getItem("coxof-cart") || "[]"));
          const savedAddress = localStorage.getItem("coxof-address");
          if (savedAddress) setAddress(JSON.parse(savedAddress));
        } catch { /* keep empty data */ }
      }
    };
    const timer = window.setTimeout(loadWorkspace, 0);
    return () => window.clearTimeout(timer);
    // Initial profile is only a safe fallback while the cloud workspace loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(
    () =>
      products.filter(
        (item) =>
          (category === "全部" || item.category === category) &&
          item.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [category, query, products],
  );
  const categories = useMemo(
    () => [...baseCategories, ...products.map((item) => item.category).filter((item) => !baseCategories.includes(item))],
    [products],
  );
  const filteredAssets = useMemo(
    () => designAssets.filter((item) =>
      (assetCategory === "全部" || item.category === assetCategory) &&
      `${item.title} ${item.category} ${item.headline} ${item.subline}`.toLowerCase().includes(assetQuery.toLowerCase())),
    [assetCategory, assetQuery],
  );
  const filteredHelp = useMemo(
    () => helpArticles.filter((item) => `${item.title} ${item.text} ${item.body.join(" ")}`.toLowerCase().includes(helpQuery.toLowerCase())),
    [helpQuery],
  );
  const globalResults = useMemo(() => {
    const term = globalQuery.trim().toLowerCase();
    if (!term) return [];
    return [
      ...products.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(term)).slice(0, 4).map((item) => ({ type: "product" as const, label: item.name, meta: item.category, item })),
      ...projects.filter((item) => item.name.toLowerCase().includes(term)).slice(0, 3).map((item) => ({ type: "project" as const, label: item.name, meta: "设计项目", item })),
      ...designAssets.filter((item) => `${item.title} ${item.category}`.toLowerCase().includes(term)).slice(0, 3).map((item) => ({ type: "asset" as const, label: item.title, meta: item.category, item })),
    ];
  }, [globalQuery, products, projects]);

  function openDesign(next: CatalogProduct = product) {
    setProduct(next);
    setSize(next.sizes?.[0] || (next.category === "服装" ? "M" : "标准"));
    setProductColor(next.colors?.[0] || "默认颜色");
    setPrintArea(next.printAreas?.[0] || next.size || "标准印刷区");
    setView("design");
    setResults(false);
    setActiveProjectId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProduct(next: CatalogProduct) {
    setProduct(next);
    setSize(next.sizes?.[0] || (next.category === "服装" ? "M" : "标准"));
    setProductColor(next.colors?.[0] || "默认颜色");
    setPrintArea(next.printAreas?.[0] || next.size || "标准印刷区");
    setGalleryView("front");
    setQuantity(1);
    setView("product");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function generate() {
    if (mode === "image" && !referenceImage) {
      setUploadError("请先上传一张参考图");
      return;
    }
    if (profile.creditsLimit - profile.creditsUsed < 4) {
      setPlanOpen(true);
      setToast("AI 点数不足，请升级套餐");
      return;
    }
    setGenerating(true);
    setResults(false);
    window.setTimeout(() => {
      const quoted = prompt.match(/[“"「『](.+?)[”"」』]/)?.[1];
      const words = prompt.replace(/[，。,.!！]/g, " ").trim().split(/\s+/);
      const headline = (quoted || words.slice(0, 2).join(" ") || "CREATE MORE").slice(0, 24).toUpperCase();
      const seed = [...prompt].reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const variant = (seed % 4) + 1;
      const colors = ["#eee3c5", "#f6d38b", "#d8efff", "#ffdbe9"];
      const nextDesign = { ...initialDesign, variant, headline, subline: product.name.toUpperCase().slice(0, 24), color: colors[seed % colors.length] };
      setGenerating(false);
      setResults(true);
      setSelectedVariant(variant);
      setDesign(nextDesign);
      const nextProfile = { ...profile, creditsUsed: Math.min(profile.creditsLimit, profile.creditsUsed + 4) };
      setProfile(nextProfile);
      void syncWorkspace("profile", "upsert", { ...nextProfile, address });
    }, 1400);
  }

  function navigate(next: View) {
    setView(next);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function persistProjects(next: Project[]) {
    setProjects(next);
    localStorage.setItem("coxof-projects", JSON.stringify(next));
  }

  async function syncWorkspace(entity: "project" | "cart" | "order" | "profile", operation: "upsert" | "delete" | "clear", data?: unknown, id?: string) {
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entity, operation, data, id }),
      });
      if (!response.ok) throw new Error("sync failed");
      setCloudReady(true);
    } catch {
      setCloudReady(false);
      setToast("已保存在当前设备；云端同步暂时不可用");
    }
  }

  function saveProject(goToList = true) {
    const now = new Date().toISOString();
    const saved: Project = { id: activeProjectId || makeId(), name: projectName || "未命名项目", productId: product.id, prompt, model, design, updatedAt: now };
    const next = activeProjectId ? [saved, ...projects.filter((item) => item.id !== activeProjectId)] : [saved, ...projects];
    setActiveProjectId(saved.id);
    persistProjects(next);
    void syncWorkspace("project", "upsert", saved);
    setToast(activeProjectId ? "项目已更新" : "项目已保存");
    if (goToList) navigate("projects");
  }

  function openProject(saved: Project) {
    setProduct(products.find((item) => item.id === saved.productId) || products[0]);
    setProjectName(saved.name); setPrompt(saved.prompt); setModel(saved.model || "gemini-flash"); setDesign(saved.design); setSelectedVariant(saved.design.variant);
    setActiveProjectId(saved.id);
    navigate("canvas");
  }

  function duplicateProject(saved: Project) {
    const copy = { ...saved, id: makeId(), name: `${saved.name} 副本`, updatedAt: new Date().toISOString() };
    persistProjects([copy, ...projects]);
    void syncWorkspace("project", "upsert", copy);
    setToast("项目已复制");
  }

  function deleteProject(id: string) {
    if (!window.confirm("确定删除这个项目吗？此操作无法撤销。")) return;
    persistProjects(projects.filter((item) => item.id !== id));
    void syncWorkspace("project", "delete", undefined, id);
    if (activeProjectId === id) setActiveProjectId(null);
    setToast("项目已删除");
  }

  function updateDesign(next: DesignState) {
    setUndoDesign(design);
    setRedoDesign(null);
    setDesign(next);
  }

  function undo() {
    if (!undoDesign) return;
    setRedoDesign(design);
    setDesign(undoDesign);
    setUndoDesign(null);
  }

  function redo() {
    if (!redoDesign) return;
    setUndoDesign(design);
    setDesign(redoDesign);
    setRedoDesign(null);
  }

  function handleReference(file?: File) {
    setUploadError("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setUploadError("仅支持 PNG、JPG 或 WEBP");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("图片不能超过 10 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReferenceImage({ name: file.name, url: String(reader.result) });
    reader.readAsDataURL(file);
  }

  function exportPng() {
    const canvas = document.createElement("canvas");
    canvas.width = 4500;
    canvas.height = 5400;
    const context = canvas.getContext("2d");
    if (!context) return;
    const scale = design.scale / 100;
    context.save();
    context.translate(2250 + design.x * 12, 2700 + design.y * 12);
    context.rotate((design.rotation * Math.PI) / 180);
    context.scale(scale, scale);
    context.fillStyle = "#e5683e";
    context.beginPath();
    context.arc(0, -900, 720, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = design.variant === 2 ? "#4b2d27" : design.variant === 3 ? "#18354d" : design.variant === 4 ? "#5a633d" : "#182e2a";
    context.beginPath();
    context.moveTo(-1700, 950);
    context.lineTo(-850, -150);
    context.lineTo(-300, 480);
    context.lineTo(620, -720);
    context.lineTo(1700, 950);
    context.closePath();
    context.fill();
    context.textAlign = "center";
    context.fillStyle = design.color;
    context.font = "900 360px Georgia";
    context.fillText(design.headline || "YOUR TEXT", 0, 1120);
    context.font = "700 130px Arial";
    context.letterSpacing = "30px";
    context.fillText(design.subline || "COXOF ORIGINAL", 0, 1400);
    context.restore();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(projectName || "coxof-design").replace(/[\\/:*?"<>|]/g, "-")}.png`;
      link.click();
      URL.revokeObjectURL(url);
      setToast("透明 PNG 已导出");
    }, "image/png");
  }

  function createOrder() {
    const source = cart.length ? cart : [{ id: makeId(), productId: product.id, projectName, size: product.category === "服装" ? size : "标准", quantity, unitPrice: Number(product.price.slice(1)), design }];
    const created = source.map((cartItem, index) => ({
      id: `CX${(Date.now() + index).toString().slice(-8)}`,
      productId: cartItem.productId,
      projectName: cartItem.projectName,
      size: cartItem.size,
      quantity: cartItem.quantity,
      total: Math.max(0, cartItem.unitPrice * cartItem.quantity - (index === 0 ? discount : 0)),
      status: "已确认",
      createdAt: new Date().toISOString(),
    }));
    const next = [...created, ...orders];
    setOrders(next);
    setCart([]);
    localStorage.setItem("coxof-orders", JSON.stringify(next));
    localStorage.setItem("coxof-cart", "[]");
    localStorage.setItem("coxof-address", JSON.stringify(address));
    created.forEach((item) => void syncWorkspace("order", "upsert", { ...item, address, shippingMethod, paymentMethod }));
    void syncWorkspace("cart", "clear");
    void syncWorkspace("profile", "upsert", { ...profile, address });
    setCheckoutStep(1);
    setDiscount(0);
    setCoupon("");
    setToast("体验订单已创建并确认");
    navigate("orders");
  }

  function applyAsset(asset: (typeof designAssets)[number]) {
    const next = { ...initialDesign, variant: asset.variant, headline: asset.headline, subline: asset.subline, color: asset.color };
    setDesign(next);
    setSelectedVariant(asset.variant);
    setProjectName(asset.title);
    setPrompt(`${asset.title}，适配 ${product.name} 的 POD 印刷设计`);
    setToast("模板已应用到 Canvas");
    navigate("canvas");
  }

  function addToCart(goToCart = true) {
    const item: CartItem = {
      id: makeId(),
      productId: product.id,
      projectName,
      size: [product.category === "服装" ? size : "标准", productColor, printArea].filter(Boolean).join(" · "),
      quantity,
      unitPrice: Number(product.price.slice(1)),
      design,
    };
    const next = [...cart, item];
    setCart(next);
    localStorage.setItem("coxof-cart", JSON.stringify(next));
    void syncWorkspace("cart", "upsert", item);
    setToast("已加入购物车");
    if (goToCart) navigate("cart");
  }

  function updateCartQuantity(id: string, nextQuantity: number) {
    const next = cart.map((item) => item.id === id ? { ...item, quantity: Math.max(1, nextQuantity) } : item);
    setCart(next);
    localStorage.setItem("coxof-cart", JSON.stringify(next));
    const changed = next.find((item) => item.id === id);
    if (changed) void syncWorkspace("cart", "upsert", changed);
  }

  function removeCartItem(id: string) {
    const next = cart.filter((item) => item.id !== id);
    setCart(next);
    localStorage.setItem("coxof-cart", JSON.stringify(next));
    void syncWorkspace("cart", "delete", undefined, id);
    setToast("商品已移除");
  }

  const cartSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingFee = shippingMethod === "express" ? 35 : cartSubtotal >= 99 ? 0 : 12;
  const payableTotal = Math.max(0, cartSubtotal + shippingFee - discount);

  function selectGlobalResult(result: (typeof globalResults)[number]) {
    setGlobalQuery("");
    if (result.type === "product") openProduct(result.item);
    else if (result.type === "project") openProject(result.item);
    else applyAsset(result.item);
  }

  function applyCoupon() {
    const code = coupon.trim().toUpperCase();
    if (code === "COXOF10") {
      setDiscount(Math.min(10, cartSubtotal));
      setToast("优惠码已生效：减 ¥10");
    } else if (code === "FIRST5") {
      setDiscount(Math.min(5, cartSubtotal));
      setToast("优惠码已生效：减 ¥5");
    } else {
      setDiscount(0);
      setToast("优惠码无效，请检查后重试");
    }
  }

  function continueToShipping() {
    const missing = !address.name.trim() || !address.phone.trim() || !address.line1.trim() || !address.city.trim() || !address.state.trim() || !address.postalCode.trim();
    if (missing) {
      setCheckoutError("请完整填写收货人、电话、街道、城市、州/省和邮编");
      return;
    }
    setCheckoutError("");
    localStorage.setItem("coxof-address", JSON.stringify(address));
    void syncWorkspace("profile", "upsert", { ...profile, address });
    setCheckoutStep(2);
  }

  function choosePlan(plan: string, limit: number) {
    const next = { ...profile, plan, creditsLimit: limit };
    setProfile(next);
    void syncWorkspace("profile", "upsert", { ...next, address });
    setPlanOpen(false);
    setToast(`已切换为${plan}`);
  }

  function handleAvatar(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024) {
      setToast("请选择 3 MB 以内的图片");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setAvatar(url);
      localStorage.setItem("coxof-avatar", url);
      setToast("头像已更新");
    };
    reader.readAsDataURL(file);
  }

  function submitTicket() {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      setToast("请填写问题主题和详细说明");
      return;
    }
    const tickets = JSON.parse(localStorage.getItem("coxof-support-tickets") || "[]") as unknown[];
    tickets.unshift({ id: `SUP-${Date.now().toString().slice(-6)}`, subject: ticketSubject, message: ticketMessage, createdAt: new Date().toISOString(), status: "已提交" });
    localStorage.setItem("coxof-support-tickets", JSON.stringify(tickets));
    setTicketSubject(""); setTicketMessage(""); setTicketOpen(false);
    setToast("支持工单已创建");
  }

  function cancelOrder(id: string) {
    const next = orders.map((item) => item.id === id ? { ...item, status: "已取消" } : item);
    setOrders(next);
    localStorage.setItem("coxof-orders", JSON.stringify(next));
    const changed = next.find((item) => item.id === id);
    if (changed) void syncWorkspace("order", "upsert", { ...changed, address, shippingMethod, paymentMethod });
    setToast("订单已取消");
  }

  if (view === "landing") return <Landing start={() => openDesign()} workspace={() => navigate("dashboard")} catalog={() => navigate("catalog")} />;

  const titles: Record<View, string> = {
    landing: "coxof AI DIY",
    dashboard: "创作工作台",
    catalog: "POD 产品中心",
    product: "商品详情",
    assets: "设计素材库",
    design: "AI Design",
    canvas: "Canvas 编辑器",
    mockup: "Mockup 样机",
    projects: "我的项目",
    cart: "购物车",
    checkout: "安全结算",
    orders: "订单中心",
    account: "账户中心",
    help: "帮助中心",
  };

  return (
    <div className="shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-logo-crop sidebar-logo-crop">
            <img src="/coxof-ai-diy-pod-logo.png" alt="coxof AI DIY POD" />
          </span>
          <button className="nav-close" onClick={() => setMobileNav(false)}>×</button>
        </div>
        <p className="nav-label">设计工作台</p>
        <nav>
          <button className={view === "dashboard" ? "active" : ""} onClick={() => navigate("dashboard")}><i>⌂</i> 工作台</button>
          <button className={view === "catalog" ? "active" : ""} onClick={() => setView("catalog")}><i>▦</i> 产品目录</button>
          <button className={view === "design" ? "active" : ""} onClick={() => openDesign()}><i>✦</i> AI Design <b>核心</b></button>
          <button className={view === "assets" ? "active" : ""} onClick={() => navigate("assets")}><i>◈</i> 设计素材</button>
          <button className={view === "projects" ? "active" : ""} onClick={() => setView("projects")}><i>▱</i> 我的项目</button>
        </nav>
        <p className="nav-label stage">生产与账户</p>
        <nav>
          <button className={view === "canvas" ? "active" : ""} onClick={() => navigate("canvas")}><i>□</i> Canvas 编辑器</button>
          <button className={view === "mockup" ? "active" : ""} onClick={() => navigate("mockup")}><i>♙</i> Mockup 样机</button>
          <button className={view === "cart" || view === "checkout" ? "active" : ""} onClick={() => navigate("cart")}><i>♧</i> 购物车<small>{cart.length}</small></button>
          <button className={view === "orders" ? "active" : ""} onClick={() => navigate("orders")}><i>▤</i> 订单中心<small>{orders.length}</small></button>
          <button className={view === "account" ? "active" : ""} onClick={() => navigate("account")}><i>◎</i> 账户中心</button>
        </nav>
        <div className="plan">
          <div><span>本月 AI 点数</span><strong>{profile.creditsLimit - profile.creditsUsed} / {profile.creditsLimit}</strong></div>
          <div className="meter"><i style={{ width: `${Math.max(0, Math.min(100, ((profile.creditsLimit - profile.creditsUsed) / profile.creditsLimit) * 100))}%` }} /></div>
          <button onClick={() => setPlanOpen(true)}>升级专业版 <span>⚡</span></button>
        </div>
        <button className="profile" onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}><span>{profile.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><div><strong>{profile.displayName}</strong><small>{cloudReady ? "云端工作区" : "本地工作区"}</small></div><i>⌄</i></button>
        {profileOpen && <div className="profile-menu"><button onClick={() => navigate("account")}>账户与套餐</button><button onClick={() => navigate("help")}>帮助中心</button><a href="/admin">管理后台</a></div>}
      </aside>

      {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="关闭导航" />}
      {toast && <div className="toast">✓ {toast}</div>}

      <main>
        <header className="topbar">
          <div className="page-title">
            <button className="menu" onClick={() => setMobileNav(true)}>☰</button>
            <div><strong>{titles[view]}</strong><small>coxof AI DIY V1.0</small></div>
          </div>
          <div className="top-actions">
            <div className="global-search-wrap">
              <label className="global-search"><span>⌕</span><input value={globalQuery} onChange={(event) => setGlobalQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && globalResults[0]) selectGlobalResult(globalResults[0]); }} placeholder="搜索产品、项目、模板…" /><kbd>↵</kbd></label>
              {!!globalQuery.trim() && <div className="global-results">{globalResults.length ? globalResults.map((result, index) => <button key={`${result.type}-${index}`} onClick={() => selectGlobalResult(result)}><span>{result.label}</span><small>{result.meta}</small></button>) : <p>没有找到相关内容</p>}</div>}
            </div>
            <button className="round" aria-label="帮助中心" onClick={() => navigate("help")}>?</button>
            <button className="round notification-button" aria-label="通知" onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}>♢<i /></button>
            <button className="cart-top" onClick={() => navigate("cart")}>购物车 <b>{cart.length}</b></button>
            <button className="new" onClick={() => openDesign()}><span>＋</span> 新建设计</button>
            {notificationsOpen && <div className="notifications-popover"><strong>通知</strong><span>前台功能已经启用</span><small>商品、AI 设计、Canvas、Mockup 与订单可完整体验</small><span>商品参数与目录同步</span><small>后台上架商品会显示在前台目录</small><button onClick={() => { setNotificationsOpen(false); setToast("通知已全部标为已读"); }}>全部标为已读</button></div>}
          </div>
        </header>

        {view === "dashboard" && (
          <section className="page dashboard-page">
            <div className="dashboard-hero">
              <div className="hero-grid" aria-hidden="true" />
              <div className="hero-orb orb-one" aria-hidden="true" />
              <div className="hero-orb orb-two" aria-hidden="true" />
              <div className="dashboard-copy">
                <span className="hero-kicker"><i /> COXOF AI POD CREATIVE OS</span>
                <h1>一个创意，快速变成<br /><em>可以销售的商品</em></h1>
                <p>从文字、参考图或模板开始，使用多模型 AI 完成图案、Canvas 精修、Mockup 与按需生产。</p>
                <div className="welcome-actions"><button className="primary hero-primary" onClick={() => openDesign()}>✦ 开始 AI 创作 <b>→</b></button><button className="secondary" onClick={() => navigate("assets")}>浏览设计模板</button></div>
                <div className="model-status"><span><i className="gemini" /> Gemini <b>可用</b></span><span><i className="ideogram" /> 商业文字 <b>可用</b></span><span><i className="flux" /> 写实视觉 <b>可用</b></span></div>
              </div>
              <div className="hero-console">
                <div className="console-head"><span><i /> AI 创作控制台</span><small>LIVE WORKSPACE</small></div>
                <div className="console-art">
                  <div className="console-glow" />
                  <span className="console-chip">POD READY</span>
                  <strong>CREATE<br />WITHOUT<br /><em>LIMITS</em></strong>
                  <small>4500 × 5400 PX · TRANSPARENT PNG</small>
                </div>
                <div className="console-meta"><span>当前商品<strong>经典纯棉 T 恤</strong></span><span>输出模式<strong>商业设计</strong></span></div>
                <button onClick={() => openDesign()}>打开 AI Studio <span>↗</span></button>
              </div>
            </div>
            <div className="quick-grid">
              <button onClick={() => navigate("catalog")}><i>▦</i><span><strong>选择 POD 商品</strong><small>8 种商品载体与生产规格</small></span><b>→</b></button>
              <button onClick={() => openDesign()}><i>✦</i><span><strong>AI 生成图案</strong><small>文生图、图生图与多模型</small></span><b>→</b></button>
              <button onClick={() => navigate("assets")}><i>◈</i><span><strong>使用设计模板</strong><small>复古、植物、节日与定制</small></span><b>→</b></button>
              <button onClick={() => navigate("projects")}><i>▱</i><span><strong>继续已有项目</strong><small>{projects.length} 个已保存项目</small></span><b>→</b></button>
            </div>
            <div className="dashboard-columns">
              <section className="dash-card"><div className="dash-head"><div><span className="eyebrow">最近项目</span><h2>继续你的设计</h2></div><button onClick={() => navigate("projects")}>查看全部</button></div>
                {projects.length ? <div className="recent-projects">{projects.slice(0, 3).map((item) => <button key={item.id} onClick={() => openProject(item)}><Artwork design={{ ...item.design, x: 0, y: 0, scale: 70 }} /><span><strong>{item.name}</strong><small>{products.find((p) => p.id === item.productId)?.name}</small></span></button>)}</div> : <div className="mini-empty"><span>▱</span><strong>还没有项目</strong><small>完成第一张设计后会显示在这里。</small><button onClick={() => openDesign()}>开始设计</button></div>}
              </section>
              <section className="dash-card"><div className="dash-head"><div><span className="eyebrow">订单动态</span><h2>生产进度</h2></div><button onClick={() => navigate("orders")}>订单中心</button></div>
                <div className="order-summary"><div><strong>{orders.length}</strong><span>全部订单</span></div><div><strong>{orders.filter((item) => item.status === "待付款").length}</strong><span>待付款</span></div><div><strong>{orders.filter((item) => !["待付款","已取消"].includes(item.status)).length}</strong><span>生产中</span></div></div>
                <div className="status-note"><i>✓</i><span><strong>订单闭环已启用</strong><small>可完成商品选择、设计、购物车、结算与订单管理。</small></span></div>
              </section>
            </div>
          </section>
        )}

        {view === "catalog" && (
          <section className="page">
            <div className="welcome">
              <div className="welcome-copy">
                <span className="eyebrow">✦ POD 创作，从产品开始</span>
                <h1>选择产品，让 AI 完成第一版设计</h1>
                <p>先锁定印刷尺寸与商品成本，再进入文生图或图生图。为 POD 商品提供清晰、开放的 AI 设计闭环。</p>
                <div className="welcome-actions">
                  <button className="primary" onClick={() => openDesign()}>✦ 开始 AI Design</button>
                  <button className="secondary" onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}>浏览产品目录</button>
                </div>
              </div>
              <div className="hero-stack" aria-hidden="true">
                <div className="stack-card back"><ProductArt product={products[7]} compact /></div>
                <div className="stack-card middle"><ProductArt product={products[5]} compact /></div>
                <div className="stack-card front"><span>当前热门</span><ProductArt product={products[0]} compact /><strong>经典纯棉 T 恤</strong><small>¥39 · 适合快速起款</small></div>
              </div>
            </div>

            <div className="section-head" id="catalog">
              <div><span className="eyebrow">产品目录</span><h2>为你的创意选择载体</h2></div>
              <label className="catalog-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索产品" /></label>
            </div>
            <div className="tabs">{categories.map((item) => <button key={item} className={item === category ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
            <div className="products">
              {filtered.map((item) => (
                <article className="product-card" key={item.id}>
                  {item.badge && <span className={`badge ${item.badge === "新品" ? "fresh" : ""}`}>{item.badge}</span>}
                  <ProductArt product={item} />
                  <div className="product-info"><div><small>{item.category}</small><h3>{item.name}</h3></div><strong>{item.price}<small> 起</small></strong></div>
                  <div className="meta"><span>印刷区 {item.size}</span><span>按需生产</span></div>
                  <div className="product-actions"><button onClick={() => openProduct(item)}>查看规格</button><button className="primary" onClick={() => openDesign(item)}>选择并设计 <span>✦</span></button></div>
                </article>
              ))}
            </div>
          </section>
        )}

        {view === "product" && (
          <section className="tool-page product-detail-page">
            <button className="back-link" onClick={() => navigate("catalog")}>← 返回产品目录</button>
            <div className="product-detail">
              <div className={`product-gallery gallery-${galleryView}`}>
                <ProductArt product={product} />
                <div className="gallery-caption">{galleryView === "front" ? `${product.name} · ${productColor}` : galleryView === "detail" ? `${product.materials?.join(" / ") || "商品材质细节"} · 按需生产` : `${printArea} · 透明 PNG · 300 DPI`}</div>
                <div className="thumbs"><button className={galleryView === "front" ? "active" : ""} onClick={() => setGalleryView("front")}>正面</button><button className={galleryView === "detail" ? "active" : ""} onClick={() => setGalleryView("detail")}>细节</button><button className={galleryView === "print" ? "active" : ""} onClick={() => setGalleryView("print")}>印刷区</button></div>
              </div>
              <div className="product-config">
                <span className="eyebrow">{product.category} · POD 按需生产</span><h1>{product.name}</h1><p className="product-price">{product.price}<small> 起 / 件</small></p>
                <p className="product-copy">适合个性定制与小批量生产。设计完成后可预览商品效果、导出生产文件或创建订单。</p>
                <div className="spec-list"><div><span>可印刷区域</span><strong>{product.printAreas?.join(" / ") || product.size}</strong></div><div><span>材质</span><strong>{product.materials?.join(" / ") || "按商品说明"}</strong></div><div><span>起订数量</span><strong>1 件起订</strong></div><div><span>文件要求</span><strong>透明 PNG · 300 DPI</strong></div></div>
                {!!product.colors?.length && <div className="choice-group"><span>商品颜色</span><div>{product.colors.map((item) => <button key={item} className={productColor === item ? "active" : ""} onClick={() => setProductColor(item)}>{item}</button>)}</div></div>}
                {!!product.sizes?.length && <div className="choice-group"><span>预览尺码</span><div>{product.sizes.map((item) => <button key={item} className={size === item ? "active" : ""} onClick={() => setSize(item)}>{item}</button>)}</div></div>}
                {!!product.printAreas?.length && <div className="choice-group"><span>印刷区域</span><div>{product.printAreas.map((item) => <button key={item} className={printArea === item ? "active" : ""} onClick={() => setPrintArea(item)}>{item}</button>)}</div></div>}
                {product.sizeChart && product.sizeChart.rows.length > 0 && <details className="product-size-chart">
                  <summary><span>详细尺码表</span><small>单位：{product.sizeChart.unit}{product.sizeChart.tolerance ? ` · 测量误差 ±${product.sizeChart.tolerance} ${product.sizeChart.unit}` : ""}</small></summary>
                  <div><table><thead><tr>{product.sizeChart.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{product.sizeChart.rows.map((row, index) => <tr key={index}>{product.sizeChart!.columns.map((column) => <td key={column}>{row[column] || "—"}</td>)}</tr>)}</tbody></table></div>
                </details>}
                <div className="detail-actions"><button className="primary" onClick={() => openDesign(product)}>✦ 使用 AI 设计</button><button className="secondary" onClick={() => navigate("assets")}>从模板开始</button></div>
                <small className="production-note">价格为基础生产价，不含运费、税费及特殊工艺费用。</small>
              </div>
            </div>
          </section>
        )}

        {view === "assets" && (
          <section className="library-page asset-page">
            <div className="library-head"><div><span className="eyebrow">设计素材库</span><h1>选择模板，快速开始</h1><p>模板会自动带入文字、配色与构图，你可以继续在 Canvas 中修改。</p></div><button className="primary" onClick={() => openDesign()}>✦ 从提示词生成</button></div>
            <div className="asset-tools"><div className="tabs">{["全部","热门模板","复古美式","植物花卉","个性定制","节日设计"].map((item) => <button key={item} className={item === assetCategory ? "active" : ""} onClick={() => setAssetCategory(item)}>{item}</button>)}</div><label className="catalog-search"><span>⌕</span><input value={assetQuery} onChange={(event) => setAssetQuery(event.target.value)} placeholder="搜索模板、主题或风格" /></label></div>
            <div className="asset-grid">{filteredAssets.map((asset) => <article key={asset.id}><Artwork design={{ ...initialDesign, variant: asset.variant, headline: asset.headline, subline: asset.subline, color: asset.color }} /><div><span>{asset.category}</span><h3>{asset.title}</h3><small>可编辑文字 · 可更换配色</small></div><button className="primary" onClick={() => applyAsset(asset)}>使用此模板</button></article>)}</div>
            {!filteredAssets.length && <div className="mini-empty"><span>⌕</span><strong>没有匹配的模板</strong><small>尝试更换分类或搜索词。</small><button onClick={() => { setAssetCategory("全部"); setAssetQuery(""); }}>清除筛选</button></div>}
          </section>
        )}

        {view === "design" && (
          <section className="design-page">
            <div className="design-head">
              <div><button className="back-link" onClick={() => setView("catalog")}>← 返回产品目录</button><h1>创建你的 POD 设计</h1><p>选择生成方式，描述创意并生成适合商品的设计方案。</p></div>
              <Flow active={2} />
            </div>
            <div className="studio-workspace">
              <aside className="studio-brief">
                <div className="studio-panel-head"><span>创意输入</span><small>01</small></div>
                <section className="studio-product">
                  <ProductArt product={product} compact />
                  <div><small>{product.category} · {product.price}</small><strong>{product.name}</strong><span>印刷区 {product.size}</span></div>
                  <button onClick={() => setView("catalog")}>更换</button>
                </section>
                <div className="segmented studio-tabs"><button className={mode === "text" ? "active" : ""} onClick={() => setMode("text")}>✦ 文生图</button><button className={mode === "image" ? "active" : ""} onClick={() => setMode("image")}>▧ 图生图</button></div>
                {mode === "image" && <div>
                  {referenceImage ? <div className="upload-preview"><img src={referenceImage.url} alt="上传的参考图" /><div><strong>{referenceImage.name}</strong><span>参考图已就绪</span></div><button onClick={() => setReferenceImage(null)}>移除</button></div> :
                    <label className="upload">⇧<strong>上传参考图</strong><span>PNG、JPG、WEBP · 10 MB</span><input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => handleReference(event.target.files?.[0])} /></label>}
                  {uploadError && <p className="form-error">{uploadError}</p>}
                </div>}
                <label className="prompt studio-prompt"><span>描述你的设计 <small>{prompt.length}/2000</small></span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} /></label>
                <div className="prompt-chips"><button onClick={() => setPrompt(`${prompt}，透明背景`)}>透明背景</button><button onClick={() => setPrompt(`${prompt}，适合丝网印刷`)}>丝网印刷</button><button onClick={() => setPrompt(`${prompt}，欧美商业风格`)}>欧美商业</button></div>
                <div className="brief-tip"><b>AI 已识别商品限制</b><span>自动控制画布比例、对比度、安全边距和印刷适配。</span></div>
                <button className="generate studio-generate" disabled={generating || !prompt.trim()} onClick={generate}>{generating ? <><i /> 正在生成设计…</> : <>✦ 生成 4 个方案 <span>消耗 4 点</span></>}</button>
              </aside>

              <section className="studio-stage">
                <div className="stage-toolbar">
                  <div><span className="live-dot" /> AI Design Canvas <small>{product.size}</small></div>
                  <div><button onClick={() => setToast("画布缩放已适配")}>−</button><b>100%</b><button onClick={() => setToast("画布缩放已适配")}>＋</button><button onClick={() => navigate("canvas")}>全屏编辑 ↗</button></div>
                </div>
                <div className="stage-surface">
                  <div className="stage-artboard">
                    {results ? <Artwork design={{ ...design, variant: selectedVariant, x: 0, y: 0, rotation: 0, scale: 100 }} reference={mode === "image" ? referenceImage : null} /> :
                      generating ? <div className="stage-generating"><i /><strong>{modelOptions.find((item) => item.id === model)?.name}</strong><span>正在组织文字、图形与版式…</span></div> :
                      <div className="stage-empty"><span>✦</span><strong>从左侧描述一个创意</strong><small>生成结果会直接进入中央画布</small><button onClick={() => setPrompt("复古美式植物徽章，主标题 GROW WILD，适合自然白 T 恤，透明背景")}>试用示例提示词</button></div>}
                  </div>
                </div>
                <div className="filmstrip">
                  <div className="filmstrip-head"><span>生成方案</span><small>{results ? "选择后可进入 Canvas 精修" : "尚未生成"}</small></div>
                  <div className="filmstrip-grid">
                    {[1,2,3,4].map((item) => <button className={results && selectedVariant === item ? "active" : ""} key={item} disabled={!results} onClick={() => { setSelectedVariant(item); updateDesign({ ...design, variant: item }); }}>{results ? <Artwork design={{ ...design, variant: item, x: 0, y: 0, rotation: 0, scale: 72 }} reference={mode === "image" ? referenceImage : null} /> : <span>{generating ? "生成中" : `0${item}`}</span>}<small>方案 {item}</small></button>)}
                  </div>
                  <div className="stage-actions"><button className="secondary" disabled={!results} onClick={generate}>再生成一组</button><button className="primary" disabled={!results} onClick={() => navigate("canvas")}>使用此方案 →</button></div>
                </div>
              </section>

              <aside className="studio-inspector">
                <div className="studio-panel-head"><span>智能控制</span><small>02</small></div>
                <section className="inspector-section">
                  <div className="inspector-label"><span>AI 模型</span><small>按任务选择</small></div>
                  <div className="model-grid compact-models">
                    {modelOptions.map((item) => <button key={item.id} className={model === item.id ? "active" : ""} onClick={() => setModel(item.id)}><span><strong>{item.name.replace(" Image","")}</strong><em>{item.badge}</em></span><small>{item.description}</small></button>)}
                  </div>
                  <p className="model-routing">Gemini：图文商业设计与修改<br />FLUX：写实场景、材质与 AI 模特</p>
                </section>
                <section className="inspector-section">
                  <div className="inspector-label"><span>设计模式</span><small>{control === "auto" ? "自动推荐" : "手动设置"}</small></div>
                  <div className="mode-switch"><button className={control === "auto" ? "active" : ""} onClick={() => setControl("auto")}>⚡ <span>自动<small>智能搭配</small></span></button><button className={control === "pro" ? "active" : ""} onClick={() => setControl("pro")}>⌘ <span>专业<small>精确控制</small></span></button></div>
                  {control === "auto" ? <div className="auto-summary"><b>当前搭配</b><span>复古徽章 · 粗衬线 · 居中构图 · POD 安全色</span></div> :
                    <div className="pro-grid inspector-pro">
                      <ProSelect label="风格" value={proSettings.style} options={["复古徽章","极简商业","街头潮流","自然植物","Y2K"]} change={(value) => setProSettings({ ...proSettings, style: value })} />
                      <ProSelect label="插画" value={proSettings.illustration} options={["扁平矢量","手绘线稿","丝网印刷","拼贴艺术","3D 卡通"]} change={(value) => setProSettings({ ...proSettings, illustration: value })} />
                      <ProSelect label="字体" value={proSettings.typography} options={["粗衬线体","无衬线粗体","手写字体","复古脚本","无文字"]} change={(value) => setProSettings({ ...proSettings, typography: value })} />
                      <ProSelect label="版式" value={proSettings.layout} options={["居中徽章","上下排版","全幅图形","左图右字","自由布局"]} change={(value) => setProSettings({ ...proSettings, layout: value })} />
                      <ProSelect label="构图" value={proSettings.composition} options={["主体突出","对称稳定","环形包围","动感对角","留白高级"]} change={(value) => setProSettings({ ...proSettings, composition: value })} />
                    </div>}
                </section>
                <section className="inspector-section output-settings">
                  <div className="inspector-label"><span>生产输出</span><small>自动</small></div>
                  <div><span>透明 PNG</span><b>✓</b></div><div><span>4500 × 5400 px</span><b>✓</b></div><div><span>安全印刷区</span><b>✓</b></div>
                </section>
              </aside>
            </div>
          </section>
        )}

        {view === "canvas" && <section className="tool-page">
          <div className="design-head"><div><button className="back-link" onClick={() => navigate("design")}>← 返回 AI Design</button><h1>Canvas 编辑器</h1><p>调整文字、颜色、大小与位置，修改会同步到样机。</p></div><Flow active={3} /></div>
          <div className="canvas-layout">
            <aside className="tool-panel">
              <div className="panel-title"><strong>图层与属性</strong><span>实时更新</span></div>
              <label className="field"><span>项目名称</span><input value={projectName} onChange={(e) => setProjectName(e.target.value)} /></label>
              <label className="field"><span>主标题</span><input value={design.headline} onChange={(e) => updateDesign({ ...design, headline: e.target.value.toUpperCase() })} /></label>
              <label className="field"><span>副标题</span><input value={design.subline} onChange={(e) => updateDesign({ ...design, subline: e.target.value.toUpperCase() })} /></label>
              <label className="field"><span>文字颜色</span><input className="color-input" type="color" value={design.color} onChange={(e) => updateDesign({ ...design, color: e.target.value })} /></label>
              <Range label="缩放" value={design.scale} min={60} max={140} suffix="%" change={(value) => updateDesign({ ...design, scale: value })} />
              <Range label="旋转" value={design.rotation} min={-30} max={30} suffix="°" change={(value) => updateDesign({ ...design, rotation: value })} />
              <Range label="水平位置" value={design.x} min={-90} max={90} suffix="" change={(value) => updateDesign({ ...design, x: value })} />
              <Range label="垂直位置" value={design.y} min={-90} max={90} suffix="" change={(value) => updateDesign({ ...design, y: value })} />
              <div className="tool-actions"><button onClick={() => updateDesign({ ...initialDesign, variant: design.variant })}>重置</button><button className="primary" onClick={() => saveProject(false)}>保存项目</button></div>
            </aside>
            <div className="canvas-stage"><div className="canvas-toolbar"><span>安全印刷区 · {product.size} · 可直接拖动图案</span><div><button disabled={!undoDesign} onClick={undo}>↶ 撤销</button><button disabled={!redoDesign} onClick={redo}>↷ 重做</button><button onClick={() => updateDesign({ ...design, x: 0, y: 0 })}>居中</button></div></div><div className="artboard"><div className="safe-zone"><Artwork design={design} reference={mode === "image" ? referenceImage : null} onMove={(x, y) => setDesign({ ...design, x, y })} /></div></div><p>生产导出 4500 × 5400 px · 透明 PNG</p></div>
            <aside className="canvas-side"><span className="eyebrow">当前商品</span><h3>{product.name}</h3><Mockup product={product} design={design} reference={mode === "image" ? referenceImage : null} compact /><div className="quality-list"><span>✓ 安全区检查</span><span>✓ 透明 PNG 导出</span><span>✓ 4500 × 5400 px</span></div><button className="secondary full export-button" onClick={exportPng}>⇩ 导出透明 PNG</button><button className="primary full" onClick={() => navigate("mockup")}>生成 Mockup →</button></aside>
          </div>
        </section>}

        {view === "mockup" && <section className="tool-page">
          <div className="design-head"><div><button className="back-link" onClick={() => navigate("canvas")}>← 返回 Canvas</button><h1>Mockup 样机预览</h1><p>确认商品效果和生产规格，再保存项目或创建订单。</p></div><Flow active={4} /></div>
          <div className="mockup-layout"><div className="mockup-main"><Mockup product={product} design={design} reference={mode === "image" ? referenceImage : null} /></div><aside className="order-builder"><span className="eyebrow">生产配置</span><h2>{product.name}</h2><p>设计：{projectName}</p>
            {!!product.sizes?.length && <div className="choice-group"><span>尺码</span><div>{product.sizes.map((item) => <button key={item} className={size === item ? "active" : ""} onClick={() => setSize(item)}>{item}</button>)}</div></div>}
            <div className="choice-group"><span>数量</span><div className="quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><b>{quantity}</b><button onClick={() => setQuantity(quantity + 1)}>＋</button></div></div>
            <dl className="price-breakdown"><div><dt>商品单价</dt><dd>{product.price}</dd></div><div><dt>数量</dt><dd>× {quantity}</dd></div><div className="total"><dt>预计合计</dt><dd>¥{Number(product.price.slice(1)) * quantity}</dd></div></dl>
            <button className="secondary full" onClick={() => saveProject(false)}>保存到我的项目</button><button className="primary full order-button" onClick={() => addToCart()}>加入购物车并结算 →</button><small className="order-note">加入购物车后可填写地址、配送与付款方式。</small>
          </aside></div>
        </section>}

        {view === "cart" && <section className="library-page checkout-page">
          <div className="library-head"><div><span className="eyebrow">购物车</span><h1>确认商品与设计</h1><p>检查商品、尺码、数量和设计项目，然后进入结算。</p></div><button className="secondary" onClick={() => navigate("catalog")}>＋ 继续选择商品</button></div>
          {cart.length === 0 ? <Empty icon="♧" title="购物车还是空的" text="先选择一个商品完成设计和 Mockup。" action={() => navigate("catalog")} /> :
            <div className="cart-layout"><div className="cart-list">{cart.map((item) => { const itemProduct = products.find((p) => p.id === item.productId) || products[0]; return <article className="cart-item" key={item.id}><div className="cart-preview"><Mockup compact product={itemProduct} design={item.design} /></div><div className="cart-info"><span>{itemProduct.category}</span><h3>{itemProduct.name}</h3><p>设计：{item.projectName}</p><small>规格：{item.size} · 生产文件待最终检查</small><button onClick={() => { setProduct(itemProduct); setDesign(item.design); setProjectName(item.projectName); navigate("canvas"); }}>返回编辑设计</button></div><div className="cart-controls"><strong>¥{item.unitPrice * item.quantity}</strong><div className="quantity"><button onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>−</button><b>{item.quantity}</b><button onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>＋</button></div><button className="remove-link" onClick={() => removeCartItem(item.id)}>移除</button></div></article>; })}</div>
              <aside className="cart-summary"><span className="eyebrow">订单摘要</span><dl className="price-breakdown"><div><dt>商品小计</dt><dd>¥{cartSubtotal}</dd></div><div><dt>预计运费</dt><dd>{cartSubtotal >= 99 ? "免运费" : "结算时计算"}</dd></div><div><dt>优惠</dt><dd>{discount ? `−¥${discount}` : "—"}</dd></div><div className="total"><dt>预计合计</dt><dd>¥{Math.max(0, cartSubtotal - discount)}</dd></div></dl><label className="coupon"><input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="优惠码：COXOF10" /><button onClick={applyCoupon}>使用</button></label><button className="primary full" onClick={() => { setCheckoutStep(1); navigate("checkout"); }}>进入安全结算 →</button><small>付款前仍可检查地址、配送费用与订单总额。</small></aside>
            </div>}
        </section>}

        {view === "checkout" && <section className="library-page checkout-page">
          <div className="checkout-head"><button className="back-link" onClick={() => navigate("cart")}>← 返回购物车</button><div className="checkout-steps">{["收货地址","配送方式","付款确认"].map((label, index) => <span key={label} className={checkoutStep === index + 1 ? "active" : checkoutStep > index + 1 ? "done" : ""}><b>{checkoutStep > index + 1 ? "✓" : index + 1}</b>{label}</span>)}</div></div>
          <div className="checkout-layout"><div className="checkout-form">
            {checkoutStep === 1 && <section><span className="eyebrow">第 1 步</span><h1>收货地址</h1><p>用于计算运费、税费与预计送达时间。</p><div className="address-grid"><label><span>收货人姓名</span><input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} /></label><label><span>联系电话</span><input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="+1" /></label><label className="wide"><span>国家 / 地区</span><select value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })}><option>United States</option><option>Canada</option><option>United Kingdom</option><option>China</option></select></label><label className="wide"><span>街道地址</span><input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} placeholder="Street address" /></label><label><span>城市</span><input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></label><label><span>州 / 省</span><input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} /></label><label><span>邮政编码</span><input value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} /></label></div>{checkoutError && <p className="form-error">{checkoutError}</p>}<button className="primary next-step" onClick={continueToShipping}>保存并选择配送 →</button></section>}
            {checkoutStep === 2 && <section><span className="eyebrow">第 2 步</span><h1>配送方式</h1><p>实际时效将在生产完成并交给物流商后更新。</p><div className="shipping-options"><button className={shippingMethod === "standard" ? "active" : ""} onClick={() => setShippingMethod("standard")}><i>○</i><span><strong>标准配送</strong><small>预计生产后 5–9 个工作日</small></span><b>{cartSubtotal >= 99 ? "免费" : "¥12"}</b></button><button className={shippingMethod === "express" ? "active" : ""} onClick={() => setShippingMethod("express")}><i>○</i><span><strong>加急配送</strong><small>预计生产后 2–4 个工作日</small></span><b>¥35</b></button></div><div className="step-actions"><button className="secondary" onClick={() => setCheckoutStep(1)}>上一步</button><button className="primary" onClick={() => setCheckoutStep(3)}>继续付款确认 →</button></div></section>}
            {checkoutStep === 3 && <section><span className="eyebrow">第 3 步</span><h1>付款确认</h1><p>当前为完整体验结算，不会真实扣款；接入支付服务后可直接切换为正式付款。</p><div className="payment-options"><button className={paymentMethod === "card" ? "active" : ""} onClick={() => setPaymentMethod("card")}><i>▣</i><span><strong>银行卡体验付款</strong><small>不收集或保存真实卡号</small></span></button><button className={paymentMethod === "paypal" ? "active" : ""} onClick={() => setPaymentMethod("paypal")}><i>P</i><span><strong>PayPal 体验付款</strong><small>模拟授权并创建订单</small></span></button></div><div className="payment-placeholder"><span>体验付款模式</span><strong>本次不会产生扣款</strong><small>订单会以“已确认”状态保存，便于测试前台与后台流程。</small></div><div className="step-actions"><button className="secondary" onClick={() => setCheckoutStep(2)}>上一步</button><button className="primary" onClick={createOrder}>确认并创建订单 →</button></div></section>}
          </div><aside className="checkout-summary"><span className="eyebrow">结算摘要</span>{cart.map((item) => <div className="checkout-line" key={item.id}><span>{products.find((p) => p.id === item.productId)?.name}<small>{item.size} · ×{item.quantity}</small></span><strong>¥{item.unitPrice * item.quantity}</strong></div>)}<dl className="price-breakdown"><div><dt>商品小计</dt><dd>¥{cartSubtotal}</dd></div><div><dt>配送</dt><dd>¥{shippingFee}</dd></div>{discount > 0 && <div><dt>优惠</dt><dd>−¥{discount}</dd></div>}<div className="total"><dt>应付总额</dt><dd>¥{payableTotal}</dd></div></dl><div className="secure-note">🔒 当前为不扣款的前台体验模式</div></aside></div>
        </section>}

        {view === "projects" && <section className="library-page"><div className="library-head"><div><span className="eyebrow">项目工作区</span><h1>我的设计项目</h1><p>{cloudReady ? "项目、提示词和 Canvas 参数已与云端工作区同步。" : "当前显示本地数据，云端连接恢复后会继续同步。"}</p></div><button className="primary" onClick={() => openDesign()}>＋ 创建新设计</button></div>
          {projects.length === 0 ? <Empty icon="▱" title="还没有保存的项目" text="完成 Canvas 编辑后即可保存。" action={() => openDesign()} /> : <div className="project-grid">{projects.map((item) => <article className="project-card" key={item.id}><Artwork design={{ ...item.design, x: 0, y: 0, scale: 90 }} /><span>{products.find((p) => p.id === item.productId)?.name}</span><h3>{item.name}</h3><small>{new Date(item.updatedAt).toLocaleString("zh-CN")}</small><div className="project-actions"><button className="primary" onClick={() => openProject(item)}>继续编辑</button><button onClick={() => duplicateProject(item)}>复制</button><button className="danger" onClick={() => deleteProject(item.id)}>删除</button></div></article>)}</div>}
        </section>}

        {view === "orders" && <section className="library-page"><div className="library-head"><div><span className="eyebrow">生产管理</span><h1>订单中心</h1><p>查看从 Mockup 创建的订单与状态。</p></div><button className="primary" onClick={() => navigate("catalog")}>＋ 新建订单</button></div>
          {orders.length === 0 ? <Empty icon="▤" title="还没有订单" text="从产品开始设计，确认样机后创建订单。" action={() => navigate("catalog")} /> : <div className="order-table"><div className="order-row header"><span>订单号</span><span>商品 / 项目</span><span>规格</span><span>金额</span><span>状态 / 操作</span></div>{orders.map((item) => <div className="order-row" key={item.id}><strong>{item.id}<small>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</small></strong><span><b>{products.find((p) => p.id === item.productId)?.name}</b><small>{item.projectName}</small></span><span>{item.size} · {item.quantity} 件</span><strong>¥{item.total}</strong><span className="order-status"><em className={item.status === "已取消" ? "cancelled" : ""}>{item.status}</em>{["待确认","待付款"].includes(item.status) && <button onClick={() => cancelOrder(item.id)}>取消订单</button>}</span></div>)}</div>}
        </section>}

        {view === "account" && <section className="library-page account-page"><div className="library-head"><div><span className="eyebrow">账户中心</span><h1>账户、点数与品牌设置</h1><p>管理个人资料、AI 用量、套餐和默认收货信息。</p></div><button className="secondary" onClick={() => { void syncWorkspace("profile", "upsert", { ...profile, address }); localStorage.setItem("coxof-address", JSON.stringify(address)); setToast("账户设置已保存并同步"); }}>保存更改</button></div>
          <div className="account-grid"><section className="account-card profile-card"><div className="avatar-large">{avatar ? <img src={avatar} alt="用户头像" /> : profile.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div><div><h2>{profile.displayName}</h2><p>{cloudReady ? "已登录并同步" : "本地模式"}</p><span>品牌工作区 · 所有者</span></div><label className="avatar-button">更换头像<input type="file" accept="image/*" hidden onChange={(event) => handleAvatar(event.target.files?.[0])} /></label></section>
            <section className="account-card plan-card"><div><span className="eyebrow">当前套餐</span><h2>{profile.plan}</h2><p>适合个人设计与 POD 商品测试</p></div><strong>¥99<small>/月</small></strong><div className="usage-line"><span>本月 AI 点数</span><b>{profile.creditsLimit - profile.creditsUsed} / {profile.creditsLimit}</b></div><div className="usage-meter"><i style={{ width: `${Math.max(0, Math.min(100, ((profile.creditsLimit - profile.creditsUsed) / profile.creditsLimit) * 100))}%` }} /></div><button className="primary" onClick={() => setPlanOpen(true)}>管理套餐</button></section>
            <section className="account-card settings-card"><h2>品牌资料</h2><label><span>显示名称</span><input value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} /></label><label><span>工作区名称</span><input value={profile.workspaceName} onChange={(e) => setProfile({ ...profile, workspaceName: e.target.value })} /></label><label><span>默认市场</span><select value={profile.market} onChange={(e) => setProfile({ ...profile, market: e.target.value })}><option value="US">美国市场</option><option value="CA">加拿大市场</option><option value="EU">欧洲市场</option></select></label><button className="secondary" onClick={() => { void syncWorkspace("profile", "upsert", { ...profile, address }); setToast("品牌资料已保存并同步"); }}>保存品牌资料</button></section>
            <section className="account-card settings-card"><h2>默认收货地址</h2><label><span>收货人</span><input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} /></label><label><span>街道地址</span><input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} placeholder="尚未填写" /></label><label><span>城市 / 州 / 邮编</span><input value={[address.city,address.state,address.postalCode].filter(Boolean).join(", ")} readOnly placeholder="在结算页完善地址" /></label><button className="secondary" onClick={() => { localStorage.setItem("coxof-address", JSON.stringify(address)); void syncWorkspace("profile", "upsert", { ...profile, address }); setToast("默认地址已保存并同步"); }}>保存地址</button></section>
          </div>
        </section>}

        {view === "help" && <section className="library-page help-page"><div className="help-hero"><span className="eyebrow">帮助中心</span><h1>需要什么帮助？</h1><p>查找从 AI 设计、Canvas 到生产下单的使用说明。</p><label><span>⌕</span><input value={helpQuery} onChange={(event) => setHelpQuery(event.target.value)} placeholder="搜索问题，例如：如何导出透明 PNG" /></label></div><div className="help-grid">{filteredHelp.map((item) => <button key={item.title} onClick={() => setArticle(item)}><i>{item.icon}</i><span><strong>{item.title}</strong><small>{item.text}</small></span><b>→</b></button>)}</div>{!filteredHelp.length && <div className="mini-empty"><span>⌕</span><strong>没有找到相关说明</strong><small>可以创建支持工单描述你的问题。</small><button onClick={() => setTicketOpen(true)}>创建工单</button></div>}<div className="support-card"><div><span className="eyebrow">仍然需要帮助？</span><h2>联系 coxof 支持</h2><p>提交问题时请附上项目名称、订单号和问题截图。</p></div><button className="primary" onClick={() => setTicketOpen(true)}>创建支持工单</button></div></section>}

        {planOpen && <div className="front-modal-backdrop" onMouseDown={() => setPlanOpen(false)}><section className="front-modal plan-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setPlanOpen(false)}>×</button><span className="eyebrow">套餐管理</span><h2>选择适合你的 AI 点数</h2><div className="plan-options"><button onClick={() => choosePlan("Creator 专业版", 1000)}><strong>Creator</strong><span>1,000 点 / 月</span><b>¥99</b></button><button className="featured" onClick={() => choosePlan("Business 商业版", 5000)}><em>推荐</em><strong>Business</strong><span>5,000 点 / 月</span><b>¥299</b></button><button onClick={() => choosePlan("Studio 团队版", 15000)}><strong>Studio</strong><span>15,000 点 / 月</span><b>¥699</b></button></div><small>当前为体验切换，不会产生真实扣款。</small></section></div>}
        {article && <div className="front-modal-backdrop" onMouseDown={() => setArticle(null)}><section className="front-modal article-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setArticle(null)}>×</button><i>{article.icon}</i><span className="eyebrow">使用说明</span><h2>{article.title}</h2><p>{article.text}</p><ol>{article.body.map((item) => <li key={item}>{item}</li>)}</ol><button className="primary" onClick={() => setArticle(null)}>我知道了</button></section></div>}
        {ticketOpen && <div className="front-modal-backdrop" onMouseDown={() => setTicketOpen(false)}><section className="front-modal ticket-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setTicketOpen(false)}>×</button><span className="eyebrow">支持工单</span><h2>描述你遇到的问题</h2><label><span>问题主题</span><input value={ticketSubject} onChange={(event) => setTicketSubject(event.target.value)} placeholder="例如：订单无法创建" /></label><label><span>详细说明</span><textarea value={ticketMessage} onChange={(event) => setTicketMessage(event.target.value)} placeholder="请写明页面、操作步骤和看到的提示" /></label><button className="primary full" onClick={submitTicket}>提交工单</button></section></div>}
      </main>
    </div>
  );
}

function Range({ label, value, min, max, suffix, change }: { label: string; value: number; min: number; max: number; suffix: string; change: (value: number) => void }) {
  return <label className="range-field"><span>{label}<b>{value}{suffix}</b></span><input type="range" min={min} max={max} value={value} onChange={(e) => change(Number(e.target.value))} /></label>;
}

function ProSelect({ label, value, options, change }: { label: string; value: string; options: string[]; change: (value: string) => void }) {
  return <label className="select"><span>{label}</span><select value={value} onChange={(event) => change(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function Mockup({ product, design, reference, compact = false }: { product: CatalogProduct; design: DesignState; reference?: ReferenceImage | null; compact?: boolean }) {
  return <div className={`product-mockup mockup-${product.visualType} ${compact ? "compact" : ""}`}><div className="mockup-object"><div className="print-area"><Artwork design={{ ...design, x: 0, y: 0, scale: compact ? 72 : 88 }} reference={reference} /></div></div><span>{product.name} · 正面</span></div>;
}

function Empty({ icon, title, text, action }: { icon: string; title: string; text: string; action: () => void }) {
  return <div className="state embedded"><div className="state-icon">{icon}</div><h1>{title}</h1><p>{text}</p><button className="primary" onClick={action}>开始设计</button></div>;
}
