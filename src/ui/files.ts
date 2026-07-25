/**
 * Reading and writing files in the browser, kept in one place because these are the
 * only DOM escape hatches in the UI — everything else renders through React.
 */

/**
 * Reads a picked file as text.
 *
 * `Blob.text()` would be shorter, but it is missing from the jsdom build the tests
 * run on, so FileReader is the portable choice rather than a compatibility hedge.
 */
export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsText(file);
  });
}
export function downloadJson(filename: string, data: unknown): void {
  // Pretty-printed: the point of an export is a file a player can open and read.
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  // Firefox only honours a click on an anchor that is in the document.
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** `space-save-2026-07-25.json` — local date, so the name matches the player's day. */
export function saveFilename(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `space-save-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}
