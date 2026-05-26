/**
 * Add aria-label on form controls for react-doctor (requires explicit labels).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";

const ROOT = path.join(__dirname, "..", "src");
let fixes = 0;

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const e of readdirSync(dir)) {
    const f = path.join(dir, e);
    if (statSync(f).isDirectory()) files.push(...walk(f));
    else if (f.endsWith(".tsx")) files.push(f);
  }
  return files;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractLabelMap(content: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /<label[^>]*htmlFor="([^"]+)"[^>]*>([\s\S]*?)<\/label>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const text = stripTags(m[2]);
    if (text) map.set(m[1], text);
  }
  return map;
}

function processFile(file: string) {
  let content = readFileSync(file, "utf8");
  const before = content;
  const labelMap = extractLabelMap(content);
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/<(input|select|textarea)\b/.test(line)) continue;

    const blockEnd = Math.min(i + 10, lines.length);
    const block = lines.slice(i, blockEnd).join("\n");
    if (block.includes("aria-label=") || block.includes("aria-labelledby=")) continue;
    if (block.includes('type="hidden"')) continue;

    const idMatch = block.match(/\bid="([^"]+)"/);
    const id = idMatch?.[1];
    const phMatch = block.match(/placeholder="([^"]+)"/)?.[1];

    let labelText: string | undefined;
    if (id && labelMap.has(id)) {
      labelText = labelMap.get(id);
    } else if (phMatch && !phMatch.startsWith("http") && !phMatch.startsWith("#") && phMatch.length < 40) {
      labelText = phMatch;
    } else if (block.includes('type="checkbox"')) {
      // th header on same row
      for (let j = i; j >= Math.max(0, i - 3); j--) {
        const th = lines[j].match(/<th[^>]*>([^<]+)</);
        if (th) {
          labelText = stripTags(th[1]);
          break;
        }
      }
      if (!labelText) labelText = "Select row";
    }

    if (!labelText) continue;

    const escaped = labelText.replace(/"/g, "&quot;");
    lines[i] = line.replace(/<(input|select|textarea)\b/, `<$1 aria-label="${escaped}"`);
    fixes++;
  }

  content = lines.join("\n");

  // Checkbox in label with span text
  content = content.replace(
    /<label([^>]*)>([\s\S]*?)<input([^>]*type="checkbox"[^>]*)>([\s\S]*?)<span[^>]*>([^<]+)<\/span>/g,
    (match, lAttrs, pre, inputAttrs, mid, spanText) => {
      if (inputAttrs.includes('aria-label="') && !inputAttrs.includes('aria-label="field"')) {
        return match;
      }
      const text = spanText.trim().replace(/"/g, "&quot;");
      fixes++;
      let newInput = inputAttrs.replace(/\s*aria-label="field"/, "").trim();
      if (!newInput.includes("aria-label=")) {
        newInput = `aria-label="${text}" ${newInput}`;
      }
      return `<label${lAttrs}>${pre}<input ${newInput}>${mid}<span>${spanText}</span>`;
    }
  );

  // Icon buttons with title but no aria-label
  content = content.replace(
    /<button([^>]*)\btitle="([^"]+)"([^>]*)>/g,
    (match, a, title, b) => {
      const attrs = a + b;
      if (attrs.includes("aria-label=")) return match;
      fixes++;
      return `<button${a}aria-label="${title.replace(/"/g, "&quot;")}" title="${title}"${b}>`;
    }
  );

  if (content !== before) writeFileSync(file, content, "utf8");
}

for (const f of walk(ROOT)) processFile(f);
console.log(`Control label fixes: ${fixes}`);
