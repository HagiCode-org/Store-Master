import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card';
import { cn } from '@/lib/utils';
import type { ThemeMode } from '@/store/slices/themeSlice';
import { AppearanceSettingsTab } from './AppearanceSettingsTab';
import { WorkspaceSettingsTab } from './WorkspaceSettingsTab';

interface SettingsPageProps {
  onThemeChange: (theme: ThemeMode) => void;
  theme: ThemeMode;
}

export function SettingsPage({ onThemeChange, theme }: SettingsPageProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'appearance' | 'workspace'>('appearance');

  return (
    <Card className="min-h-0 overflow-hidden">
      <CardHeader className="border-b border-border/80 pb-3">
        <CardTitle>{t('settings.title')}</CardTitle>
        <CardDescription>{t('settings.description')}</CardDescription>
      </CardHeader>

      <CardContent className="grid min-h-[28rem] p-0 md:grid-cols-[13rem_minmax(0,1fr)]">
        <div aria-label={t('settings.tabListLabel')} className="grid gap-2 border-r border-border bg-[color:var(--surface-panel-muted)] p-3" role="tablist">
          {(['appearance', 'workspace'] as const).map((tab) => {
            const isActive = activeTab === tab;

            return (
              <button
                aria-selected={isActive}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left text-sm font-medium outline-none transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isActive
                    ? 'border-primary/40 bg-background text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:bg-background/70 hover:text-foreground',
                )}
                data-state={isActive ? 'active' : 'inactive'}
                id={`settings-tab-${tab}`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                role="tab"
                type="button"
              >
                {t(`settings.tabs.${tab}`)}
              </button>
            );
          })}
        </div>

        <div aria-labelledby={`settings-tab-${activeTab}`} className="p-5" role="tabpanel">
          {activeTab === 'appearance' ? (
            <AppearanceSettingsTab onThemeChange={onThemeChange} theme={theme} />
          ) : (
            <WorkspaceSettingsTab />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
