/**
 * Associate adjacent <label> + <input|select|textarea> via htmlFor/id (admin).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";

const SRC = path.join(__dirname, "..", "src", "app", "admin");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const e of readdirSync(dir)) {
    const f = path.join(dir, e);
    if (statSync(f).isDirectory()) files.push(...walk(f));
    else if (f.endsWith(".tsx")) files.push(f);
  }
  return files;
}

let idCounter = 0;
let fixes = 0;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36) || "field";
}

function processFile(file: string) {
  const base = path.basename(file, ".tsx");
  const lines = readFileSync(file, "utf8").split("\n");
  let changed = false;

  for (let i = 0; i < lines.length - 1; i++) {
    const labelLine = lines[i];
    const nextLine = lines[i + 1];
    if (
      !labelLine.includes("<label") ||
      labelLine.includes("htmlFor") ||
      !(
        nextLine.includes("<input") ||
        nextLine.includes("<select") ||
        nextLine.includes("<textarea")
      ) ||
      nextLine.includes(" id=")
    ) {
      continue;
    }

    const textMatch = labelLine.match(/>([^<]+)</);
    const text = textMatch?.[1]?.trim() ?? "field";
    idCounter++;
    const id = `${base}-${slugify(text)}-${idCounter}`;

    lines[i] = labelLine.replace("<label", `<label htmlFor="${id}"`);
    lines[i + 1] = nextLine.replace(
      /<(input|select|textarea)\b/,
      `<$1 id="${id}"`
    );
    fixes++;
    changed = true;
  }

  if (changed) writeFileSync(file, lines.join("\n"), "utf8");
}

for (const f of walk(SRC)) processFile(f);
console.log(`Label associations added: ${fixes}`);
