/**
 * Convert sequential `for...of` + await import loops to Promise.all in convex/migrations.ts
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";

const file = path.join(__dirname, "..", "convex", "migrations.ts");
let content = readFileSync(file, "utf8");

if (!content.includes("async function runParallel")) {
  content = content.replace(
    'import { internalMutation } from "./_generated/server";',
    `import { internalMutation } from "./_generated/server";

async function runParallel<T>(items: T[], fn: (item: T) => Promise<void>): Promise<number> {
  await Promise.all(items.map(fn));
  return items.length;
}`
  );
}

content = content.replace(
  /let imported = 0;\n    for \(const (\w+) of (\w+)\) \{/g,
  "const imported = await runParallel($2, async ($1) => {"
);

content = content.replace(
  /\n      imported\+\+;\n    \}\n    return \{ imported \};/g,
  "\n    });\n    return { imported };"
);

// importPricingRules: const now before loop
content = content.replace(
  /let imported = 0;\n    const now = Date\.now\(\);\n    for \(const (\w+) of (\w+)\) \{/g,
  "const now = Date.now();\n    const imported = await runParallel($2, async ($1) => {"
);

writeFileSync(file, content, "utf8");
console.log("migrations.ts updated");
