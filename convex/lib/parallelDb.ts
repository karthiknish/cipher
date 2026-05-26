import type { MutationCtx } from "../_generated/server";
import type { TableNames, Id } from "../_generated/dataModel";

export async function runParallel<T>(
  items: T[],
  fn: (item: T) => Promise<void>
): Promise<number> {
  await Promise.all(items.map(fn));
  return items.length;
}

/** Patch all docs in a table where `field === fromId`, in parallel. */
export async function patchMatchingDocs(
  ctx: MutationCtx,
  table: TableNames,
  field: string,
  fromId: string,
  toId: string
): Promise<number> {
  const docs = await ctx.db.query(table).collect();
  const patches: Promise<void>[] = [];
  for (const doc of docs) {
    if ((doc as Record<string, unknown>)[field] !== fromId) continue;
    patches.push(
      ctx.db.patch(doc._id as Id<TableNames>, { [field]: toId } as Record<string, string>)
    );
  }
  await Promise.all(patches);
  return patches.length;
}
