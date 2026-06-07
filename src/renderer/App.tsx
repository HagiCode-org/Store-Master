import { useEffect, useState } from 'react';
import {
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  FileText,
  Globe2,
  History,
  Languages,
  PanelLeft,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card';
import { Input } from '@/components/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs';
import { cn } from '@/lib/utils';
import { changeAppLanguage } from '@/locales';

type StatusTone = 'healthy' | 'review' | 'missing';

type MarketRecordField = {
  label: string;
  value: string;
  owner: string;
};

type MarketChecklistItem = {
  label: string;
  state: StatusTone;
  note: string;
};

type MarketActivityItem = {
  timestamp: string;
  action: string;
  actor: string;
};

type Market = {
  id: string;
  name: string;
  channelId: string;
  defaultLocale: string;
  lastUpdated: string;
  status: StatusTone;
  coverage: string;
  syncMode: string;
  fields: MarketRecordField[];
  checklist: MarketChecklistItem[];
  activity: MarketActivityItem[];
};

type Product = {
  id: string;
  name: string;
  owner: string;
  productLead: string;
  status: StatusTone;
  lastUpdated: string;
  markets: Market[];
};

const products: Product[] = [
  {
    id: 'signal-desk',
    name: 'Signal Desk',
    owner: 'Publishing Ops',
    productLead: 'Mei Lin',
    status: 'healthy',
    lastUpdated: '2026-06-07 10:40',
    markets: [
      {
        id: 'signal-desk-steam',
        name: 'Steam',
        channelId: '2558440',
        defaultLocale: 'en-US',
        lastUpdated: '2026-06-07 10:40',
        status: 'healthy',
        coverage: '12 locales',
        syncMode: 'Manual review',
        fields: [
          { label: 'Store app ID', value: '2558440', owner: 'Publishing Ops' },
          { label: 'Package name', value: 'com.hagicode.signaldesk', owner: 'Release Engineering' },
          { label: 'Default branch', value: 'public-stable', owner: 'Release Engineering' },
          { label: 'Pricing tier', value: 'Tier B / USD 14.99', owner: 'Commercial' },
          { label: 'Capsule bundle', value: 'capsule-v12', owner: 'Creative' },
        ],
        checklist: [
          { label: 'Localized short description', state: 'healthy', note: 'Approved for all 12 locales' },
          { label: 'Age rating statement', state: 'healthy', note: 'PEGI and ESRB synced' },
          { label: 'Build mapping', state: 'healthy', note: 'Stable build linked to depot 3' },
        ],
        activity: [
          { timestamp: '2026-06-07 10:40', action: 'Metadata snapshot refreshed', actor: 'Local cache' },
          { timestamp: '2026-06-06 18:20', action: 'Capsule bundle updated to v12', actor: 'Creative' },
          { timestamp: '2026-06-05 16:05', action: 'Pricing tier confirmed for summer sale', actor: 'Commercial' },
        ],
      },
      {
        id: 'signal-desk-ms-store',
        name: 'MS Store',
        channelId: '9P7L6V1B8Q2R',
        defaultLocale: 'en-US',
        lastUpdated: '2026-06-06 21:15',
        status: 'review',
        coverage: '6 locales',
        syncMode: 'Field template',
        fields: [
          { label: 'Store listing ID', value: '9P7L6V1B8Q2R', owner: 'Publishing Ops' },
          { label: 'PFN', value: 'HagiCode.SignalDesk_q7x2p0m4n6z0', owner: 'Release Engineering' },
          { label: 'Submission branch', value: 'partner-preview', owner: 'Release Engineering' },
          { label: 'Pricing tier', value: 'Tier A / USD 12.99', owner: 'Commercial' },
          { label: 'Trailer slot', value: 'Pending review', owner: 'Creative' },
        ],
        checklist: [
          { label: 'Store trailer asset', state: 'review', note: 'Creative review scheduled for Monday' },
          { label: 'Capability declaration', state: 'healthy', note: 'Desktop bridge capability verified' },
          { label: 'IARC questionnaire', state: 'healthy', note: 'No change since last submission' },
        ],
        activity: [
          { timestamp: '2026-06-06 21:15', action: 'Submission branch changed to partner-preview', actor: 'Release Engineering' },
          { timestamp: '2026-06-06 20:05', action: 'PFN verified against packaged build', actor: 'Local validation' },
          { timestamp: '2026-06-05 09:30', action: 'Locale coverage expanded to 6 languages', actor: 'Localization' },
        ],
      },
    ],
  },
  {
    id: 'patch-harbor',
    name: 'Patch Harbor',
    owner: 'Release Engineering',
    productLead: 'Jun Park',
    status: 'review',
    lastUpdated: '2026-06-07 09:10',
    markets: [
      {
        id: 'patch-harbor-steam',
        name: 'Steam',
        channelId: '2842210',
        defaultLocale: 'zh-CN',
        lastUpdated: '2026-06-07 09:10',
        status: 'review',
        coverage: '4 locales',
        syncMode: 'Manual review',
        fields: [
          { label: 'Store app ID', value: '2842210', owner: 'Publishing Ops' },
          { label: 'Package name', value: 'com.hagicode.patchharbor', owner: 'Release Engineering' },
          { label: 'Default branch', value: 'release-candidate', owner: 'Release Engineering' },
          { label: 'Pricing tier', value: 'Tier C / USD 24.99', owner: 'Commercial' },
          { label: 'Hero capsule', value: 'capsule-rc-03', owner: 'Creative' },
        ],
        checklist: [
          { label: 'Early access disclosure', state: 'review', note: 'Copy needs legal review' },
          { label: 'Screenshot set', state: 'healthy', note: 'Six images uploaded' },
          { label: 'Build mapping', state: 'healthy', note: 'RC build linked to depot 1' },
        ],
        activity: [
          { timestamp: '2026-06-07 09:10', action: 'Release candidate branch promoted', actor: 'Release Engineering' },
          { timestamp: '2026-06-06 22:50', action: 'Hero capsule switched to rc-03', actor: 'Creative' },
          { timestamp: '2026-06-06 15:15', action: 'Legal review requested for early access copy', actor: 'Publishing Ops' },
        ],
      },
      {
        id: 'patch-harbor-ms-store',
        name: 'MS Store',
        channelId: '9N4C2K3Q8W1L',
        defaultLocale: 'zh-CN',
        lastUpdated: '2026-06-05 13:20',
        status: 'missing',
        coverage: '2 locales',
        syncMode: 'Template draft',
        fields: [
          { label: 'Store listing ID', value: '9N4C2K3Q8W1L', owner: 'Publishing Ops' },
          { label: 'PFN', value: 'Pending package identity', owner: 'Release Engineering' },
          { label: 'Submission branch', value: 'Not linked', owner: 'Release Engineering' },
          { label: 'Pricing tier', value: 'Draft / not approved', owner: 'Commercial' },
          { label: 'Store trailer', value: 'Not assigned', owner: 'Creative' },
        ],
        checklist: [
          { label: 'Package identity', state: 'missing', note: 'PFN is required before submission' },
          { label: 'Trailer asset', state: 'missing', note: 'No asset owner assigned yet' },
          { label: 'IARC questionnaire', state: 'review', note: 'Questionnaire draft exists but is not submitted' },
        ],
        activity: [
          { timestamp: '2026-06-05 13:20', action: 'MS Store record created from product template', actor: 'Local setup' },
          { timestamp: '2026-06-05 13:18', action: 'Checklist initialized with required Microsoft fields', actor: 'Local setup' },
        ],
      },
    ],
  },
  {
    id: 'orbital-notes',
    name: 'Orbital Notes',
    owner: 'Content Team',
    productLead: 'Ava Stone',
    status: 'healthy',
    lastUpdated: '2026-06-04 17:05',
    markets: [
      {
        id: 'orbital-notes-steam',
        name: 'Steam',
        channelId: '3011180',
        defaultLocale: 'en-US',
        lastUpdated: '2026-06-04 17:05',
        status: 'healthy',
        coverage: '8 locales',
        syncMode: 'Field template',
        fields: [
          { label: 'Store app ID', value: '3011180', owner: 'Publishing Ops' },
          { label: 'Package name', value: 'com.hagicode.orbitalnotes', owner: 'Release Engineering' },
          { label: 'Default branch', value: 'live', owner: 'Release Engineering' },
          { label: 'Pricing tier', value: 'Tier A / USD 9.99', owner: 'Commercial' },
          { label: 'Capsule bundle', value: 'capsule-v04', owner: 'Creative' },
        ],
        checklist: [
          { label: 'Localized short description', state: 'healthy', note: 'Synced from master copy set' },
          { label: 'Screenshot set', state: 'healthy', note: 'All aspect ratios approved' },
          { label: 'Release notes', state: 'healthy', note: 'Pulled from changelog template' },
        ],
        activity: [
          { timestamp: '2026-06-04 17:05', action: 'Release notes synced from local changelog', actor: 'Content Team' },
          { timestamp: '2026-06-04 16:30', action: 'Pricing tier confirmed for launch', actor: 'Commercial' },
          { timestamp: '2026-06-03 11:40', action: 'Steam template applied to product', actor: 'Publishing Ops' },
        ],
      },
    ],
  },
];

const copy = {
  'en-US': {
    workspaceLabel: 'Local store registry',
    headerTitle: 'Store registry workbench',
    headerSubtitle: 'Maintain product-first store metadata locally, then expand each product into market-specific records.',
    searchPlaceholder: 'Search product, market, or store ID',
    actions: {
      refresh: 'Refresh snapshot',
      addProduct: 'Add product',
    },
    metrics: {
      products: 'Products',
      markets: 'Markets',
      review: 'Need review',
    },
    nav: {
      products: 'Products',
      markets: 'Markets',
      review: 'Review queue',
      activity: 'Activity log',
    },
    hierarchyTitle: 'Hierarchy',
    hierarchyDescription: 'Product first, then market, then record-level maintenance.',
    hierarchy: [
      { title: 'Product', description: 'The master record, release owner, and shared intent.' },
      { title: 'Market', description: 'A channel such as Steam or MS Store bound to one product.' },
      { title: 'Market record', description: 'Identifiers, assets, compliance, and last-mile store data.' },
    ],
    productsTitle: 'Product registry',
    productsDescription: 'Use the product layer to decide which titles exist and how many markets each title owns.',
    productsColumns: {
      product: 'Product',
      owner: 'Owner',
      markets: 'Markets',
      review: 'Review',
      updated: 'Updated',
    },
    selectedProductLabel: 'Selected product',
    marketsTitle: 'Market registry',
    marketsDescription: 'Each selected product expands into market rows. Keep identifiers and publishing readiness explicit.',
    marketsColumns: {
      market: 'Market',
      channelId: 'Channel ID',
      locale: 'Default locale',
      syncMode: 'Sync mode',
      updated: 'Updated',
    },
    detailsTitle: 'Market record detail',
    detailsDescription: 'Field ownership, submission checklist, and the latest local activity for the active market.',
    detailMeta: {
      locale: 'Locale',
      syncMode: 'Sync mode',
      pending: 'Pending items',
    },
    tabs: {
      fields: 'Fields',
      checklist: 'Checklist',
      activity: 'Activity',
    },
    fieldColumns: {
      field: 'Field',
      value: 'Value',
      owner: 'Owner',
    },
    checklistColumns: {
      item: 'Requirement',
      state: 'State',
      note: 'Note',
    },
    activityColumns: {
      time: 'Time',
      action: 'Action',
      actor: 'Actor',
    },
    status: {
      healthy: 'Ready',
      review: 'Needs review',
      missing: 'Missing fields',
    },
  },
  'zh-CN': {
    workspaceLabel: '本机市场资料台账',
    headerTitle: '商店资料工作台',
    headerSubtitle: '先维护产品主档，再展开到各市场的专属资料，适合本机集中整理与发布前核对。',
    searchPlaceholder: '搜索产品、市场或商店 ID',
    actions: {
      refresh: '刷新快照',
      addProduct: '新增产品',
    },
    metrics: {
      products: '产品数',
      markets: '市场数',
      review: '待复核',
    },
    nav: {
      products: '产品',
      markets: '市场',
      review: '复核队列',
      activity: '活动日志',
    },
    hierarchyTitle: '层级结构',
    hierarchyDescription: '先看产品，再看市场，最后进入市场资料明细。',
    hierarchy: [
      { title: '产品', description: '产品主档，负责统一的发行对象、负责人和基础信息。' },
      { title: '市场', description: '挂在产品下的渠道，例如 Steam、MS Store。' },
      { title: '市场资料', description: '渠道专属的标识、素材、合规项和最后维护记录。' },
    ],
    productsTitle: '产品台账',
    productsDescription: '产品层负责定义有哪些标题存在，以及每个标题下面挂了多少个市场。',
    productsColumns: {
      product: '产品',
      owner: '归属',
      markets: '市场数',
      review: '待复核',
      updated: '更新时间',
    },
    selectedProductLabel: '当前产品',
    marketsTitle: '市场台账',
    marketsDescription: '选中一个产品后，下方只展示该产品的市场行，便于逐个维护各渠道字段。',
    marketsColumns: {
      market: '市场',
      channelId: '渠道 ID',
      locale: '默认语言',
      syncMode: '同步方式',
      updated: '更新时间',
    },
    detailsTitle: '市场资料明细',
    detailsDescription: '右侧面板承接当前市场的字段归属、提交流程检查项和最近一次本机动作。',
    detailMeta: {
      locale: '语言',
      syncMode: '同步方式',
      pending: '待处理项',
    },
    tabs: {
      fields: '字段',
      checklist: '检查项',
      activity: '活动',
    },
    fieldColumns: {
      field: '字段',
      value: '值',
      owner: '负责人',
    },
    checklistColumns: {
      item: '要求项',
      state: '状态',
      note: '说明',
    },
    activityColumns: {
      time: '时间',
      action: '动作',
      actor: '执行者',
    },
    status: {
      healthy: '就绪',
      review: '待复核',
      missing: '缺少字段',
    },
  },
} as const;

function getStatusClasses(status: StatusTone): string {
  switch (status) {
    case 'healthy':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'review':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'missing':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-border bg-secondary text-secondary-foreground';
  }
}

function getStateIcon(status: StatusTone) {
  return status === 'healthy' ? CheckCircle2 : CircleAlert;
}

function App() {
  const { i18n } = useTranslation();
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? '');
  const [selectedMarketId, setSelectedMarketId] = useState(products[0]?.markets[0]?.id ?? '');

  useEffect(() => {
    const nextProduct = products.find((product) => product.id === selectedProductId) ?? products[0];
    const hasSelectedMarket = nextProduct?.markets.some((market) => market.id === selectedMarketId);

    if (!hasSelectedMarket) {
      setSelectedMarketId(nextProduct?.markets[0]?.id ?? '');
    }
  }, [selectedProductId, selectedMarketId]);

  const language = i18n.resolvedLanguage?.startsWith('zh') ? 'zh-CN' : 'en-US';
  const text = copy[language];
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0];
  const selectedMarket = selectedProduct.markets.find((market) => market.id === selectedMarketId) ?? selectedProduct.markets[0];
  const totalMarkets = products.reduce((total, product) => total + product.markets.length, 0);
  const reviewCount = products.reduce(
    (total, product) => total + product.markets.filter((market) => market.status !== 'healthy').length,
    0,
  );
  const pendingCount = selectedMarket.checklist.filter((item) => item.state !== 'healthy').length;

  const ProductStatusIcon = getStateIcon(selectedProduct.status);
  const MarketStatusIcon = getStateIcon(selectedMarket.status);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-[var(--surface-sidebar)] lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Store Master</p>
                <p className="text-xs text-muted-foreground">{text.workspaceLabel}</p>
              </div>
            </div>

            <nav className="grid gap-1.5">
              <button className="flex items-center justify-between rounded-lg bg-primary/8 px-3 py-2 text-left text-sm font-medium text-foreground">
                <span className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-primary" />
                  {text.nav.products}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground">
                <Globe2 className="h-4 w-4" />
                {text.nav.markets}
              </button>
              <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground">
                <ClipboardList className="h-4 w-4" />
                {text.nav.review}
              </button>
              <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground">
                <History className="h-4 w-4" />
                {text.nav.activity}
              </button>
            </nav>

            <Card className="shadow-none">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-semibold">{text.hierarchyTitle}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {text.hierarchyDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 text-sm">
                {text.hierarchy.map((item, index) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-xs leading-5 text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="mt-auto rounded-lg border border-border bg-[var(--surface-panel)] px-3 py-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{selectedProduct.productLead}</p>
              <p className="mt-1">{text.selectedProductLabel}</p>
              <p className="mt-1 truncate">{selectedProduct.name}</p>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-col">
          <header className="border-b border-border bg-[var(--surface-toolbar)]">
            <div className="flex flex-col gap-4 px-4 py-4 xl:flex-row xl:items-start xl:justify-between xl:px-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  <PanelLeft className="h-4 w-4" />
                  {text.workspaceLabel}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-foreground">{text.headerTitle}</h1>
                  <Badge className={cn('gap-1.5 text-[11px]', getStatusClasses(selectedProduct.status))}>
                    <ProductStatusIcon className="h-3.5 w-3.5" />
                    {text.status[selectedProduct.status]}
                  </Badge>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{text.headerSubtitle}</p>
              </div>

              <div className="flex w-full flex-col gap-2 xl:w-auto xl:min-w-[28rem]">
                <div className="flex flex-col gap-2 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" placeholder={text.searchPlaceholder} />
                  </div>
                  <div className="flex items-center rounded-lg border border-border bg-background p-1">
                    <button
                      className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        language === 'en-US' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
                      )}
                      onClick={() => void changeAppLanguage('en-US')}
                      type="button"
                    >
                      EN
                    </button>
                    <button
                      className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        language === 'zh-CN' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
                      )}
                      onClick={() => void changeAppLanguage('zh-CN')}
                      type="button"
                    >
                      中文
                    </button>
                    <Languages className="ml-1 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button className="flex-1 md:flex-none" variant="outline">
                    <RefreshCw className="h-4 w-4" />
                    {text.actions.refresh}
                  </Button>
                  <Button className="flex-1 md:flex-none">
                    <Plus className="h-4 w-4" />
                    {text.actions.addProduct}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 px-4 pb-4 xl:px-5">
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <span className="font-medium text-foreground">{products.length}</span>
                <span className="text-muted-foreground">{text.metrics.products}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <span className="font-medium text-foreground">{totalMarkets}</span>
                <span className="text-muted-foreground">{text.metrics.markets}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <span className="font-medium text-foreground">{reviewCount}</span>
                <span className="text-muted-foreground">{text.metrics.review}</span>
              </div>
            </div>
          </header>

          <div className="grid flex-1 gap-4 p-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.9fr)] xl:p-5">
            <section className="grid min-h-0 gap-4">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-col gap-2 border-b border-border bg-[var(--surface-panel-muted)]/65 px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <CardTitle className="text-base">{text.productsTitle}</CardTitle>
                    <CardDescription className="mt-1 text-sm text-muted-foreground">{text.productsDescription}</CardDescription>
                  </div>
                </CardHeader>
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[var(--surface-panel-muted)] text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">{text.productsColumns.product}</th>
                        <th className="px-4 py-3">{text.productsColumns.owner}</th>
                        <th className="px-4 py-3">{text.productsColumns.markets}</th>
                        <th className="px-4 py-3">{text.productsColumns.review}</th>
                        <th className="px-4 py-3">{text.productsColumns.updated}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => {
                        const isSelected = product.id === selectedProduct.id;
                        const issueCount = product.markets.filter((market) => market.status !== 'healthy').length;
                        const StatusIcon = getStateIcon(product.status);

                        return (
                          <tr
                            aria-selected={isSelected}
                            className={cn(
                              'cursor-pointer border-t border-border transition-colors hover:bg-secondary/60',
                              isSelected && 'bg-primary/[0.08]',
                            )}
                            key={product.id}
                            onClick={() => setSelectedProductId(product.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setSelectedProductId(product.id);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                                  <Boxes className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{product.name}</div>
                                  <div className="text-xs text-muted-foreground">{product.productLead}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">{product.owner}</td>
                            <td className="px-4 py-3.5 text-muted-foreground">{product.markets.length}</td>
                            <td className="px-4 py-3.5">
                              <Badge className={cn('gap-1.5 text-[11px]', getStatusClasses(product.status))}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                {issueCount}
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">{product.lastUpdated}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="flex flex-col gap-2 border-b border-border bg-[var(--surface-panel-muted)]/65 px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <CardTitle className="text-base">{text.marketsTitle}</CardTitle>
                    <CardDescription className="mt-1 text-sm text-muted-foreground">{text.marketsDescription}</CardDescription>
                  </div>
                  <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                    {text.selectedProductLabel}: <span className="font-medium text-foreground">{selectedProduct.name}</span>
                  </div>
                </CardHeader>
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[var(--surface-panel-muted)] text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">{text.marketsColumns.market}</th>
                        <th className="px-4 py-3">{text.marketsColumns.channelId}</th>
                        <th className="px-4 py-3">{text.marketsColumns.locale}</th>
                        <th className="px-4 py-3">{text.marketsColumns.syncMode}</th>
                        <th className="px-4 py-3">{text.marketsColumns.updated}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProduct.markets.map((market) => {
                        const isSelected = market.id === selectedMarket.id;
                        const StatusIcon = getStateIcon(market.status);

                        return (
                          <tr
                            aria-selected={isSelected}
                            className={cn(
                              'cursor-pointer border-t border-border transition-colors hover:bg-secondary/60',
                              isSelected && 'bg-accent/65',
                            )}
                            key={market.id}
                            onClick={() => setSelectedMarketId(market.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setSelectedMarketId(market.id);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                                  <Globe2 className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{market.name}</div>
                                  <div className="text-xs text-muted-foreground">{market.coverage}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[13px] text-muted-foreground">{market.channelId}</td>
                            <td className="px-4 py-3.5 text-muted-foreground">{market.defaultLocale}</td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <Badge className={cn('gap-1.5 text-[11px]', getStatusClasses(market.status))}>
                                  <StatusIcon className="h-3.5 w-3.5" />
                                  {text.status[market.status]}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{market.syncMode}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">{market.lastUpdated}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>

            <Card className="flex min-h-[34rem] flex-col overflow-hidden">
              <CardHeader className="gap-3 border-b border-border bg-[var(--surface-panel-muted)]/65 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{text.detailsTitle}</CardTitle>
                    <CardDescription className="mt-1 text-sm text-muted-foreground">{text.detailsDescription}</CardDescription>
                  </div>
                  <Badge className={cn('gap-1.5 text-[11px]', getStatusClasses(selectedMarket.status))}>
                    <MarketStatusIcon className="h-3.5 w-3.5" />
                    {text.status[selectedMarket.status]}
                  </Badge>
                </div>

                <div className="grid gap-2 rounded-xl border border-border bg-background p-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{text.detailMeta.locale}</p>
                    <p className="mt-1 font-medium text-foreground">{selectedMarket.defaultLocale}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{text.detailMeta.syncMode}</p>
                    <p className="mt-1 font-medium text-foreground">{selectedMarket.syncMode}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{text.detailMeta.pending}</p>
                    <p className="mt-1 font-medium text-foreground">{pendingCount}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex min-h-0 flex-1 flex-col p-4">
                <Tabs className="flex min-h-0 flex-1 flex-col" defaultValue="fields">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="fields">
                      <FileText className="h-4 w-4" />
                      {text.tabs.fields}
                    </TabsTrigger>
                    <TabsTrigger value="checklist">
                      <ShieldCheck className="h-4 w-4" />
                      {text.tabs.checklist}
                    </TabsTrigger>
                    <TabsTrigger value="activity">
                      <History className="h-4 w-4" />
                      {text.tabs.activity}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent className="mt-4 min-h-0 flex-1 overflow-auto" value="fields">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        <tr>
                          <th className="px-2 py-2">{text.fieldColumns.field}</th>
                          <th className="px-2 py-2">{text.fieldColumns.value}</th>
                          <th className="px-2 py-2">{text.fieldColumns.owner}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMarket.fields.map((field) => (
                          <tr className="border-t border-border" key={field.label}>
                            <td className="px-2 py-3 font-medium text-foreground">{field.label}</td>
                            <td className="px-2 py-3 text-muted-foreground">{field.value}</td>
                            <td className="px-2 py-3 text-muted-foreground">{field.owner}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TabsContent>

                  <TabsContent className="mt-4 min-h-0 flex-1 overflow-auto" value="checklist">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        <tr>
                          <th className="px-2 py-2">{text.checklistColumns.item}</th>
                          <th className="px-2 py-2">{text.checklistColumns.state}</th>
                          <th className="px-2 py-2">{text.checklistColumns.note}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMarket.checklist.map((item) => {
                          const StatusIcon = getStateIcon(item.state);

                          return (
                            <tr className="border-t border-border" key={item.label}>
                              <td className="px-2 py-3 font-medium text-foreground">{item.label}</td>
                              <td className="px-2 py-3">
                                <Badge className={cn('gap-1.5 text-[11px]', getStatusClasses(item.state))}>
                                  <StatusIcon className="h-3.5 w-3.5" />
                                  {text.status[item.state]}
                                </Badge>
                              </td>
                              <td className="px-2 py-3 text-muted-foreground">{item.note}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </TabsContent>

                  <TabsContent className="mt-4 min-h-0 flex-1 overflow-auto" value="activity">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        <tr>
                          <th className="px-2 py-2">{text.activityColumns.time}</th>
                          <th className="px-2 py-2">{text.activityColumns.action}</th>
                          <th className="px-2 py-2">{text.activityColumns.actor}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMarket.activity.map((item) => (
                          <tr className="border-t border-border" key={`${item.timestamp}-${item.action}`}>
                            <td className="px-2 py-3 font-mono text-[13px] text-muted-foreground">{item.timestamp}</td>
                            <td className="px-2 py-3 font-medium text-foreground">{item.action}</td>
                            <td className="px-2 py-3 text-muted-foreground">{item.actor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
