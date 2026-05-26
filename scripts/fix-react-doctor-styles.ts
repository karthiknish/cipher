/** Bulk fixes for react-doctor warnings under src/ */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";

const SRC = path.join(__dirname, "..", "src");

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (/\.(tsx|ts)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const VARIANT = "(?:sm|md|lg|xl|2xl)";

function collapseSizeAxes(content: string): string {
  const pair =
    new RegExp(
      `\\b(?:(${VARIANT}):)?w-([^\\s"'\\\`]+)\\s+(?:(?:(${VARIANT}):)?)h-\\2\\b`,
      "g"
    );
  const pairReverse =
    new RegExp(
      `\\b(?:(${VARIANT}):)?h-([^\\s"'\\\`]+)\\s+(?:(?:(${VARIANT}):)?)w-\\2\\b`,
      "g"
    );

  const replacePair = (
    _match: string,
    p1: string | undefined,
    value: string,
    p2: string | undefined
  ) => {
    const prefix = p1 ?? p2;
    if (p1 && p2 && p1 !== p2) return _match;
    return prefix ? `${prefix}:size-${value}` : `size-${value}`;
  };

  let out = content.replace(pair, replacePair);
  out = out.replace(pairReverse, replacePair);
  return out;
}

function replacePureBlack(content: string): string {
  return content
    .replace(/(?<![\w-])bg-black\//g, "bg-gray-950/")
    .replace(/(?<![\w-])bg-black(?![\w-])/g, "bg-gray-950")
    .replace(/(?<![\w-])hover:bg-black(?![\w-])/g, "hover:bg-gray-950")
    .replace(/(?<![\w-])focus:bg-black(?![\w-])/g, "focus:bg-gray-950")
    .replace(/(?<![\w-])from-black(?![\w-])/g, "from-gray-950")
    .replace(/(?<![\w-])to-black(?![\w-])/g, "to-gray-950")
    .replace(/(?<![\w-])via-black(?![\w-])/g, "via-gray-950");
}

let filesChanged = 0;

for (const file of walk(SRC)) {
  const original = readFileSync(file, "utf8");
  let next = collapseSizeAxes(original);
  next = replacePureBlack(next);
  if (next !== original) {
    writeFileSync(file, next, "utf8");
    filesChanged++;
  }
}

console.log(`Updated ${filesChanged} files under src/`);
