export type SphereData = {
  positions: Float32Array
  latitudes: Float32Array
  longitudes: Float32Array
  landMask: Float32Array
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

function continentMask(lat: number, lon: number) {
  const n1 = Math.sin(lon * 1.7 + Math.cos(lat * 2.1))
  const n2 = Math.sin(lon * 3.1 + lat * 1.3)
  const n3 = Math.cos(lat * 4.2 - lon * 0.7)
  const mix = n1 * 0.5 + n2 * 0.3 + n3 * 0.2
  const normalized = clamp01((mix + 1.2) / 2.4)
  return smoothstep(0.38, 0.55, normalized)
}

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleIndices(count: number, seed: number) {
  const indices = Array.from({ length: count }, (_, i) => i)
  const rand = mulberry32(seed)

  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = indices[i]
    indices[i] = indices[j]
    indices[j] = tmp
  }

  return indices
}

export function buildFibonacciSphere(count: number, seed = 1337): SphereData {
  const positions = new Float32Array(count * 3)
  const latitudes = new Float32Array(count)
  const longitudes = new Float32Array(count)
  const landMask = new Float32Array(count)

  const offset = 2 / count
  const increment = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i += 1) {
    const y = i * offset - 1 + offset / 2
    const r = Math.sqrt(1 - y * y)
    const phi = i * increment
    const x = Math.cos(phi) * r
    const z = Math.sin(phi) * r

    const i3 = i * 3
    positions[i3] = x
    positions[i3 + 1] = y
    positions[i3 + 2] = z

    const lat = Math.asin(y)
    const lon = Math.atan2(z, x)

    latitudes[i] = lat
    longitudes[i] = lon
    landMask[i] = continentMask(lat, lon)
  }

  const order = shuffleIndices(count, seed)
  const shuffledPositions = new Float32Array(count * 3)
  const shuffledLat = new Float32Array(count)
  const shuffledLon = new Float32Array(count)
  const shuffledMask = new Float32Array(count)

  for (let i = 0; i < count; i += 1) {
    const src = order[i]
    const src3 = src * 3
    const dst3 = i * 3

    shuffledPositions[dst3] = positions[src3]
    shuffledPositions[dst3 + 1] = positions[src3 + 1]
    shuffledPositions[dst3 + 2] = positions[src3 + 2]

    shuffledLat[i] = latitudes[src]
    shuffledLon[i] = longitudes[src]
    shuffledMask[i] = landMask[src]
  }

  return {
    positions: shuffledPositions,
    latitudes: shuffledLat,
    longitudes: shuffledLon,
    landMask: shuffledMask,
  }
}