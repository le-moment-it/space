import { useEffect } from 'react';
import { LANGUAGES, LANGUAGE_LABELS, useTranslation } from '../../i18n';
import { useGameStore } from '../../state/gameStore';
import './SettingsPanel.css';

/** A small modal from the top bar. Currently: language. Room to grow (audio, etc.). */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { t, lang } = useTranslation();
  const setLanguage = useGameStore((s) => s.setLanguage);

  // Close on Escape, like the browser-native dialog affordance players expect.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t('settings.title')}
      onClick={onClose}
    >
      <div className="settings" onClick={(e) => e.stopPropagation()}>
        <header className="settings__head">
          <p className="eyebrow">{t('settings.title')}</p>
          <button className="settings__close" onClick={onClose} aria-label={t('settings.close')}>
            ✕
          </button>
        </header>

        <div className="settings__row">
          <div className="settings__label">
            <span className="settings__label-name">{t('settings.language')}</span>
            <span className="settings__label-hint">{t('settings.languageHint')}</span>
          </div>
          <div className="settings__segment" role="group" aria-label={t('settings.language')}>
            {LANGUAGES.map((code) => (
              <button
                key={code}
                className={`settings__opt${code === lang ? ' settings__opt--active' : ''}`}
                aria-pressed={code === lang}
                onClick={() => setLanguage(code)}
              >
                {LANGUAGE_LABELS[code]}
              </button>
            ))}
          </div>
        </div>

        <div className="settings__actions">
          <button className="btn-primary" onClick={onClose}>
            {t('settings.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
