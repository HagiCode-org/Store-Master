import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  'en-US': {
    common: {
      'app.name': 'Store Master',
      'language.switch': 'Switch Language',
      'language.english': 'English',
      'language.chinese': '中文',
      'button.save': 'Save',
      'button.cancel': 'Cancel',
      'button.close': 'Close',
      'button.confirm': 'Confirm',
      'button.delete': 'Delete',
      'button.edit': 'Edit',
      'button.add': 'Add',
      'button.remove': 'Remove',
      'button.refresh': 'Refresh',
      'button.submit': 'Submit',
      'button.loading': 'Loading...',
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.ok': 'OK',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.warning': 'Warning',
      'common.info': 'Info',
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
      'button.close': '关闭',
      'button.confirm': '确认',
      'button.delete': '删除',
      'button.edit': '编辑',
      'button.add': '添加',
      'button.remove': '移除',
      'button.refresh': '刷新',
      'button.submit': '提交',
      'button.loading': '加载中...',
      'common.yes': '是',
      'common.no': '否',
      'common.ok': '确定',
      'common.error': '错误',
      'common.success': '成功',
      'common.warning': '警告',
      'common.info': '信息',
    },
  },
};

const supportedLanguages: Array<{ code: string; label: string; shortLabel: string }> = [
  { code: 'en-US', label: 'English', shortLabel: 'EN' },
  { code: 'zh-CN', label: '中文', shortLabel: '中文' },
];

function detectInitialLanguage(): string {
  const browserLanguage = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  return browserLanguage.startsWith('zh') ? 'zh-CN' : 'en-US';
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
  const lang = supportedLanguages.find((l) => l.code === code);
  return lang?.label ?? code;
}

export function getLanguageShortLabel(code: string): string {
  const lang = supportedLanguages.find((l) => l.code === code);
  return lang?.shortLabel ?? code;
}

export function resolveSupportedLanguage(language: string | null | undefined): string {
  if (!language) return 'en-US';
  return supportedLanguages.find((l) => l.code === language)?.code ?? 'en-US';
}

export async function changeAppLanguage(language: string): Promise<void> {
  await i18n.changeLanguage(language);
}

export default i18n;