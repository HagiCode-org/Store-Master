import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const languageStorageKey = 'storeMaster.language';

const resources = {
  'en-US': {
    common: {
      'app.name': 'Store Master',
      'language.switch': 'Switch language',
      'language.english': 'English',
      'language.chinese': '中文',
      'button.save': 'Save',
      'button.cancel': 'Cancel',
      'button.continue': 'Continue',
      shell: {
        workspaceLabel: 'Local product ledger',
        title: 'Product management workspace',
        subtitle: 'Maintain core product records locally before expanding into market-specific store content.',
        searchPlaceholder: 'Search products, folder names, or market labels',
        activeSectionLabel: 'Active section',
      },
      navigation: {
        products: 'Products',
        productProfile: 'Product Profile',
        settings: 'Settings',
      },
      sidebar: {
        navigationLabel: 'Primary navigation',
        productCount: '{{count}} products tracked',
        collapseLabel: 'Collapse sidebar',
        expandLabel: 'Expand sidebar',
        currentProductLabel: 'Current product',
        folderLabel: 'Folder',
        folderFallback: 'not-set',
        marketsLabel: 'Markets',
        noProduct: 'No product selected',
      },
      products: {
        registryTitle: 'Product registry',
        registryDescription: 'Select a product, create a local draft, and keep the core record ready for market-specific work.',
        countLabel: '{{count}} total',
        addProduct: 'Add product',
        noProducts: 'No products match the current filter.',
        untitledProduct: 'Untitled product',
        noMarketsSelected: 'No market selected',
        table: {
          name: 'Product name',
          folder: 'Folder name',
          markets: 'Related markets',
          updated: 'Updated',
        },
        summaryTitle: 'Current product summary',
        summaryDescription: 'The selected product context stays visible while you move between top-level sections.',
        summaryReady: 'Configured',
        summaryNeedsAttention: 'Needs attention',
        formTitle: 'Product details',
        formDescription: 'Edit the core product fields here. Product Profile remains a placeholder until later iterations.',
        form: {
          nameLabel: 'Product name',
          namePlaceholder: 'Signal Desk',
          descriptionLabel: 'Product description',
          descriptionPlaceholder: 'Optional context for operators, release notes, or positioning.',
          folderLabel: 'Product folder name',
          folderPlaceholder: 'signal-desk',
          folderHint: '2-64 chars, starts with a lowercase letter, only lowercase letters, digits, and hyphens.',
          marketsLabel: 'Related markets',
        },
        saveProduct: 'Save product',
      },
      profile: {
        title: 'Product Profile',
        description: 'This area is reserved for future product profile content.',
        currentProductLabel: 'Selected product',
        emptyBody: 'More profile content will be added in a later version. Use the Products page for product name, description, folder name, and related market editing today.',
        backToProducts: 'Back to Products',
        continueBrowsing: 'Continue browsing',
      },
      settings: {
        title: 'Settings',
        description: 'Adjust appearance and workspace preferences without leaving the main shell.',
        tabListLabel: 'Settings sections',
        tabs: {
          appearance: 'Appearance',
          workspace: 'Workspace',
        },
        appearance: {
          title: 'Appearance',
          description: 'Theme changes apply immediately and are stored locally for the next launch.',
          themeLabel: 'Theme',
          themeOptions: {
            dark: {
              label: 'Dark',
              description: 'Use a low-glare workspace for longer maintenance sessions.',
            },
            light: {
              label: 'Light',
              description: 'Use a brighter workspace when ambient light is strong.',
            },
          },
        },
        workspace: {
          title: 'Workspace',
          description: 'Reserve a stable place for startup and workspace-level preferences.',
          startPageLabel: 'Startup page',
          startPageValue: 'Products',
          hint1: 'Store Master opens on Products so operators land on the primary maintenance surface first.',
          hint2: 'Additional workspace preferences can expand here later without changing the shell structure again.',
        },
      },
      validation: {
        productNameRequired: 'Product name is required.',
        productFolderNameRequired: 'Product folder name is required.',
        productFolderNameLength: 'Folder name must be between 2 and 64 characters.',
        productFolderNameStart: 'Folder name must start with a lowercase letter.',
        productFolderNameCharacters: 'Folder name can only contain lowercase letters, digits, and hyphens.',
        productFolderNameTrailingHyphen: 'Folder name cannot end with a hyphen.',
        relatedMarketsRequired: 'Select at least one related market.',
      },
    },
  },
  'zh-CN': {
    common: {
      'app.name': 'Store Master',
      'language.switch': '切换语言',
      'language.english': 'English',
      'language.chinese': '中文',
      'button.save': '保存',
      'button.cancel': '取消',
      'button.continue': '继续浏览',
      shell: {
        workspaceLabel: '本机产品主档',
        title: '产品管理工作区',
        subtitle: '先在本地维护产品主档，再逐步扩展到不同市场的商店资料。',
        searchPlaceholder: '搜索产品、目录名或市场标签',
        activeSectionLabel: '当前页面',
      },
      navigation: {
        products: '产品',
        productProfile: '产品资料',
        settings: '设置',
      },
      sidebar: {
        navigationLabel: '一级导航',
        productCount: '共 {{count}} 个产品',
        collapseLabel: '折叠侧栏',
        expandLabel: '展开侧栏',
        currentProductLabel: '当前产品',
        folderLabel: '目录名',
        folderFallback: '未设置',
        marketsLabel: '关联市场',
        noProduct: '未选择产品',
      },
      products: {
        registryTitle: '产品列表',
        registryDescription: '选择一个产品、创建本地主档草稿，并持续维护产品自身信息。',
        countLabel: '共 {{count}} 个',
        addProduct: '新增产品',
        noProducts: '当前筛选条件下没有匹配的产品。',
        untitledProduct: '未命名产品',
        noMarketsSelected: '未选择市场',
        table: {
          name: '产品名称',
          folder: '目录名',
          markets: '关联市场',
          updated: '更新时间',
        },
        summaryTitle: '当前产品摘要',
        summaryDescription: '切换一级页面时，当前产品上下文会继续保留。',
        summaryReady: '已配置',
        summaryNeedsAttention: '待补充',
        formTitle: '产品信息编辑',
        formDescription: '本阶段所有可编辑的产品字段都集中在这里，产品资料页仅保留占位。',
        form: {
          nameLabel: '产品名称',
          namePlaceholder: 'Signal Desk',
          descriptionLabel: '产品描述',
          descriptionPlaceholder: '可选，用于补充操作说明、发行背景或定位。',
          folderLabel: '产品文件夹名称',
          folderPlaceholder: 'signal-desk',
          folderHint: '长度 2-64 个字符，以小写字母开头，只允许小写字母、数字和连字符。',
          marketsLabel: '关联市场',
        },
        saveProduct: '保存产品',
      },
      profile: {
        title: '产品资料',
        description: '该区域为后续产品资料内容预留。',
        currentProductLabel: '当前产品',
        emptyBody: '后续补充内容会在后续版本加入。当前阶段请回到产品页维护产品名称、描述、目录名和关联市场。',
        backToProducts: '返回产品页',
        continueBrowsing: '继续浏览',
      },
      settings: {
        title: '设置',
        description: '在不离开主壳层的情况下调整外观和工作区偏好。',
        tabListLabel: '设置分区',
        tabs: {
          appearance: '外观',
          workspace: '工作区',
        },
        appearance: {
          title: '外观',
          description: '主题切换会立即生效，并保存为本地偏好供下次启动使用。',
          themeLabel: '主题',
          themeOptions: {
            dark: {
              label: '暗色',
              description: '适合长时间维护任务，降低大面积亮色眩光。',
            },
            light: {
              label: '浅色',
              description: '适合环境光较强的办公场景。',
            },
          },
        },
        workspace: {
          title: '工作区',
          description: '为启动偏好和后续工作区设置保留稳定位置。',
          startPageLabel: '启动页',
          startPageValue: '产品',
          hint1: 'Store Master 默认进入产品页，确保用户先看到产品主档维护入口。',
          hint2: '后续可以继续在这里扩展更多工作区偏好，而不需要再改动壳层结构。',
        },
      },
      validation: {
        productNameRequired: '产品名称不能为空。',
        productFolderNameRequired: '产品文件夹名称不能为空。',
        productFolderNameLength: '目录名长度必须在 2 到 64 个字符之间。',
        productFolderNameStart: '目录名必须以小写字母开头。',
        productFolderNameCharacters: '目录名只能包含小写字母、数字和连字符。',
        productFolderNameTrailingHyphen: '目录名不能以连字符结尾。',
        relatedMarketsRequired: '至少选择一个关联市场。',
      },
    },
  },
};

const supportedLanguages: Array<{ code: string; label: string; shortLabel: string }> = [
  { code: 'en-US', label: 'English', shortLabel: 'EN' },
  { code: 'zh-CN', label: '中文', shortLabel: '中文' },
];

function detectInitialLanguage(): string {
  const storedLanguage = typeof window !== 'undefined' ? window.localStorage.getItem(languageStorageKey) : null;
  const browserLanguage = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  return /^zh/i.test(storedLanguage || browserLanguage) ? 'zh-CN' : 'en-US';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialLanguage(),
  fallbackLng: 'en-US',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export function getLanguageLabel(code: string): string {
  const lang = supportedLanguages.find((language) => language.code === code);
  return lang?.label ?? code;
}

export function getLanguageShortLabel(code: string): string {
  const lang = supportedLanguages.find((language) => language.code === code);
  return lang?.shortLabel ?? code;
}

export function resolveSupportedLanguage(language: string | null | undefined): string {
  if (!language) return 'en-US';
  return supportedLanguages.find((item) => item.code === language)?.code ?? 'en-US';
}

export async function changeAppLanguage(language: string): Promise<void> {
  await i18n.changeLanguage(language);
}

export default i18n;
