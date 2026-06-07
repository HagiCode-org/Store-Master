import { MoonStar, SunMedium } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ThemeMode } from '@/store/slices/themeSlice';

interface AppearanceSettingsTabProps {
  onThemeChange: (theme: ThemeMode) => void;
  theme: ThemeMode;
}

const themeOptions: Array<{ icon: typeof MoonStar; value: ThemeMode }> = [
  { value: 'dark', icon: MoonStar },
  { value: 'light', icon: SunMedium },
];

export function AppearanceSettingsTab({ onThemeChange, theme }: AppearanceSettingsTabProps) {
  const { t } = useTranslation();

  return (
    <section className="grid gap-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{t('settings.appearance.title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('settings.appearance.description')}</p>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium text-foreground">{t('settings.appearance.themeLabel')}</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {themeOptions.map((option) => {
            const isActive = option.value === theme;

            return (
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-4 transition-colors',
                  isActive ? 'border-primary/40 bg-primary/12 text-foreground' : 'border-border bg-background text-muted-foreground',
                )}
                key={option.value}
              >
                <input
                  checked={isActive}
                  name="theme"
                  onChange={() => onThemeChange(option.value)}
                  type="radio"
                  value={option.value}
                />
                <div className="grid gap-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <option.icon className="size-4" />
                    {t(`settings.appearance.themeOptions.${option.value}.label`)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t(`settings.appearance.themeOptions.${option.value}.description`)}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
