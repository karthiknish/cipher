/** Bulk fixes: button type, Image fill sizes, JSX ellipsis */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";

const SRC = path.join(__dirname, "..", "src");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (/\.tsx$/.test(entry)) files.push(full);
  }
  return files;
}

function addButtonTypes(content: string): string {
  return content.replace(/<button\b([^>]*)>/gi, (match, attrs: string) => {
    if (/\btype\s*=/.test(attrs)) return match;
    const trimmed = attrs.trim();
    return trimmed ? `<button type="button" ${trimmed}>` : `<button type="button">`;
  });
}

function addImageSizes(content: string): string {
  if (!content.includes("<Image")) return content;
  const sizesAttr = ` sizes="(max-width: 768px) 100vw, 50vw"`;
  return content.replace(/<Image([\s\S]*?)\/>/g, (match, inner: string) => {
    if (!/\bfill\b/.test(inner) || /\bsizes\s*=/.test(inner)) return match;
    return `<Image${inner}${sizesAttr} />`;
  });
}

function fixEllipsis(content: string): string {
  let out = content;
  const replacements: Array<[RegExp, string]> = [
    [/Loading\.\.\./g, "Loading…"],
    [/Saving\.\.\./g, "Saving…"],
    [/Submitting\.\.\./g, "Submitting…"],
    [/Processing\.\.\./g, "Processing…"],
    [/Uploading\.\.\./g, "Uploading…"],
    [/Searching\.\.\./g, "Searching…"],
    [/Sending\.\.\./g, "Sending…"],
    [/Deleting\.\.\./g, "Deleting…"],
    [/Generating\.\.\./g, "Generating…"],
    [/SUBSCRIBING\.\.\./g, "SUBSCRIBING…"],
  ];
  for (const [re, rep] of replacements) {
    out = out.replace(re, rep);
  }
  return out;
}

const stats = { files: 0, buttons: 0, images: 0 };

for (const file of walk(SRC)) {
  const original = readFileSync(file, "utf8");
  let content = original;
  const b = addButtonTypes(content);
  if (b !== content) stats.buttons++;
  content = b;
  const img = addImageSizes(content);
  if (img !== content) stats.images++;
  content = img;
  content = fixEllipsis(content);
  if (content !== original) {
    writeFileSync(file, content, "utf8");
    stats.files++;
  }
}

console.log(stats);
