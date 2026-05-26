/**
 * A11y fixes for admin + shop forms:
 * - Nested <label htmlFor> + child id → remove htmlFor, add aria-label from span text
 * - Adjacent label + control → htmlFor/id within 8 lines
 * - Orphan controls → aria-label from placeholder
 * - Icon-only buttons → aria-label
 * - Clickable div/motion.div backdrop → close button overlay
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";

const ROOT = path.join(__dirname, "..", "src");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const e of readdirSync(dir)) {
    const f = path.join(dir, e);
    if (statSync(f).isDirectory()) files.push(...walk(f));
    else if (f.endsWith(".tsx")) files.push(f);
  }
  return files;
}

let nestedLabelFixes = 0;
let labelFixes = 0;
let ariaFixes = 0;
let keyboardFixes = 0;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "field";
}

/** Remove htmlFor on labels that wrap a control with the same id; add aria-label from span. */
function fixNestedLabels(content: string): string {
  return content.replace(
    /<label\s+htmlFor="([^"]+)"([^>]*)>([\s\S]*?)<\/label>/g,
    (match, id: string, labelAttrs: string, inner: string) => {
      const controlRe = new RegExp(
        `<(input|select|textarea)\\b[^>]*\\bid="${id}"`,
        "i"
      );
      if (!controlRe.test(inner)) return match;

      const spanMatch = inner.match(
        /<span[^>]*>([^<]+)<\/span>\s*<\s*(input|select|textarea)\b/i
      );
      const labelText = spanMatch?.[1]?.trim();
      nestedLabelFixes++;

      let updatedInner = inner;
      if (labelText && !inner.includes("aria-label=")) {
        updatedInner = inner.replace(
          /<(input|select|textarea)\b/,
          `<$1 aria-label="${labelText.replace(/"/g, "&quot;")}"`
        );
        ariaFixes++;
      }

      const cleanAttrs = labelAttrs.replace(/\s*htmlFor="[^"]*"/, "");
      return `<label${cleanAttrs}>${updatedInner}</label>`;
    }
  );
}

function fixLabels(lines: string[], base: string): string[] {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes("<label") || line.includes("htmlFor")) continue;

    let controlLine = -1;
    let controlTag = "";
    for (let j = i + 1; j < Math.min(i + 9, lines.length); j++) {
      const l = lines[j];
      if (/<(input|select|textarea)\b/.test(l) && !l.includes(" id=") && !l.includes("aria-label=")) {
        controlLine = j;
        const m = l.match(/<(input|select|textarea)\b/);
        controlTag = m?.[1] ?? "input";
        break;
      }
    }
    if (controlLine === -1) continue;

    const textMatch = line.match(/>([^<]+)</);
    const text = textMatch?.[1]?.trim() ?? "field";
    labelFixes++;
    const id = `${base}-${slugify(text)}-${labelFixes}`;
    lines[i] = line.replace("<label", `<label htmlFor="${id}"`);
    const aria = ` aria-label="${text.replace(/"/g, "&quot;")}"`;
    lines[controlLine] = lines[controlLine].replace(
      new RegExp(`<${controlTag}\\b`),
      `<${controlTag} id="${id}"${lines[controlLine].includes("aria-label=") ? "" : aria}`
    );
    if (!lines[controlLine].includes("aria-label=")) ariaFixes++;
  }
  return lines;
}

/** Add aria-label on controls that have htmlFor/id pairing but no aria-label. */
function addAriaFromHtmlFor(lines: string[]): string[] {
  for (let i = 0; i < lines.length; i++) {
    const labelMatch = lines[i].match(/<label[^>]*htmlFor="([^"]+)"[^>]*>([^<]*)</);
    if (!labelMatch) continue;
    const [, id, rawText] = labelMatch;
    const text = rawText.trim();
    if (!text) continue;

    for (let j = i; j < Math.min(i + 12, lines.length); j++) {
      const l = lines[j];
      if (!l.includes(`id="${id}"`)) continue;
      if (!/<(input|select|textarea)\b/.test(l) || l.includes("aria-label=")) break;
      lines[j] = l.replace(
        /<(input|select|textarea)\b/,
        `<$1 aria-label="${text.replace(/"/g, "&quot;")}"`
      );
      ariaFixes++;
      break;
    }
  }
  return lines;
}

/** Label block text then control within 15 lines — add htmlFor/id. */
function fixDistantLabelControl(lines: string[], base: string): string[] {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes("<label") || line.includes("htmlFor")) continue;
    const textMatch = line.match(/>([^<]+)</);
    if (!textMatch) continue;

    let controlLine = -1;
    let controlTag = "";
    for (let j = i + 1; j < Math.min(i + 16, lines.length); j++) {
      const l = lines[j];
      if (/<\/label>/.test(l)) break;
      if (/<(input|select|textarea)\b/.test(l) && !l.includes(" id=")) {
        controlLine = j;
        controlTag = l.match(/<(input|select|textarea)\b/)?.[1] ?? "input";
        break;
      }
    }
    if (controlLine === -1) continue;

    const text = textMatch[1].trim();
    labelFixes++;
    const id = `${base}-field-${labelFixes}`;
    lines[i] = line.replace("<label", `<label htmlFor="${id}"`);
    const aria = line.includes("aria-label=") ? "" : ` aria-label="${text.replace(/"/g, "&quot;")}"`;
    lines[controlLine] = lines[controlLine].replace(
      new RegExp(`<${controlTag}\\b`),
      `<${controlTag} id="${id}"${aria}`
    );
    if (aria) ariaFixes++;
  }
  return lines;
}

/** Orphan label before role=button div — aria-labelledby */
function fixLabelBeforeButtonDiv(lines: string[]): string[] {
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    if (!line.includes("<label") || line.includes("htmlFor") || line.includes("id=")) continue;
    const textMatch = line.match(/>([^<]+)</);
    if (!textMatch) continue;

    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const l = lines[j];
      if (!l.includes('role="button"') || l.includes("aria-labelledby")) break;
      if (!l.includes("<div")) continue;
      const labelId = `a11y-label-${labelFixes + nestedLabelFixes + ariaFixes}`;
      lines[i] = line.replace("<label", `<label id="${labelId}"`);
      lines[j] = l.replace("<div", `<div aria-labelledby="${labelId}"`);
      labelFixes++;
      break;
    }
  }
  return lines;
}

function addAriaFromPlaceholder(lines: string[]): string[] {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/<(input|select|textarea)\b/.test(line)) continue;
    if (line.includes("aria-label=") || line.includes("aria-labelledby=")) continue;
    if (line.includes(" id=")) continue;

    const ph = line.match(/placeholder="([^"]+)"/)?.[1];
    if (!ph) continue;

    lines[i] = line.replace(
      /<(input|select|textarea)\b/,
      `<$1 aria-label="${ph.replace(/"/g, "&quot;")}"`
    );
    ariaFixes++;
  }
  return lines;
}

function fixIconButtons(lines: string[]): string[] {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes("<button") || line.includes("aria-label")) continue;
    const block = [line, lines[i + 1] ?? "", lines[i + 2] ?? "", lines[i + 3] ?? ""].join("\n");
    if (!/<[A-Z][a-zA-Z]*\s+[^>]*className="[^"]*size-/.test(block)) continue;
    if (/>\s*[\w][^<]{1,}\s*</.test(block.replace(/<[^/][^>]*\/>/g, ""))) continue;

    const iconMatch = block.match(/<([A-Z][a-zA-Z0-9]*)\s/);
    if (!iconMatch) continue;
    const name = iconMatch[1]
      .replace(/([A-Z])/g, " $1")
      .trim()
      .toLowerCase();
    lines[i] = line.replace(/<button\b/, `<button aria-label="${name}"`);
    ariaFixes++;
  }
  return lines;
}

function fixBackdropClicks(content: string): string {
  // Only transform simple onClick={handler} — skip multi-line handlers
  return content.replace(
    /(<(?:motion\.)?div\b[^>]*className="[^"]*fixed inset-0[^"]*"[^>]*)\bonClick=\{([^{}]+)\}([^>]*>)/g,
    (match, before, handler, after) => {
      if (match.includes("onKeyDown") || match.includes('role="presentation"')) return match;
      keyboardFixes++;
      return `${before}role="presentation"${after}\n        <button type="button" aria-label="Close" className="absolute inset-0 w-full h-full cursor-default" onClick={${handler}} />`;
    }
  );
}

for (const file of walk(ROOT)) {
  const base = path.basename(file, ".tsx");
  let content = readFileSync(file, "utf8");
  const before = content;

  content = fixNestedLabels(content);
  let lines = content.split("\n");
  lines = fixLabels(lines, base);
  lines = addAriaFromHtmlFor(lines);
  lines = fixDistantLabelControl(lines, base);
  lines = fixLabelBeforeButtonDiv(lines);
  lines = addAriaFromPlaceholder(lines);
  lines = fixIconButtons(lines);
  content = fixBackdropClicks(lines.join("\n"));

  if (content !== before) writeFileSync(file, content, "utf8");
}

console.log({ nestedLabelFixes, labelFixes, ariaFixes, keyboardFixes });
