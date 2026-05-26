/**
 * Destructure useRouter() methods for react-compiler-destructure-method.
 */

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

const METHODS = ["push", "replace", "back", "refresh", "prefetch"] as const;

function fixFile(file: string): boolean {
  let content = readFileSync(file, "utf8");
  if (!content.includes("useRouter")) return false;

  const usedMethods = METHODS.filter((m) =>
    new RegExp(`\\brouter\\.${m}\\b`).test(content)
  );
  if (usedMethods.length === 0) return false;

  const routerDecl = /const\s+router\s*=\s*useRouter\(\)\s*;/;
  if (!routerDecl.test(content)) return false;

  const destructure = `const { ${usedMethods.join(", ")} } = useRouter();`;
  content = content.replace(routerDecl, destructure);

  for (const method of usedMethods) {
    content = content.replace(
      new RegExp(`\\brouter\\.${method}\\b`, "g"),
      method
    );
  }

  if (content.includes("router.")) {
    // Still uses router for other props — re-add router binding
    const stillNeedsRouter = METHODS.some(
      (m) => !usedMethods.includes(m) && content.includes(`router.${m}`)
    );
    if (stillNeedsRouter) {
      return false;
    }
  }

  writeFileSync(file, content, "utf8");
  return true;
}

let changed = 0;
for (const file of walk(SRC)) {
  if (fixFile(file)) changed++;
}
console.log(`Updated router destructuring in ${changed} files`);
