/** Run async work in fixed-size chunks to avoid unbounded Promise.all fan-out. */
export async function mapInBatches<T>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const size = Math.max(1, batchSize);
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    await Promise.all(chunk.map((item) => fn(item)));
  }
}
