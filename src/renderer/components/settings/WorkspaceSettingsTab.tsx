import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/badge';

export function WorkspaceSettingsTab() {
  const { t } = useTranslation();

  return (
    <section className="grid gap-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{t('settings.workspace.title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('settings.workspace.description')}</p>
      </div>

      <div className="grid gap-4 rounded-xl border border-border bg-background p-4 md:grid-cols-[minmax(0,12rem)_1fr] md:items-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t('settings.workspace.startPageLabel')}
          </p>
          <div className="mt-2">
            <Badge>{t('settings.workspace.startPageValue')}</Badge>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          <p>{t('settings.workspace.hint1')}</p>
          <p>{t('settings.workspace.hint2')}</p>
        </div>
      </div>
    </section>
  );
}
