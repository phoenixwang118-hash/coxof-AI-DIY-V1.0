import { useMemo, useState } from 'react'
import {
  Bell,
  Boxes,
  ChevronDown,
  CircleHelp,
  Clock3,
  Frame,
  Image,
  Layers3,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Plus,
  Search,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  Upload,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react'
import './App.css'

type Product = {
  id: number
  name: string
  category: string
  price: string
  size: string
  color: string
  ink: string
  badge?: string
}

type View = 'catalog' | 'design' | 'projects' | 'coming'
type DesignMode = 'text' | 'image'
type ParameterMode = 'auto' | 'pro'

const products: Product[] = [
  { id: 1, name: '经典纯棉 T 恤', category: '服装', price: '¥39', size: 'A3 / 30×42 cm', color: '#eee6d8', ink: '#161616', badge: '热门' },
  { id: 2, name: '连帽卫衣', category: '服装', price: '¥89', size: 'A3 / 30×42 cm', color: '#15171b', ink: '#f2f0e9' },
  { id: 3, name: '陶瓷马克杯', category: '家居', price: '¥29', size: '20×8.5 cm', color: '#f3f0e7', ink: '#e34f2f' },
  { id: 4, name: '装饰挂画', category: '家居', price: '¥99', size: '40×60 cm', color: '#d9bea2', ink: '#223b33', badge: '新品' },
  { id: 5, name: '艺术海报', category: '家居', price: '¥19', size: 'A2 / 42×59.4 cm', color: '#f1c2b4', ink: '#922f2b' },
  { id: 6, name: '方形抱枕', category: '家居', price: '¥49', size: '45×45 cm', color: '#e8c74d', ink: '#273a66' },
  { id: 7, name: '手机壳', category: '数码', price: '¥35', size: '多机型适配', color: '#b9cfeb', ink: '#24344f' },
  { id: 8, name: '帆布托特包', category: '配饰', price: '¥45', size: '35×40 cm', color: '#e9dfc9', ink: '#315845' },
]

const categories = ['全部', '服装', '家居', '数码', '配饰']

const navItems = [
  { label: '工作台', icon: LayoutDashboard, view: 'catalog' as View },
  { label: '产品目录', icon: Boxes, view: 'catalog' as View },
  { label: 'AI Design', icon: WandSparkles, view: 'design' as View },
  { label: '我的项目', icon: Layers3, view: 'projects' as View },
]

const nextStageItems = [
  { label: 'Canvas 编辑器', icon: Frame },
  { label: 'Mockup 样机', icon: Shirt },
  { label: '订单中心', icon: PackageCheck },
]

const styleOptions = ['自动匹配', '复古徽章', '极简排版', '手绘插画', '街头涂鸦']

function ProductVisual({ product, compact = false }: { product: Product; compact?: boolean }) {
  const typeClass =
    product.id === 1 ? 'tee' :
    product.id === 2 ? 'hoodie' :
    product.id === 3 ? 'mug' :
    product.id === 4 ? 'frame' :
    product.id === 5 ? 'poster' :
    product.id === 6 ? 'pillow' :
    product.id === 7 ? 'phone' : 'tote'

  return (
    <div
      className={`product-visual ${compact ? 'compact' : ''}`}
      style={{ '--product': product.color, '--ink': product.ink } as React.CSSProperties}
      aria-label={`${product.name}预览`}
    >
      <div className={`product-shape ${typeClass}`}>
        <span className="art-mark">{product.id % 2 === 0 ? 'COXOF' : 'MAKE\nYOURS'}</span>
      </div>
    </div>
  )
}

function App() {
  const [view, setView] = useState<View>('catalog')
  const [category, setCategory] = useState('全部')
  const [query, setQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0])
  const [designMode, setDesignMode] = useState<DesignMode>('text')
  const [parameterMode, setParameterMode] = useState<ParameterMode>('auto')
  const [prompt, setPrompt] = useState('复古日落下的山脉与松树，加入 “EXPLORE MORE” 英文字体，适合美国户外爱好者')
  const [style, setStyle] = useState(styleOptions[0])
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch = category === '全部' || product.category === category
      const queryMatch = product.name.toLowerCase().includes(query.toLowerCase())
      return categoryMatch && queryMatch
    })
  }, [category, query])

  const openDesign = (product: Product) => {
    setSelectedProduct(product)
    setView('design')
    setGenerated(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const generateDesign = () => {
    if (!prompt.trim() && designMode === 'text') return
    setGenerating(true)
    setGenerated(false)
    window.setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
    }, 900)
  }

  const selectView = (nextView: View) => {
    setView(nextView)
    setMobileNav(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><span>c</span><i>×</i></div>
          <div>
            <strong>coxof</strong>
            <small>AI DIY · POD</small>
          </div>
          <button className="icon-button close-nav" onClick={() => setMobileNav(false)} aria-label="关闭导航"><X /></button>
        </div>

        <nav className="main-nav" aria-label="主导航">
          <p className="nav-heading">设计工作台</p>
          {navItems.map((item) => (
            <button
              className={view === item.view && (item.label !== '工作台' || view === 'catalog') ? 'active' : ''}
              key={item.label}
              onClick={() => selectView(item.view)}
            >
              <item.icon />
              <span>{item.label}</span>
              {item.label === 'AI Design' && <b>核心</b>}
            </button>
          ))}

          <p className="nav-heading stage-heading">下一阶段</p>
          {nextStageItems.map((item) => (
            <button className="locked" key={item.label} onClick={() => selectView('coming')}>
              <item.icon />
              <span>{item.label}</span>
              <small>即将上线</small>
            </button>
          ))}
        </nav>

        <div className="sidebar-plan">
          <div className="plan-row"><span>本月 AI 点数</span><strong>680 / 1,000</strong></div>
          <div className="progress"><i /></div>
          <button>升级专业版 <Zap /></button>
        </div>

        <div className="profile">
          <span className="avatar">PW</span>
          <div><strong>Phoenix</strong><small>品牌工作区</small></div>
          <ChevronDown />
        </div>
      </aside>

      {mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} aria-label="关闭导航遮罩" />}

      <main>
        <header className="topbar">
          <div className="topbar-title">
            <button className="icon-button menu-button" onClick={() => setMobileNav(true)} aria-label="打开导航"><Menu /></button>
            <div>
              <strong>{view === 'design' ? 'AI Design' : view === 'projects' ? '我的项目' : view === 'coming' ? '下一阶段' : 'POD 产品中心'}</strong>
              <small>{view === 'design' ? '产品 × 创意 × 生成' : 'coxof AI DIY V1.0'}</small>
            </div>
          </div>
          <div className="topbar-actions">
            <label className="global-search">
              <Search />
              <input placeholder="搜索产品、项目…" />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button" aria-label="帮助"><CircleHelp /></button>
            <button className="icon-button notification" aria-label="通知"><Bell /><i /></button>
            <button className="new-design" onClick={() => openDesign(selectedProduct)}><Plus /> 新建设计</button>
          </div>
        </header>

        {view === 'catalog' && (
          <section className="page catalog-page">
            <div className="welcome">
              <div>
                <span className="eyebrow"><Sparkles /> POD 创作，从产品开始</span>
                <h1>选择产品，让 AI 完成第一版设计</h1>
                <p>先锁定印刷尺寸与商品成本，再进入文生图或图生图。减少参数，快速得到可继续编辑的商业方案。</p>
                <div className="welcome-actions">
                  <button className="primary" onClick={() => openDesign(products[0])}><WandSparkles /> 开始 AI Design</button>
                  <button className="secondary" onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}>浏览产品目录</button>
                </div>
              </div>
              <div className="hero-stack" aria-hidden="true">
                <div className="hero-card card-back"><ProductVisual product={products[7]} compact /></div>
                <div className="hero-card card-middle"><ProductVisual product={products[5]} compact /></div>
                <div className="hero-card card-front">
                  <span>当前热门</span>
                  <ProductVisual product={products[0]} compact />
                  <strong>经典纯棉 T 恤</strong>
                  <small>¥39 · 适合快速起款</small>
                </div>
              </div>
            </div>

            <div className="workflow-strip">
              <div className="workflow-title"><strong>首版闭环</strong><span>3 步完成一个 POD 设计</span></div>
              <div className="workflow-step active"><b>1</b><span>选择产品<small>锁定印刷规格</small></span></div>
              <i />
              <div className="workflow-step"><b>2</b><span>AI Design<small>生成设计方案</small></span></div>
              <i />
              <div className="workflow-step muted"><b>3</b><span>保存项目<small>等待后续编辑</small></span></div>
            </div>

            <div className="section-head" id="catalog">
              <div><span className="eyebrow">产品目录</span><h2>为你的创意选择载体</h2></div>
              <div className="catalog-tools">
                <label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索产品" /></label>
                <button><span>推荐排序</span><ChevronDown /></button>
              </div>
            </div>

            <div className="category-tabs">
              {categories.map((item) => (
                <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>
              ))}
            </div>

            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  {product.badge && <span className={`product-badge ${product.badge === '新品' ? 'new' : ''}`}>{product.badge}</span>}
                  <ProductVisual product={product} />
                  <div className="product-info">
                    <div><small>{product.category}</small><h3>{product.name}</h3></div>
                    <strong>{product.price}<small> 起</small></strong>
                  </div>
                  <div className="product-meta"><span>印刷区 {product.size}</span><span>按需生产</span></div>
                  <button onClick={() => openDesign(product)}>选择并设计 <WandSparkles /></button>
                </article>
              ))}
            </div>
          </section>
        )}

        {view === 'design' && (
          <section className="design-page">
            <div className="design-header">
              <div>
                <button className="back-link" onClick={() => setView('catalog')}>← 返回产品目录</button>
                <h1>创建你的 POD 设计</h1>
                <p>产品规格已锁定。输入创意后，AI 将自动整理成适合印刷的设计提示词。</p>
              </div>
              <div className="design-steps">
                <span className="done"><b>1</b>产品</span><i />
                <span className="active"><b>2</b>AI 设计</span><i />
                <span><b>3</b>保存</span>
              </div>
            </div>

            <div className="design-workspace">
              <div className="design-controls">
                <section className="control-card product-selection">
                  <div className="control-title"><span><b>01</b> 当前产品</span><button onClick={() => setView('catalog')}>更换</button></div>
                  <div className="selected-product">
                    <ProductVisual product={selectedProduct} compact />
                    <div><small>{selectedProduct.category}</small><strong>{selectedProduct.name}</strong><span>{selectedProduct.price} · 印刷区 {selectedProduct.size}</span></div>
                  </div>
                </section>

                <section className="control-card">
                  <div className="control-title"><span><b>02</b> 生成方式</span></div>
                  <div className="segmented">
                    <button className={designMode === 'text' ? 'active' : ''} onClick={() => setDesignMode('text')}><Sparkles /> 文生图</button>
                    <button className={designMode === 'image' ? 'active' : ''} onClick={() => setDesignMode('image')}><Image /> 图生图</button>
                  </div>

                  {designMode === 'image' && (
                    <button className="upload-zone">
                      <Upload />
                      <strong>上传参考图</strong>
                      <span>PNG、JPG，最大 10 MB</span>
                    </button>
                  )}

                  <label className="prompt-label">
                    <span>描述你的设计 <small>{prompt.length}/500</small></span>
                    <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={500} placeholder="例如：复古日落、山脉、户外探险文字…" />
                  </label>
                  <div className="prompt-suggestions">
                    <span>灵感：</span>
                    {['美式复古', '花卉排版', '极简线稿'].map((suggestion) => (
                      <button key={suggestion} onClick={() => setPrompt(`${suggestion}风格，适合${selectedProduct.name}的商业 POD 设计`)}>{suggestion}</button>
                    ))}
                  </div>
                </section>

                <section className="control-card">
                  <div className="control-title"><span><b>03</b> 设计控制</span><small>推荐自动模式</small></div>
                  <div className="mode-switch">
                    <button className={parameterMode === 'auto' ? 'active' : ''} onClick={() => setParameterMode('auto')}><Zap /> 自动模式<small>AI 匹配最佳参数</small></button>
                    <button className={parameterMode === 'pro' ? 'active' : ''} onClick={() => setParameterMode('pro')}><Settings /> 专业模式<small>手动控制细节</small></button>
                  </div>
                  <label className="select-label">
                    <span>视觉风格</span>
                    <select value={style} onChange={(event) => setStyle(event.target.value)}>
                      {styleOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                  {parameterMode === 'pro' && (
                    <div className="pro-grid">
                      <label><span>排版</span><select><option>中心徽章</option><option>上下结构</option><option>满版</option></select></label>
                      <label><span>色彩</span><select><option>3 色以内</option><option>单色</option><option>全彩</option></select></label>
                      <label><span>背景</span><select><option>透明</option><option>纯色</option></select></label>
                      <label><span>方案数</span><select><option>4 张</option><option>2 张</option></select></label>
                    </div>
                  )}
                </section>

                <button className="generate-button" disabled={generating || (!prompt.trim() && designMode === 'text')} onClick={generateDesign}>
                  {generating ? <><span className="spinner" /> 正在生成商业设计…</> : <><WandSparkles /> 生成 4 个设计方案 <span>消耗 4 点</span></>}
                </button>
              </div>

              <aside className="result-panel">
                <div className="result-head">
                  <div><span className="eyebrow">设计结果</span><h2>{generated ? '选择一个方向继续' : '等待你的创意'}</h2></div>
                  {generated && <button><Clock3 /> 历史记录</button>}
                </div>
                {!generated && !generating && (
                  <div className="empty-result">
                    <div className="empty-art"><Sparkles /><span>AI</span><WandSparkles /></div>
                    <h3>你的设计将在这里出现</h3>
                    <p>完成左侧设置并点击“生成设计方案”。系统会根据产品印刷区自动优化构图、文字与背景。</p>
                    <div className="auto-summary">
                      <strong>自动处理</strong>
                      <span>✓ 印刷比例适配</span><span>✓ 透明背景</span><span>✓ 商业构图优化</span>
                    </div>
                  </div>
                )}
                {generating && (
                  <div className="generating-grid">
                    {[1, 2, 3, 4].map((item) => <div key={item}><span /></div>)}
                    <p><Sparkles /> 正在理解提示词并匹配 {selectedProduct.name}…</p>
                  </div>
                )}
                {generated && (
                  <>
                    <div className="result-grid">
                      {['SUNSET CLUB', 'EXPLORE MORE', 'WILD OUTDOORS', 'GO BEYOND'].map((text, index) => (
                        <button className="result-card" key={text}>
                          <div className={`generated-art art-${index + 1}`}>
                            <span className="sun" />
                            <i className="mountain one" /><i className="mountain two" />
                            <strong>{text}</strong><small>EST. 2026</small>
                          </div>
                          <span>方案 {index + 1}<small>{style}</small></span>
                        </button>
                      ))}
                    </div>
                    <div className="result-actions">
                      <button className="secondary" onClick={generateDesign}><Sparkles /> 再生成一组</button>
                      <button className="primary">保存到我的项目 <Layers3 /></button>
                    </div>
                    <p className="phase-note"><Frame /> Canvas 与 Mockup 将在下一阶段接入，当前先保存原始设计与参数。</p>
                  </>
                )}
              </aside>
            </div>
          </section>
        )}

        {view === 'projects' && (
          <section className="page state-page">
            <div className="state-icon"><Layers3 /></div>
            <span className="eyebrow">我的项目</span>
            <h1>设计资产将集中保存在这里</h1>
            <p>第一阶段将保存产品、提示词、参数与生成结果，为后续 Canvas 编辑和 Mockup 渲染提供统一数据。</p>
            <button className="primary" onClick={() => openDesign(selectedProduct)}><Plus /> 创建第一个设计</button>
          </section>
        )}

        {view === 'coming' && (
          <section className="page state-page">
            <div className="state-icon"><ShoppingBag /></div>
            <span className="eyebrow">Phase 2</span>
            <h1>Canvas、Mockup 与订单系统</h1>
            <p>这些模块已保留入口，但会在 POD 桌面、产品目录与 AI Design 主流程稳定后再接入。</p>
            <button className="secondary" onClick={() => setView('catalog')}>返回产品中心</button>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
