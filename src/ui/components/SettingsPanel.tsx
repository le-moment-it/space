import { useEffect, useRef, useState } from 'react';
import { dropUnusableRun, makeSave, parseSave } from '../../engine/save/serialize';
import type { SaveDataV6 } from '../../engine/save/types';
import { LANGUAGES, LANGUAGE_LABELS, useTranslation, type UiKey } from '../../i18n';
import { SAVE_DEFAULTS, useGameStore } from '../../state/gameStore';
import { downloadJson, readTextFile, saveFilename } from '../files';
import './SettingsPanel.css';

type Status = { key: UiKey; error?: boolean };

/** A file the player picked, parsed and waiting for them to confirm the overwrite. */
type PendingImport = { save: SaveDataV6; runDropped: boolean };

/** A small modal from the top bar: language, and the save data itself. */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { t, lang } = useTranslation();
  const setLanguage = useGameStore((s) => s.setLanguage);
  const resetSave = useGameStore((s) => s.resetSave);
  const importSave = useGameStore((s) => s.importSave);

  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);

  // Close on Escape, like the browser-native dialog affordance players expect.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /** Only one destructive action can be pending at a time — two open confirms is a trap. */
  function beginReset() {
    setPendingImport(null);
    setStatus(null);
    setConfirmReset(true);
  }

  function handleExport() {
    // Read at click time rather than through a selector: subscribing to `run` would
    // re-render the panel on every card played.
    const { meta, run } = useGameStore.getState();
    downloadJson(saveFilename(), makeSave(meta, run));
    setStatus({ key: 'settings.exportDone' });
  }

  async function handleFile(file: File) {
    // A file the OS hands over but cannot be read (removed mid-pick, permissions)
    // is the same story to the player as a file that isn't a save.
    const text = await readTextFile(file).catch(() => null);
    const parsed = text === null ? null : parseSave(text, SAVE_DEFAULTS);
    if (!parsed) {
      setStatus({ key: 'settings.importFailed', error: true });
      return;
    }
    const save = dropUnusableRun(parsed);
    setConfirmReset(false);
    setStatus(null);
    setPendingImport({ save, runDropped: parsed.currentRun !== null && save.currentRun === null });
  }

  function applyImport() {
    if (!pendingImport) return;
    importSave(pendingImport.save);
    setPendingImport(null);
    setStatus({
      key: pendingImport.runDropped ? 'settings.importRunDropped' : 'settings.importDone',
      error: pendingImport.runDropped,
    });
  }

  function applyReset() {
    resetSave();
    setConfirmReset(false);
    setStatus({ key: 'settings.resetDone' });
  }

  const summary = pendingImport
    ? t('settings.importSummary', {
        wins: pendingImport.save.meta.stats.runsWon,
        cards: pendingImport.save.meta.unlockedCardIds.length,
        run: t(pendingImport.save.currentRun ? 'settings.importRunYes' : 'settings.importRunNo'),
      })
    : '';

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

        <section className="settings__group" aria-label={t('settings.saveData')}>
          <div className="settings__group-head">
            <p className="eyebrow">{t('settings.saveData')}</p>
            <p className="settings__label-hint">{t('settings.saveDataHint')}</p>
          </div>

          {/* One sentence per row, with the button carrying the verb — a row that read
              "Export … [EXPORT]" said the same word twice. */}
          <div className="settings__row">
            <p className="settings__action-text">{t('settings.exportHint')}</p>
            <button className="settings__btn" onClick={handleExport}>
              {t('settings.export')}
            </button>
          </div>

          <div className="settings__row">
            <p className="settings__action-text">{t('settings.importHint')}</p>
            <button className="settings__btn" onClick={() => fileInput.current?.click()}>
              {t('settings.import')}
            </button>
            <input
              ref={fileInput}
              className="settings__file"
              type="file"
              accept="application/json,.json"
              aria-label={t('settings.import')}
              onChange={(e) => {
                const file = e.target.files?.[0];
                // Clear the value so picking the same file twice fires onChange again.
                e.target.value = '';
                if (file) void handleFile(file);
              }}
            />
          </div>

          {pendingImport && (
            <div className="settings__confirm">
              <span className="settings__confirm-label">{t('settings.importConfirm')}</span>
              <span className="settings__confirm-detail mono">{summary}</span>
              <span className="settings__confirm-actions">
                <button className="settings__btn settings__btn--danger" onClick={applyImport}>
                  {t('settings.importApply')}
                </button>
                <button className="settings__btn" onClick={() => setPendingImport(null)}>
                  {t('settings.cancel')}
                </button>
              </span>
            </div>
          )}

          <div className="settings__row">
            <p className="settings__action-text">{t('settings.resetHint')}</p>
            <button className="settings__btn settings__btn--danger" onClick={beginReset}>
              {t('settings.reset')}
            </button>
          </div>

          {confirmReset && (
            <div className="settings__confirm">
              <span className="settings__confirm-label">{t('settings.resetConfirm')}</span>
              <span className="settings__confirm-actions">
                <button className="settings__btn settings__btn--danger" onClick={applyReset}>
                  {t('settings.resetApply')}
                </button>
                <button className="settings__btn" onClick={() => setConfirmReset(false)}>
                  {t('settings.cancel')}
                </button>
              </span>
            </div>
          )}

          {status && (
            <p
              className={`settings__status${status.error ? ' settings__status--error' : ''}`}
              role="status"
            >
              {t(status.key)}
            </p>
          )}
        </section>

        <div className="settings__actions">
          <button className="btn-primary" onClick={onClose}>
            {t('settings.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
