/** Add useMemo for inline context provider values */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";

const CTX_DIR = path.join(__dirname, "..", "src", "context");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (entry.endsWith("Context.tsx")) files.push(full);
  }
  return files;
}

let updated = 0;

for (const file of walk(CTX_DIR)) {
  let content = readFileSync(file, "utf8");
  if (!content.includes("Provider value={{")) continue;
  if (content.includes("useMemo")) continue;

  if (!content.includes("useMemo")) {
    content = content.replace(
      /from "react";/,
      'from "react";\nimport { useMemo } from "react";'
    );
    if (!content.includes("useMemo")) {
      content = content.replace(
        /from 'react';/,
        "from 'react';\nimport { useMemo } from 'react';"
      );
    }
    content = content.replace(
      /import \{([^}]+)\} from "react";/,
      (m, imports: string) => {
        if (imports.includes("useMemo")) return m;
        return `import {${imports.trim()}, useMemo } from "react";`;
      }
    );
  }

  // Simple pattern: return ( <X.Provider value={{ ... }}> 
  const match = content.match(
    /return \(\s*\n\s*<(\w+)\.Provider\s+value=\{\{([\s\S]*?)\}\}\s*>/
  );
  if (!match) continue;

  const [, providerName, valueBody] = match;
  const deps = new Set<string>();
  const depRegex = /\b([a-zA-Z_][\w]*)\b/g;
  let dm: RegExpExecArray | null;
  const skip = new Set([
    "true", "false", "null", "undefined", "return", "async", "await",
  ]);
  while ((dm = depRegex.exec(valueBody)) !== null) {
    const id = dm[1];
    if (!skip.has(id) && /^[a-z]/.test(id)) deps.add(id);
  }

  const depsList = [...deps].sort().join(", ");
  const memoBlock = `const contextValue = useMemo(
    () => ({${valueBody}}),
    [${depsList}]
  );

  return (
    <${providerName}.Provider value={contextValue}>`;

  content = content.replace(
    /return \(\s*\n\s*<\w+\.Provider\s+value=\{\{[\s\S]*?\}\}\s*>/,
    memoBlock
  );

  writeFileSync(file, content, "utf8");
  updated++;
}

console.log(`Updated ${updated} context files`);
