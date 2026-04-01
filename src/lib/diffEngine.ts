/**
 * PrivateComparer — Pure client-side diff engine.
 * Implements Myers' diff algorithm for efficient LCS-based diffing.
 * Zero network calls, zero data persistence.
 */

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  lineNumber: number;
  correspondingLine?: number;
  inlineChanges?: InlineChange[];
}

export interface UnifiedLine {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  originalLineNumber?: number;
  modifiedLineNumber?: number;
  inlineChanges?: InlineChange[];
}

export interface DiffResult {
  original: DiffLine[];
  modified: DiffLine[];
  unified: UnifiedLine[];
  additions: number;
  removals: number;
  unchanged: number;
  originalLineCount: number;
  modifiedLineCount: number;
}

export interface DiffChange {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

export type DiffPrecision = 'line' | 'word' | 'character';

export interface DiffCompareOptions {
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
  trimWhitespace?: boolean;
}

function eq(a: string, b: string, options?: DiffCompareOptions): boolean {
  if (!options) return a === b;
  let sa = a;
  let sb = b;
  if (options.ignoreCase) {
    sa = sa.toLowerCase();
    sb = sb.toLowerCase();
  }
  if (options.ignoreWhitespace) {
    sa = sa.replace(/\s+/g, '');
    sb = sb.replace(/\s+/g, '');
  } else if (options.trimWhitespace) {
    sa = sa.trim();
    sb = sb.trim();
  }
  return sa === sb;
}

// ─── Myers Diff Algorithm (O(ND) time) ───────────────────────────────────────

function myersDiff(a: string[], b: string[], options?: DiffCompareOptions): DiffChange[] {
  const N = a.length;
  const M = b.length;
  const MAX = N + M;
  const V: Record<number, number> = { 1: 0 };
  const trace: Record<number, number>[] = [];

  for (let d = 0; d <= MAX; d++) {
    const newV: Record<number, number> = { ...V };
    trace.push({ ...V });

    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && (V[k - 1] ?? -1) < (V[k + 1] ?? -1))) {
        x = V[k + 1] ?? 0;
      } else {
        x = (V[k - 1] ?? 0) + 1;
      }

      let y = x - k;

      while (x < N && y < M && eq(a[x], b[y], options)) {
        x++;
        y++;
      }

      newV[k] = x;
      V[k] = x;

      if (x >= N && y >= M) {
        return backtrack(trace, a, b, d);
      }
    }
  }

  return [];
}

function backtrack(trace: Record<number, number>[], a: string[], b: string[], d: number): DiffChange[] {
  const changes: DiffChange[] = [];
  let x = a.length;
  let y = b.length;

  for (let step = d; step > 0; step--) {
    const V = trace[step - 1];
    const k = x - y;

    let prevK: number;
    if (k === -step || (k !== step && (V[k - 1] ?? -1) < (V[k + 1] ?? -1))) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = V[prevK] ?? 0;
    const prevY = prevX - prevK;

    // Diagonal (unchanged)
    while (x > prevX && y > prevY) {
      x--;
      y--;
      changes.unshift({ type: 'unchanged', value: a[x] });
    }

    if (x > prevX) {
      x--;
      changes.unshift({ type: 'removed', value: a[x] });
    } else if (y > prevY) {
      y--;
      changes.unshift({ type: 'added', value: b[y] });
    }
  }

  // Remaining diagonals
  while (x > 0 && y > 0) {
    x--;
    y--;
    changes.unshift({ type: 'unchanged', value: a[x] });
  }

  return changes;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function computeDiff(
  originalText: string,
  modifiedText: string,
  precision: DiffPrecision = 'line',
  options?: DiffCompareOptions
): DiffResult {
  if (precision === 'line') {
    return computeLineDiff(originalText, modifiedText, options);
  }

  const origLines = originalText.split('\n');
  const modLines = modifiedText.split('\n');

  const original: DiffLine[] = [];
  const modified: DiffLine[] = [];
  const unified: UnifiedLine[] = [];
  let additions = 0;
  let removals = 0;
  let unchanged = 0;

  // First do a line-level pass, then refine changed lines with word/char diff
  const lineDiff = myersDiff(origLines, modLines, options);

  let origIdx = 0;
  let modIdx = 0;

  for (const change of lineDiff) {
    if (change.type === 'unchanged') {
      origIdx++;
      modIdx++;
      original.push({ type: 'unchanged', value: change.value, lineNumber: origIdx, correspondingLine: modIdx });
      modified.push({ type: 'unchanged', value: change.value, lineNumber: modIdx, correspondingLine: origIdx });
      unified.push({ type: 'unchanged', value: change.value, originalLineNumber: origIdx, modifiedLineNumber: modIdx });
      unchanged++;
    } else if (change.type === 'removed') {
      origIdx++;
      original.push({ type: 'removed', value: change.value, lineNumber: origIdx });
      unified.push({ type: 'removed', value: change.value, originalLineNumber: origIdx });
      removals++;
    } else {
      modIdx++;
      modified.push({ type: 'added', value: change.value, lineNumber: modIdx });
      unified.push({ type: 'added', value: change.value, modifiedLineNumber: modIdx });
      additions++;
    }
  }

  refineInlineChanges(unified, original, modified, precision, options);

  return {
    original,
    modified,
    unified,
    additions,
    removals,
    unchanged,
    originalLineCount: origLines.length,
    modifiedLineCount: modLines.length,
  };
}

function computeLineDiff(originalText: string, modifiedText: string, options?: DiffCompareOptions): DiffResult {
  const origLines = originalText.split('\n');
  const modLines = modifiedText.split('\n');

  const changes = myersDiff(origLines, modLines, options);

  const original: DiffLine[] = [];
  const modified: DiffLine[] = [];
  const unified: UnifiedLine[] = [];
  let additions = 0;
  let removals = 0;
  let unchanged = 0;
  let origIdx = 0;
  let modIdx = 0;

  for (const change of changes) {
    if (change.type === 'unchanged') {
      origIdx++;
      modIdx++;
      original.push({ type: 'unchanged', value: change.value, lineNumber: origIdx, correspondingLine: modIdx });
      modified.push({ type: 'unchanged', value: change.value, lineNumber: modIdx, correspondingLine: origIdx });
      unified.push({ type: 'unchanged', value: change.value, originalLineNumber: origIdx, modifiedLineNumber: modIdx });
      unchanged++;
    } else if (change.type === 'removed') {
      origIdx++;
      original.push({ type: 'removed', value: change.value, lineNumber: origIdx });
      unified.push({ type: 'removed', value: change.value, originalLineNumber: origIdx });
      removals++;
    } else {
      modIdx++;
      modified.push({ type: 'added', value: change.value, lineNumber: modIdx });
      unified.push({ type: 'added', value: change.value, modifiedLineNumber: modIdx });
      additions++;
    }
  }

  refineInlineChanges(unified, original, modified, 'word', options);

  return {
    original,
    modified,
    unified,
    additions,
    removals,
    unchanged,
    originalLineCount: origLines.length,
    modifiedLineCount: modLines.length,
  };
}

// ─── Word-level diff within a single line pair ──────────────────────────────

export interface InlineChange {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

export function computeWordDiff(original: string, modified: string, options?: DiffCompareOptions): InlineChange[] {
  // Use a regex that splits by words and punctuations to keep delimiters
  const origTokens = original.split(/\b/);
  const modTokens = modified.split(/\b/);
  return myersDiff(origTokens, modTokens, options);
}

export function computeCharDiff(original: string, modified: string, options?: DiffCompareOptions): InlineChange[] {
  const origChars = original.split('');
  const modChars = modified.split('');
  return myersDiff(origChars, modChars, options);
}

function refineInlineChanges(unified: UnifiedLine[], original: DiffLine[], modified: DiffLine[], precision: DiffPrecision, options?: DiffCompareOptions) {
  let uIdx = 0;
  while (uIdx < unified.length) {
    if (unified[uIdx].type === 'removed') {
      const removedBlock: UnifiedLine[] = [];
      const origRef: DiffLine[] = [];
      while (uIdx < unified.length && unified[uIdx].type === 'removed') {
        removedBlock.push(unified[uIdx]);
        // Also find in original
        origRef.push(original[unified[uIdx].originalLineNumber! - 1]);
        uIdx++;
      }
      const addedBlock: UnifiedLine[] = [];
      const modRef: DiffLine[] = [];
      while (uIdx < unified.length && unified[uIdx].type === 'added') {
        addedBlock.push(unified[uIdx]);
        modRef.push(modified[unified[uIdx].modifiedLineNumber! - 1]);
        uIdx++;
      }
      
      const matchCount = Math.min(removedBlock.length, addedBlock.length);
      for (let i = 0; i < matchCount; i++) {
        const rLine = removedBlock[i];
        const aLine = addedBlock[i];
        const diffs = precision === 'character' 
          ? computeCharDiff(rLine.value, aLine.value, options)
          : computeWordDiff(rLine.value, aLine.value, options);
        
        rLine.inlineChanges = diffs.filter(d => d.type !== 'added');
        aLine.inlineChanges = diffs.filter(d => d.type !== 'removed');
        
        origRef[i].inlineChanges = rLine.inlineChanges;
        modRef[i].inlineChanges = aLine.inlineChanges;
      }
    } else {
      uIdx++;
    }
  }
}

// ─── Text Transformation Utilities ──────────────────────────────────────────

export function transformText(text: string, options: {
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
  trimWhitespace?: boolean;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
  sortLines?: boolean;
  removeBlankLines?: boolean;
}): string {
  let result = text;

  if (options.ignoreCase || options.toLowerCase) {
    result = result.toLowerCase();
  }
  if (options.toUpperCase) {
    result = result.toUpperCase();
  }
  if (options.trimWhitespace) {
    result = result.split('\n').map(line => line.trim()).join('\n');
  }
  if (options.ignoreWhitespace) {
    result = result.split('\n').map(line => line.replace(/\s+/g, ' ').trim()).join('\n');
  }
  if (options.removeBlankLines) {
    result = result.split('\n').filter(line => line.trim().length > 0).join('\n');
  }
  if (options.sortLines) {
    result = result.split('\n').sort().join('\n');
  }

  return result;
}

// ─── Diff Statistics ────────────────────────────────────────────────────────

export interface DiffStats {
  totalChanges: number;
  addedLines: number;
  removedLines: number;
  unchangedLines: number;
  similarity: number; // 0-100 percentage
}

export function computeStats(result: DiffResult): DiffStats {
  const totalLines = result.originalLineCount + result.modifiedLineCount;
  const similarity = totalLines > 0
    ? Math.round((result.unchanged * 2 / totalLines) * 100)
    : 100;

  return {
    totalChanges: result.additions + result.removals,
    addedLines: result.additions,
    removedLines: result.removals,
    unchangedLines: result.unchanged,
    similarity: Math.min(similarity, 100),
  };
}

// ─── Export Utilities ───────────────────────────────────────────────────────

export function exportDiffAsHTML(result: DiffResult, title: string = 'Untitled diff'): string {
  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const renderLines = (lines: DiffLine[]) => lines.map(line => {
    const cls = line.type === 'added' ? 'added' : line.type === 'removed' ? 'removed' : 'unchanged';
    const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';
    return `<tr class="${cls}"><td class="ln">${line.lineNumber}</td><td class="prefix">${prefix}</td><td class="code">${escapeHtml(line.value)}</td></tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)} — PrivateComparer Export</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; }
  h1 { color: #58a6ff; margin-bottom: 0.5rem; font-size: 1.5rem; }
  .meta { color: #8b949e; font-size: 0.85rem; margin-bottom: 1.5rem; }
  .stats { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; }
  .stat { padding: 0.75rem 1rem; border-radius: 8px; background: #161b22; border: 1px solid #30363d; }
  .stat .label { font-size: 0.75rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat .value { font-size: 1.25rem; font-weight: 700; }
  .stat .value.add { color: #3fb950; }
  .stat .value.rem { color: #f85149; }
  .panels { display: flex; gap: 2px; }
  .panel { flex: 1; }
  .panel-header { font-size: 0.75rem; font-weight: 600; padding: 0.5rem 1rem; background: #21262d; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; }
  table { width: 100%; border-collapse: collapse; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; }
  tr.added { background: rgba(46, 160, 67, 0.15); }
  tr.removed { background: rgba(248, 81, 73, 0.15); }
  td { padding: 2px 8px; white-space: pre-wrap; word-break: break-all; vertical-align: top; }
  td.ln { color: #484f58; width: 50px; text-align: right; user-select: none; border-right: 1px solid #21262d; }
  td.prefix { width: 20px; text-align: center; color: #484f58; font-weight: 600; }
  tr.added td.prefix { color: #3fb950; }
  tr.removed td.prefix { color: #f85149; }
  .footer { text-align: center; margin-top: 2rem; font-size: 0.75rem; color: #484f58; }
  .footer strong { color: #3fb950; }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">Generated by PrivateComparer — Pure Client-Side, Zero Data Persistence</p>
  <div class="stats">
    <div class="stat"><div class="label">Removals</div><div class="value rem">${result.removals}</div></div>
    <div class="stat"><div class="label">Additions</div><div class="value add">${result.additions}</div></div>
    <div class="stat"><div class="label">Unchanged</div><div class="value">${result.unchanged}</div></div>
  </div>
  <div class="panels">
    <div class="panel">
      <div class="panel-header">Original (${result.originalLineCount} lines)</div>
      <table>${renderLines(result.original)}</table>
    </div>
    <div class="panel">
      <div class="panel-header">Modified (${result.modifiedLineCount} lines)</div>
      <table>${renderLines(result.modified)}</table>
    </div>
  </div>
  <p class="footer">Exported on ${new Date().toLocaleString()} by <strong>PrivateComparer</strong> — No data was transmitted.</p>
</body>
</html>`;
}
