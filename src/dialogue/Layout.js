// Lays dialogue text out into pages of lines with natural-looking breaks. Runs once when a
// conversation opens (never per frame), so a little dynamic programming is affordable.
//
// Within a page: the fewest lines possible, then the most natural breaks. Lines prefer to end
// after a sentence or clause, avoid ending on small words like "the", and the last line is
// never a single orphaned word if a word can move down to join it.
// Across pages: pages prefer to end at a sentence, then a clause, rather than mid-sentence.
// '|' in the text forces a page break.

const SENTENCE_END = /[.!?]["')\]]*$/;
const CLAUSE_END = /[,;:]["')\]]*$/;
const WEAK_WORDS = new Set([
  'a', 'an', 'the', 'i', 'to', 'of', 'and', 'or', 'but', 'my', 'your', 'in', 'on', 'at', 'for',
  'with', 'from', 'by', 'is', 'it',
]);

const PAGE_COST = 10;   // each extra page; a mid-sentence page break costs more than one page
const ORPHAN_COST = 14; // a lone word on the last line

// How awkward it is to break a line or page right after `word` (0 = perfect).
function breakCost(word) {
  if (SENTENCE_END.test(word)) return 0;
  if (CLAUSE_END.test(word)) return 2;
  if (WEAK_WORDS.has(word.toLowerCase())) return 8;
  return 4;
}

// Best wrapping of words[from..to) into the fewest lines no wider than `width`.
// Returns the lines as strings.
export function layoutLines(font, words, width, from = 0, to = words.length) {
  const n = to - from;
  if (n <= 0) return [''];
  const lines = new Array(n + 1).fill(Infinity);
  const cost = new Array(n + 1).fill(Infinity);
  const prev = new Array(n + 1).fill(-1);
  lines[0] = 0;
  cost[0] = 0;
  for (let j = 1; j <= n; j++) {
    let text = '';
    for (let i = j - 1; i >= 0; i--) {
      text = text ? `${words[from + i]} ${text}` : words[from + i];
      const w = font.measure(text);
      if (w > width && i < j - 1) break; // a single over-long word still gets its own line
      if (lines[i] === Infinity) continue;
      const last = j === n;
      let c;
      if (last) {
        c = j - i === 1 && i > 0 ? ORPHAN_COST : 0;
      } else {
        const slack = Math.max(0, width - w) / width;
        c = breakCost(words[from + j - 1]) + slack * slack * 6;
      }
      const l = lines[i] + 1, total = cost[i] + c;
      if (l < lines[j] || (l === lines[j] && total < cost[j])) {
        lines[j] = l;
        cost[j] = total;
        prev[j] = i;
      }
    }
  }
  const out = [];
  for (let j = n; j > 0; j = prev[j]) {
    out.push(words.slice(from + prev[j], from + j).join(' '));
  }
  return out.reverse();
}

// Splits text into pages (arrays of at most `linesPerPage` lines).
export function layoutPages(font, text, width, linesPerPage) {
  const pages = [];
  for (const part of text.split('|')) {
    const words = part.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    const n = words.length;
    // best[j]: cheapest way to lay out words[0..j) as whole pages.
    const best = new Array(n + 1).fill(Infinity);
    const prev = new Array(n + 1).fill(-1);
    const pageLines = new Array(n + 1).fill(null);
    best[0] = 0;
    for (let j = 1; j <= n; j++) {
      for (let i = j - 1; i >= 0; i--) {
        if (best[i] === Infinity) continue;
        const lines = layoutLines(font, words, width, i, j);
        if (lines.length > linesPerPage) break; // a longer page only gets longer
        const end = j === n ? 0 : breakCost(words[j - 1]) * 3;
        const c = best[i] + PAGE_COST + end + (linesPerPage - lines.length);
        if (c < best[j]) {
          best[j] = c;
          prev[j] = i;
          pageLines[j] = lines;
        }
      }
    }
    const partPages = [];
    for (let j = n; j > 0; j = prev[j]) partPages.push(pageLines[j]);
    pages.push(...partPages.reverse());
  }
  return pages.length ? pages : [['']];
}
