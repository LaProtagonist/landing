export function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function buildRouteIndices(
  visibleCount: number,
  depth: number,
  rand: () => number
): Uint32Array {
  const safeDepth = Math.max(2, Math.min(5, Math.floor(depth)))
  const indices = new Uint32Array(safeDepth)
  for (let i = 0; i < safeDepth; i += 1) {
    indices[i] = Math.floor(rand() * visibleCount)
  }
  return indices
}
