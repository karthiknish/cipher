/** Wrap inline Context.Provider values with useMemo */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";

const CTX = path.join(__dirname, "..", "src", "context");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const e of readdirSync(dir)) {
    const f = path.join(dir, e);
    if (statSync(f).isDirectory()) files.push(...walk(f));
    else if (e.endsWith("Context.tsx")) files.push(f);
  }
  return files;
}

function ensureUseMemoImport(content: string): string {
  if (content.includes("useMemo")) return content;
  if (content.includes('from "react"')) {
    return content.replace(
      /import \{([^}]+)\} from "react";/,
      (_, imports: string) => {
        const parts = imports.split(",").map((s) => s.trim()).filter(Boolean);
        if (!parts.includes("useMemo")) parts.push("useMemo");
        return `import { ${parts.join(", ")} } from "react";`;
      }
    );
  }
  return content;
}

function extractDeps(valueBody: string): string[] {
  const deps = new Set<string>();
  for (const line of valueBody.split("\n")) {
    const m = line.match(/^\s*([a-zA-Z_][\w]*)\s*,?\s*$/);
    if (m) deps.add(m[1]);
  }
  return [...deps].sort();
}

function processFile(file: string): boolean {
  let content = readFileSync(file, "utf8");
  if (content.includes("const contextValue = useMemo")) return false;

  // Inline value={{ ... }}
  const inlineRe =
    /<(\w+)\.Provider\s+value=\{\{([\s\S]*?)\}\}\s*>/g;
  let match = inlineRe.exec(content);
  if (!match) {
    // Multiline: <Provider\n      value={{
    const multilineRe =
      /<(\w+)\.Provider\s*\n\s*value=\{\{([\s\S]*?)\}\}\s*>/g;
    match = multilineRe.exec(content);
  }
  if (!match) {
    // const value: Type = { ... }; <Provider value={value}>
    const constRe =
      /const (value(?::[^=]+)?)\s*=\s*\{([\s\S]*?)\n\s*\};\s*\n\s*return \(\s*\n\s*<(\w+)\.Provider\s+value=\{value\}/;
    const cm = constRe.exec(content);
    if (cm) {
      const [, valueDecl, valueBody, providerName] = cm;
      const deps = extractDeps(valueBody);
      const replacement = `const contextValue = useMemo(
    () => ({${valueBody}
    }),
    [${deps.join(", ")}]
  );

  return (
    <${providerName}.Provider value={contextValue}`;
      content = content.replace(constRe, replacement);
      content = ensureUseMemoImport(content);
      writeFileSync(file, content, "utf8");
      return true;
    }
    return false;
  }

  const [, providerName, valueBody] = match;
  const deps = extractDeps(valueBody);
  const memo = `const contextValue = useMemo(
    () => ({${valueBody}}),
    [${deps.join(", ")}]
  );

  return (
    <${providerName}.Provider value={contextValue}>`;

  content = content.replace(
    /return \(\s*\n\s*<(\w+)\.Provider\s+value=\{\{/,
    "<$1.Provider value={{"
  );
  content = content.replace(match[0], memo);
  content = ensureUseMemoImport(content);
  writeFileSync(file, content, "utf8");
  return true;
}

let n = 0;
for (const f of walk(CTX)) {
  if (processFile(f)) {
    n++;
    console.log("updated", path.basename(f));
  }
}
console.log(`Done: ${n} files`);
