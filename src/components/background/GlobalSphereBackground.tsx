import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { button, useControls } from 'leva'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { buildFibonacciSphere } from './sphereUtils'
import { mulberry32 } from './connectionUtils'

const MAX_SURFACE_POINT_COUNT = 6000
const STORAGE_KEY = 'spiski-background-sphere'
const MIN_CONNECTION_SUBDIVS = 16
const MAX_CONNECTION_SUBDIVS = 48

const LOCAL_ROUTE_BIAS = 0.93
const LOCAL_CANDIDATE_SAMPLES = 40
const FAR_CANDIDATE_SAMPLES = 3

type RoutePhase = 'growing' | 'holding' | 'shrinking' | 'cooldown'

type RouteState = {
  indices: Uint32Array
  headProgress: number
  tailProgress: number
  phase: RoutePhase
  growSpeed: number
  shrinkSpeed: number
  holdDuration: number
  holdTimer: number
  cooldownDuration: number
  cooldownTimer: number
}

function createCircleTexture(size = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const center = size / 2
  const radius = size * 0.4
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

function mixColors(
  out: THREE.Color,
  a: THREE.Color,
  b: THREE.Color,
  c: THREE.Color,
  wa: number,
  wb: number,
  wc: number
) {
  const total = wa + wb + wc || 1
  out.setRGB(
    (a.r * wa + b.r * wb + c.r * wc) / total,
    (a.g * wa + b.g * wb + c.g * wc) / total,
    (a.b * wa + b.b * wb + c.b * wc) / total
  )
}

function computeGradientColor(
  out: THREE.Color,
  colorA: THREE.Color,
  colorB: THREE.Color,
  colorC: THREE.Color,
  lat: number,
  lon: number,
  time: number,
  land: number
) {
  const wa = 0.6 + 0.4 * Math.sin(lon + time)
  const wb = 0.6 + 0.4 * Math.sin(lat * 1.6 - time * 0.7)
  const wc = 0.6 + 0.4 * Math.sin((lon - lat) * 0.8 + time * 0.4)

  mixColors(out, colorA, colorB, colorC, wa, wb, wc)

  const oceanDim = 0.75
  const landBoost = 1.15
  const intensity = oceanDim + land * (landBoost - oceanDim)

  out.setRGB(
    Math.min(1, out.r * intensity),
    Math.min(1, out.g * intensity),
    Math.min(1, out.b * intensity)
  )
}

function slerpUnitVectors(
  out: THREE.Vector3,
  start: THREE.Vector3,
  end: THREE.Vector3,
  t: number
) {
  const clampedT = Math.min(1, Math.max(0, t))
  let dot = start.dot(end)
  dot = Math.min(1, Math.max(-1, dot))

  if (dot > 0.9995 || dot < -0.9995) {
    return out.copy(start).lerp(end, clampedT).normalize()
  }

  const omega = Math.acos(dot)
  const sinOmega = Math.sin(omega)

  const scale0 = Math.sin((1 - clampedT) * omega) / sinOmega
  const scale1 = Math.sin(clampedT * omega) / sinOmega

  return out
    .copy(start)
    .multiplyScalar(scale0)
    .addScaledVector(end, scale1)
    .normalize()
}

function getRandomUnusedIndex(
  visibleCount: number,
  used: Set<number>,
  rand: () => number
) {
  if (used.size >= visibleCount) {
    return 0
  }

  for (let i = 0; i < visibleCount * 2; i += 1) {
    const candidate = Math.floor(rand() * visibleCount)
    if (!used.has(candidate)) {
      return candidate
    }
  }

  for (let i = 0; i < visibleCount; i += 1) {
    if (!used.has(i)) {
      return i
    }
  }

  return 0
}

function getPointDot(
  positions: Float32Array,
  indexA: number,
  indexB: number
) {
  const a3 = indexA * 3
  const b3 = indexB * 3
  return (
    positions[a3] * positions[b3] +
    positions[a3 + 1] * positions[b3 + 1] +
    positions[a3 + 2] * positions[b3 + 2]
  )
}

function pickBiasedNextIndex(
  currentIndex: number,
  visibleCount: number,
  positions: Float32Array,
  used: Set<number>,
  rand: () => number,
  preferLocal: boolean
) {
  const sampleCount = preferLocal
    ? LOCAL_CANDIDATE_SAMPLES
    : FAR_CANDIDATE_SAMPLES

  let bestIndex = -1
  let bestScore = preferLocal ? -Infinity : Infinity

  for (let i = 0; i < sampleCount; i += 1) {
    const candidate = getRandomUnusedIndex(visibleCount, used, rand)
    if (candidate === currentIndex || used.has(candidate)) {
      continue
    }

    const dot = getPointDot(positions, currentIndex, candidate)

    if (preferLocal) {
      const score = dot + (rand() - 0.5) * 0.035
      if (score > bestScore) {
        bestScore = score
        bestIndex = candidate
      }
    } else {
      const score = dot + (rand() - 0.5) * 0.035
      if (score < bestScore) {
        bestScore = score
        bestIndex = candidate
      }
    }
  }

  if (bestIndex !== -1) {
    return bestIndex
  }

  return getRandomUnusedIndex(visibleCount, used, rand)
}

function buildGroupedRouteIndices(
  visibleCount: number,
  depth: number,
  positions: Float32Array,
  rand: () => number
) {
  const resolvedDepth = Math.max(2, Math.min(5, depth))
  const route = new Uint32Array(resolvedDepth)
  const used = new Set<number>()

  let current = Math.floor(rand() * visibleCount)
  route[0] = current
  used.add(current)

  for (let step = 1; step < resolvedDepth; step += 1) {
    const preferLocal = rand() < LOCAL_ROUTE_BIAS
    const nextIndex = pickBiasedNextIndex(
      current,
      visibleCount,
      positions,
      used,
      rand,
      preferLocal
    )

    route[step] = nextIndex
    used.add(nextIndex)
    current = nextIndex
  }

  return route
}

function createRouteState(
  visibleCount: number,
  depth: number,
  positions: Float32Array,
  baseSpeed: number,
  rand: () => number,
  startDistributed = false
): RouteState {
  const maxProgress = Math.max(1, depth - 1)
  const growSpeed = baseSpeed * (0.8 + rand() * 0.55)
  const shrinkSpeed = baseSpeed * (0.8 + rand() * 0.55)
  const holdDuration = 0.12 + rand() * 0.75
  const cooldownDuration = 0.08 + rand() * 0.6

  const state: RouteState = {
    indices: buildGroupedRouteIndices(visibleCount, depth, positions, rand),
    headProgress: 0,
    tailProgress: 0,
    phase: 'growing',
    growSpeed,
    shrinkSpeed,
    holdDuration,
    holdTimer: holdDuration,
    cooldownDuration,
    cooldownTimer: 0,
  }

  if (!startDistributed) {
    return state
  }

  const phaseSeed = rand()

  if (phaseSeed < 0.5) {
    state.phase = 'growing'
    state.headProgress = rand() * maxProgress * 0.85
    state.tailProgress = 0
    return state
  }

  if (phaseSeed < 0.68) {
    state.phase = 'holding'
    state.headProgress = maxProgress
    state.tailProgress = 0
    state.holdTimer = rand() * holdDuration
    return state
  }

  if (phaseSeed < 0.9) {
    state.phase = 'shrinking'
    state.headProgress = maxProgress
    state.tailProgress = rand() * maxProgress * 0.85
    return state
  }

  state.phase = 'cooldown'
  state.cooldownTimer = rand() * cooldownDuration
  return state
}

function respawnRoute(
  route: RouteState,
  visibleCount: number,
  depth: number,
  positions: Float32Array,
  baseSpeed: number,
  rand: () => number
) {
  const next = createRouteState(
    visibleCount,
    depth,
    positions,
    baseSpeed,
    rand,
    false
  )

  route.indices = next.indices
  route.headProgress = 0
  route.tailProgress = 0
  route.phase = 'growing'
  route.growSpeed = next.growSpeed
  route.shrinkSpeed = next.shrinkSpeed
  route.holdDuration = next.holdDuration
  route.holdTimer = next.holdDuration
  route.cooldownDuration = next.cooldownDuration
  route.cooldownTimer = 0
}

function SphereConnections({
  positions,
  landMask,
  visibleCount,
  connectionRatio,
  connectionDepth,
  connectionGrowSpeed,
  gradientColorA,
  gradientColorB,
  gradientColorC,
  gradientFlowSpeed,
}: {
  positions: Float32Array
  landMask: Float32Array
  visibleCount: number
  connectionRatio: number
  connectionDepth: number
  connectionGrowSpeed: number
  gradientColorA: string
  gradientColorB: string
  gradientColorC: string
  gradientFlowSpeed: number
}) {
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const routesRef = useRef<RouteState[]>([])
  const randRef = useRef<() => number>(() => 0.5)

  const routeCount = Math.min(
    Math.max(0, Math.floor(visibleCount * connectionRatio)),
    240
  )
  const depth = Math.max(2, Math.min(5, Math.floor(connectionDepth)))
  const maxSegmentPieces = routeCount * (depth - 1) * MAX_CONNECTION_SUBDIVS

  const linePositions = useMemo(
    () => new Float32Array(Math.max(1, maxSegmentPieces) * 2 * 3),
    [maxSegmentPieces]
  )
  const lineColors = useMemo(
    () => new Float32Array(Math.max(1, maxSegmentPieces) * 2 * 3),
    [maxSegmentPieces]
  )

  const colorA = useMemo(() => new THREE.Color(gradientColorA), [gradientColorA])
  const colorB = useMemo(() => new THREE.Color(gradientColorB), [gradientColorB])
  const colorC = useMemo(() => new THREE.Color(gradientColorC), [gradientColorC])
  const mixed = useMemo(() => new THREE.Color(), [])
  const tempStart = useMemo(() => new THREE.Vector3(), [])
  const tempEnd = useMemo(() => new THREE.Vector3(), [])
  const tempPoint = useMemo(() => new THREE.Vector3(), [])
  const tempPointNext = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    if (routeCount <= 0 || visibleCount < 2) {
      routesRef.current = []
      return
    }

    const seed = 4242 + visibleCount * 31 + depth * 131
    const rand = mulberry32(seed)
    randRef.current = rand

    const routes: RouteState[] = []
    for (let i = 0; i < routeCount; i += 1) {
      routes.push(
        createRouteState(
          visibleCount,
          depth,
          positions,
          Math.max(0.05, connectionGrowSpeed),
          rand,
          true
        )
      )
    }
    routesRef.current = routes
  }, [visibleCount, routeCount, depth, connectionGrowSpeed, positions])

  useFrame(({ clock }, delta) => {
    if (!geometryRef.current) return

    const geometry = geometryRef.current
    const routes = routesRef.current
    if (routes.length === 0) {
      geometry.setDrawRange(0, 0)
      return
    }

    const maxProgress = depth - 1
    const rand = randRef.current

    for (let i = 0; i < routes.length; i += 1) {
      const route = routes[i]

      switch (route.phase) {
        case 'growing': {
          route.headProgress = Math.min(
            maxProgress,
            route.headProgress + delta * route.growSpeed
          )
          if (route.headProgress >= maxProgress) {
            route.headProgress = maxProgress
            route.phase = 'holding'
            route.holdTimer = route.holdDuration
          }
          break
        }

        case 'holding': {
          route.holdTimer -= delta
          if (route.holdTimer <= 0) {
            route.phase = 'shrinking'
          }
          break
        }

        case 'shrinking': {
          route.tailProgress = Math.min(
            maxProgress,
            route.tailProgress + delta * route.shrinkSpeed
          )
          if (route.tailProgress >= maxProgress) {
            route.phase = 'cooldown'
            route.cooldownTimer = route.cooldownDuration
            route.headProgress = 0
            route.tailProgress = 0
          }
          break
        }

        case 'cooldown': {
          route.cooldownTimer -= delta
          if (route.cooldownTimer <= 0) {
            respawnRoute(
              route,
              visibleCount,
              depth,
              positions,
              Math.max(0.05, connectionGrowSpeed),
              rand
            )
          }
          break
        }
      }
    }

    const time = clock.getElapsedTime() * gradientFlowSpeed
    let vertexCursor = 0
    let floatCursor = 0

    for (let r = 0; r < routes.length; r += 1) {
      const route = routes[r]

      if (route.phase === 'cooldown') {
        continue
      }

      for (let s = 0; s < depth - 1; s += 1) {
        const localFrom = Math.max(0, Math.min(1, route.tailProgress - s))
        const localTo = Math.max(0, Math.min(1, route.headProgress - s))
        const visibleSpan = localTo - localFrom

        if (visibleSpan <= 0.0001) {
          continue
        }

        const idxA = route.indices[s]
        const idxB = route.indices[s + 1]

        const a3 = idxA * 3
        const b3 = idxB * 3

        tempStart
          .set(positions[a3], positions[a3 + 1], positions[a3 + 2])
          .normalize()
        tempEnd
          .set(positions[b3], positions[b3 + 1], positions[b3 + 2])
          .normalize()

        const angle = tempStart.angleTo(tempEnd)
        const adaptiveSubdivs = Math.min(
          MAX_CONNECTION_SUBDIVS,
          Math.max(MIN_CONNECTION_SUBDIVS, Math.ceil(angle * 24))
        )
        const activeSubdivs = Math.max(
          1,
          Math.min(adaptiveSubdivs, Math.ceil(adaptiveSubdivs * visibleSpan))
        )

        for (let j = 0; j < activeSubdivs; j += 1) {
          const t0 = localFrom + (visibleSpan * j) / activeSubdivs
          const t1 = localFrom + (visibleSpan * (j + 1)) / activeSubdivs

          slerpUnitVectors(tempPoint, tempStart, tempEnd, t0)
          slerpUnitVectors(tempPointNext, tempStart, tempEnd, t1)

          linePositions[floatCursor] = tempPoint.x
          linePositions[floatCursor + 1] = tempPoint.y
          linePositions[floatCursor + 2] = tempPoint.z
          linePositions[floatCursor + 3] = tempPointNext.x
          linePositions[floatCursor + 4] = tempPointNext.y
          linePositions[floatCursor + 5] = tempPointNext.z

          const land0 = THREE.MathUtils.lerp(landMask[idxA], landMask[idxB], t0)
          const land1 = THREE.MathUtils.lerp(landMask[idxA], landMask[idxB], t1)

          computeGradientColor(
            mixed,
            colorA,
            colorB,
            colorC,
            Math.asin(tempPoint.y),
            Math.atan2(tempPoint.z, tempPoint.x),
            time,
            land0
          )
          lineColors[floatCursor] = mixed.r
          lineColors[floatCursor + 1] = mixed.g
          lineColors[floatCursor + 2] = mixed.b

          computeGradientColor(
            mixed,
            colorA,
            colorB,
            colorC,
            Math.asin(tempPointNext.y),
            Math.atan2(tempPointNext.z, tempPointNext.x),
            time,
            land1
          )
          lineColors[floatCursor + 3] = mixed.r
          lineColors[floatCursor + 4] = mixed.g
          lineColors[floatCursor + 5] = mixed.b

          floatCursor += 6
          vertexCursor += 2
        }
      }
    }

    geometry.setDrawRange(0, vertexCursor)

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
    const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute
    posAttr.needsUpdate = true
    colorAttr.needsUpdate = true
  })

  if (visibleCount < 2 || routeCount === 0) return null

  return (
    <lineSegments renderOrder={1}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          array={linePositions}
          itemSize={3}
          count={linePositions.length / 3}
          usage={THREE.DynamicDrawUsage}
        />
        <bufferAttribute
          attach="attributes-color"
          array={lineColors}
          itemSize={3}
          count={lineColors.length / 3}
          usage={THREE.DynamicDrawUsage}
        />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.55}
        depthTest
        depthWrite={false}
      />
    </lineSegments>
  )
}

function RotatingSphere({
  scale,
  pointSize,
  pointCount,
  rotationSpeed,
  rotationDirection,
  gradientColorA,
  gradientColorB,
  gradientColorC,
  gradientFlowSpeed,
  spriteTexture,
  connectionRatio,
  connectionDepth,
  connectionGrowSpeed,
}: {
  scale: number
  pointSize: number
  pointCount: number
  rotationSpeed: number
  rotationDirection: 'clockwise' | 'counterclockwise'
  gradientColorA: string
  gradientColorB: string
  gradientColorC: string
  gradientFlowSpeed: number
  spriteTexture: THREE.Texture | null
  connectionRatio: number
  connectionDepth: number
  connectionGrowSpeed: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const geometryRef = useRef<THREE.BufferGeometry>(null)

  const sphereData = useMemo(
    () => buildFibonacciSphere(MAX_SURFACE_POINT_COUNT, 1337),
    []
  )

  const colors = useMemo(
    () => new Float32Array(MAX_SURFACE_POINT_COUNT * 3),
    []
  )

  const colorA = useMemo(() => new THREE.Color(gradientColorA), [gradientColorA])
  const colorB = useMemo(() => new THREE.Color(gradientColorB), [gradientColorB])
  const colorC = useMemo(() => new THREE.Color(gradientColorC), [gradientColorC])
  const mixed = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    if (!geometryRef.current) return
    const clamped = Math.max(32, Math.min(MAX_SURFACE_POINT_COUNT, Math.floor(pointCount)))
    geometryRef.current.setDrawRange(0, clamped)
  }, [pointCount])

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !geometryRef.current) return

    const dir = rotationDirection === 'clockwise' ? -1 : 1
    groupRef.current.rotation.y += delta * rotationSpeed * dir

    const visibleCount = Math.max(
      32,
      Math.min(MAX_SURFACE_POINT_COUNT, Math.floor(pointCount))
    )
    const time = clock.getElapsedTime() * gradientFlowSpeed

    for (let i = 0; i < visibleCount; i += 1) {
      computeGradientColor(
        mixed,
        colorA,
        colorB,
        colorC,
        sphereData.latitudes[i],
        sphereData.longitudes[i],
        time,
        sphereData.landMask[i]
      )

      const i3 = i * 3
      colors[i3] = mixed.r
      colors[i3 + 1] = mixed.g
      colors[i3 + 2] = mixed.b
    }

    const attr = geometryRef.current.getAttribute('color') as THREE.BufferAttribute
    attr.needsUpdate = true
  })

  const visibleCount = Math.max(32, Math.min(MAX_SURFACE_POINT_COUNT, Math.floor(pointCount)))

  return (
    <group ref={groupRef} scale={scale}>
      <points renderOrder={1}>
        <bufferGeometry ref={geometryRef}>
          <bufferAttribute
            attach="attributes-position"
            array={sphereData.positions}
            itemSize={3}
            count={sphereData.positions.length / 3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={colors}
            itemSize={3}
            count={colors.length / 3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          size={pointSize}
          map={spriteTexture ?? undefined}
          alphaMap={spriteTexture ?? undefined}
          transparent
          alphaTest={0.2}
          vertexColors
          opacity={0.9}
          depthTest
          depthWrite
        />
      </points>

      <SphereConnections
        positions={sphereData.positions}
        landMask={sphereData.landMask}
        visibleCount={visibleCount}
        connectionRatio={connectionRatio}
        connectionDepth={connectionDepth}
        connectionGrowSpeed={connectionGrowSpeed}
        gradientColorA={gradientColorA}
        gradientColorB={gradientColorB}
        gradientColorC={gradientColorC}
        gradientFlowSpeed={gradientFlowSpeed}
      />
    </group>
  )
}

function cleanLogoTexture(texture: THREE.Texture) {
  const image = texture.image as HTMLImageElement | undefined
  if (!image) return texture

  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return texture

  ctx.drawImage(image, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (r < 12 && g < 12 && b < 12) {
      data[i + 3] = 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
  const cleaned = new THREE.CanvasTexture(canvas)
  cleaned.minFilter = THREE.LinearFilter
  cleaned.magFilter = THREE.LinearFilter
  cleaned.generateMipmaps = false
  return cleaned
}

function LogoPlane({ scale, sphereScale }: { scale: number; sphereScale: number }) {
  const texture = useLoader(THREE.TextureLoader, '/assets/spiski-logo-original.png')
  const cleanedTexture = useMemo(() => cleanLogoTexture(texture), [texture])

  useEffect(() => {
    return () => {
      cleanedTexture.dispose()
    }
  }, [cleanedTexture])

  const image = cleanedTexture.image as HTMLImageElement
  const aspect = image && image.width ? image.width / image.height : 1

  const innerRadius = sphereScale * 0.62
  const maxHeight = ((innerRadius * 2) / Math.sqrt(1 + aspect * aspect)) * 2
  const height = Math.min(scale, maxHeight)
  const width = height * aspect

  return (
    <mesh position={[0, 0, 0]} renderOrder={2}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={cleanedTexture}
        transparent
        alphaTest={0.1}
        depthTest
        depthWrite={false}
      />
    </mesh>
  )
}

function loadSettings() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

function saveSettings(settings: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

function GlobalSphereBackground() {
  const stored = useMemo(() => loadSettings() ?? {}, [])
  const controlsRef = useRef<Record<string, unknown>>({})

  const {
    sphereScale,
    surfacePointSize,
    surfacePointCount,
    rotationSpeed,
    rotationDirection,
    gradientColorA,
    gradientColorB,
    gradientColorC,
    gradientFlowSpeed,
    logoScale,
    connectionRatio,
    connectionDepth,
    connectionGrowSpeed,
  } = useControls('Background Sphere', {
    sphereScale: {
      value: (stored.sphereScale as number) ?? 3.2,
      min: 1,
      max: 6,
      step: 0.1,
    },
    surfacePointSize: {
      value: (stored.surfacePointSize as number) ?? 0.03,
      min: 0.005,
      max: 0.08,
      step: 0.005,
    },
    surfacePointCount: {
      value: (stored.surfacePointCount as number) ?? 1600,
      min: 200,
      max: 6000,
      step: 100,
    },
    rotationSpeed: {
      value: (stored.rotationSpeed as number) ?? 0.15,
      min: 0,
      max: 1,
      step: 0.01,
    },
    rotationDirection: {
      value: (stored.rotationDirection as string) ?? 'counterclockwise',
      options: ['clockwise', 'counterclockwise'],
    },
    gradientColorA: {
      value: (stored.gradientColorA as string) ?? '#4b7bff',
    },
    gradientColorB: {
      value: (stored.gradientColorB as string) ?? '#8fd3ff',
    },
    gradientColorC: {
      value: (stored.gradientColorC as string) ?? '#5cf2d6',
    },
    gradientFlowSpeed: {
      value: (stored.gradientFlowSpeed as number) ?? 0.15,
      min: 0,
      max: 1,
      step: 0.01,
    },
    logoScale: {
      value: (stored.logoScale as number) ?? 1.4,
      min: 0.4,
      max: 4.8,
      step: 0.05,
    },
    connectionRatio: {
      value: (stored.connectionRatio as number) ?? 0.06,
      min: 0,
      max: 0.25,
      step: 0.01,
    },
    connectionDepth: {
      value: (stored.connectionDepth as number) ?? 3,
      options: [2, 3, 4, 5],
    },
    connectionGrowSpeed: {
      value: (stored.connectionGrowSpeed as number) ?? 0.4,
      min: 0.05,
      max: 2,
      step: 0.05,
    },
    apply: button(() => {
      saveSettings(controlsRef.current)
    }),
  })

  controlsRef.current = {
    sphereScale,
    surfacePointSize,
    surfacePointCount,
    rotationSpeed,
    rotationDirection,
    gradientColorA,
    gradientColorB,
    gradientColorC,
    gradientFlowSpeed,
    logoScale,
    connectionRatio,
    connectionDepth,
    connectionGrowSpeed,
  }

  const spriteTexture = useMemo(() => createCircleTexture(128), [])

  useEffect(() => {
    return () => {
      spriteTexture?.dispose()
    }
  }, [spriteTexture])

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <RotatingSphere
          scale={sphereScale}
          pointSize={surfacePointSize}
          pointCount={surfacePointCount}
          rotationSpeed={rotationSpeed}
          rotationDirection={rotationDirection}
          gradientColorA={gradientColorA}
          gradientColorB={gradientColorB}
          gradientColorC={gradientColorC}
          gradientFlowSpeed={gradientFlowSpeed}
          spriteTexture={spriteTexture}
          connectionRatio={connectionRatio}
          connectionDepth={connectionDepth}
          connectionGrowSpeed={connectionGrowSpeed}
        />
        <LogoPlane scale={logoScale} sphereScale={sphereScale} />
      </Canvas>
    </div>
  )
}

export default GlobalSphereBackground