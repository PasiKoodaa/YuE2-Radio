export const MIN_LYRIC_UNITS = 120;

const REQUIRED_SECTIONS = [
  "verse 1",
  "pre-chorus",
  "chorus",
  "verse 2",
  "chorus",
  "bridge",
  "final chorus"
];

export function splitSong(raw) {
  const clean = String(raw || "")
    .replace(/^```(?:text|markdown)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const lines = clean.split("\n");
  const titleLine = lines.findIndex((line) => /^\s*TITLE\s*:/i.test(line));
  let title = "Untitled transmission";
  if (titleLine >= 0) {
    title = lines[titleLine].replace(/^\s*TITLE\s*:/i, "").trim() || title;
    lines.splice(titleLine, 1);
  }
  return {
    title: title.replace(/^['\"]|['\"]$/g, ""),
    lyrics: lines.join("\n").trim(),
    hasTitle: titleLine >= 0 && title !== "Untitled transmission"
  };
}

export function countLyricUnits(lyrics) {
  const body = String(lyrics || "").replace(/^\s*\[[^\]]+\]\s*$/gm, " ");
  const cjk = body.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)?.length || 0;
  const nonCjk = body
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, " ")
    .match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length || 0;
  return nonCjk + Math.ceil(cjk / 2);
}

export function validateSong(song) {
  const errors = [];
  if (!song?.hasTitle || !song.title?.trim()) errors.push('the first line must use "TITLE: ..."');

  const headers = [...String(song?.lyrics || "").matchAll(/^\s*\[([^\]\r\n]+)\]\s*$/gm)]
    .map((match) => match[1].trim().toLowerCase().replace(/\s+/g, " "));
  let cursor = 0;
  for (const required of REQUIRED_SECTIONS) {
    const found = headers.indexOf(required, cursor);
    if (found < 0) {
      errors.push(`missing or out-of-order [${required.replace(/(^|-|\s)\w/g, (part) => part.toUpperCase())}] section`);
      break;
    }
    cursor = found + 1;
  }

  const units = countLyricUnits(song?.lyrics);
  if (units < MIN_LYRIC_UNITS) errors.push(`lyrics are too short (${units}/${MIN_LYRIC_UNITS} minimum lyric units)`);

  // Only scan text that comes *before* the first section header for
  // leftover assistant preamble. Scanning the whole lyric body caused
  // ordinary lines (e.g. "I hope for sunrise") to be misflagged, since
  // "i hope" and "here is/are" are common, legitimate lyric phrases.
  const firstHeaderIndex = String(song?.lyrics || "").search(/^\s*\[[^\]\r\n]+\]\s*$/m);
  const preamble = firstHeaderIndex >= 0 ? song.lyrics.slice(0, firstHeaderIndex) : song?.lyrics || "";
  if (/\b(here(?:'s| is| are) (?:the|your|a) (?:song|lyrics|track)|as requested|i hope this helps|hope (?:this|that) helps|let me know if)\b/i.test(preamble)) {
    errors.push("contains assistant commentary");
  }

  return { valid: errors.length === 0, errors, units, headers };
}
