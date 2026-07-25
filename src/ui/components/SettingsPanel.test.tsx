import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptySave } from '../../engine/save/schema';
import { makeSave } from '../../engine/save/serialize';
import { SAVE_DEFAULTS, useGameStore } from '../../state/gameStore';
import { SettingsPanel } from './SettingsPanel';

// jsdom has no object-URL support and will not navigate on an anchor click, so the
// download itself is stubbed. What matters here is the payload the panel hands over;
// building the blob from it is the helper's job, not this component's.
const downloads: { filename: string; data: unknown }[] = [];

vi.mock('../files', async (importActual) => ({
  ...(await importActual<typeof import('../files')>()),
  downloadJson: (filename: string, data: unknown) => downloads.push({ filename, data }),
}));

beforeEach(() => {
  localStorage.clear();
  downloads.length = 0;
  useGameStore.setState({
    meta: createEmptySave(SAVE_DEFAULTS).meta,
    run: null,
    appPhase: 'hub',
    pendingEndingIds: [],
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const open = () => render(<SettingsPanel onClose={() => {}} />);
const jsonFile = (contents: string) =>
  new File([contents], 'save.json', { type: 'application/json' });

const pickFile = async (file: File) => {
  const input = screen.getByLabelText('Import') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
};

describe('SettingsPanel — export', () => {
  it('downloads the whole current save under a dated filename', () => {
    useGameStore.getState().startNewRun();
    useGameStore.setState((s) => ({
      meta: { ...s.meta, stats: { ...s.meta.stats, runsWon: 3 } },
    }));
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toMatch(/^space-save-\d{4}-\d{2}-\d{2}\.json$/);
    const written = downloads[0].data as ReturnType<typeof makeSave>;
    expect(written.version).toBe(6);
    expect(written.meta.stats.runsWon).toBe(3);
    // The in-progress run travels with it, so an import can resume mid-run.
    expect(written.currentRun).toEqual(useGameStore.getState().run);
    expect(screen.getByRole('status')).toHaveTextContent('Save exported.');
  });

  it('round-trips: what export writes, import accepts', async () => {
    useGameStore.getState().startNewRun();
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    const exported = JSON.stringify(downloads[0].data);
    useGameStore.getState().resetSave();

    await pickFile(jsonFile(exported));
    fireEvent.click(await screen.findByRole('button', { name: 'Replace progress' }));

    expect(useGameStore.getState().meta.stats.runsStarted).toBe(1);
    expect(useGameStore.getState().appPhase).toBe('run');
  });
});

describe('SettingsPanel — reset', () => {
  it('does nothing until the confirmation is accepted', () => {
    useGameStore.getState().startNewRun();
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    // Confirm shown, nothing wiped yet.
    expect(screen.getByText(/erase all progress\?/i)).toBeInTheDocument();
    expect(useGameStore.getState().run).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Erase everything' }));

    expect(useGameStore.getState().run).toBeNull();
    expect(useGameStore.getState().meta.stats.runsStarted).toBe(0);
    expect(screen.getByRole('status')).toHaveTextContent('Progress erased.');
  });

  it('leaves progress intact when the confirmation is cancelled', () => {
    useGameStore.getState().startNewRun();
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText(/erase all progress\?/i)).not.toBeInTheDocument();
    expect(useGameStore.getState().run).not.toBeNull();
  });
});

describe('SettingsPanel — import', () => {
  it('rejects a file that is not a save, leaving progress untouched', async () => {
    useGameStore.getState().startNewRun();
    const before = useGameStore.getState().meta;
    open();

    await pickFile(jsonFile('{"hello":"world"}'));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/isn’t a save/i));
    expect(useGameStore.getState().meta).toBe(before);
    expect(useGameStore.getState().run).not.toBeNull();
  });

  it('applies a valid save only after the overwrite is confirmed', async () => {
    const imported = createEmptySave(SAVE_DEFAULTS);
    imported.meta.stats.runsWon = 12;
    open();

    await pickFile(jsonFile(JSON.stringify(imported)));

    await waitFor(() => expect(screen.getByText(/replace your progress/i)).toBeInTheDocument());
    expect(useGameStore.getState().meta.stats.runsWon).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Replace progress' }));

    expect(useGameStore.getState().meta.stats.runsWon).toBe(12);
    expect(screen.getByRole('status')).toHaveTextContent('Progress imported.');
  });

  it('summarises the file so the player knows what they are about to overwrite', async () => {
    const imported = createEmptySave(SAVE_DEFAULTS);
    imported.meta.stats.runsWon = 5;
    open();

    await pickFile(jsonFile(JSON.stringify(imported)));

    await waitFor(() =>
      expect(
        screen.getByText(
          `5 runs won · ${imported.meta.unlockedCardIds.length} cards unlocked · no run in progress`,
        ),
      ).toBeInTheDocument(),
    );
  });

  it('imports the meta but drops a damaged run rather than crashing on it', async () => {
    const imported = makeSave(createEmptySave(SAVE_DEFAULTS).meta, {
      phase: 'map',
    } as never);
    imported.meta.stats.runsWon = 2;
    open();

    await pickFile(jsonFile(JSON.stringify(imported)));

    fireEvent.click(await screen.findByRole('button', { name: 'Replace progress' }));

    expect(useGameStore.getState().meta.stats.runsWon).toBe(2);
    expect(useGameStore.getState().run).toBeNull();
    expect(useGameStore.getState().appPhase).toBe('hub');
    expect(screen.getByRole('status')).toHaveTextContent(/was damaged/i);
  });
});
