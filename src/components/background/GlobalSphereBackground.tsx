import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { button, useControls } from 'leva'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { buildFibonacciSphere } from './sphereUtils'
import { buildRouteIndices, mulberry32 } from './connectionUtils'

const MAX_SURFACE_POINT_COUNT = 6000
const STORAGE_KEY = 'spiski-background-sphere'

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
    (a.b * wa + b.b * wc + c.b * wc) / total
  )
}

type RouteState = {
  indices: Uint32Array
  progress: number
  phase: 'growing' | 'shrinking'
}

function SphereConnections({
  positions,
  visibleCount,
  connectionRatio,
  connectionDepth,
  connectionGrowSpeed,
}: {
  positions: Float32Array
  visibleCount: number
  connectionRatio: number
  connectionDepth: number
  connectionGrowSpeed: number
}) {
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const routesRef = useRef<RouteState[]>([])
  const randRef = useRef<() => number>(() => 0.5)

  const routeCount = Math.min(
    Math.max(1, Math.floor(visibleCount * connectionRatio)),
    240
  )
  const depth = Math.max(2, Math.min(5, Math.floor(connectionDepth)))

  useEffect(() => {
    const seed = 4242 + visibleCount * 31 + depth * 131
    randRef.current = mulberry32(seed)
    const rand = randRef.current

    const routes: RouteState[] = []
    for (let i = 0; i < routeCount; i += 1) {
      const indices = buildRouteIndices(visibleCount, depth, rand)
      const stagger = (depth - 1) * 0.6 * rand()
      routes.push({
        indices,
        progress: -stagger,
        phase: 'growing',
      })
    }
    routesRef.current = routes
  }, [visibleCount, routeCount, depth])

  const segmentsPerRoute = depth - 1
  const segmentCount = routeCount * segmentsPerRoute
  const linePositions = useMemo(
    () => new Float32Array(segmentCount * 2 * 3),
    [segmentCount]
  )

  useFrame((_, delta) => {
    if (!geometryRef.current) return
    const routes = routesRef.current
    if (routes.length === 0) return

    const speed = Math.max(0.01, connectionGrowSpeed)
    const maxProgress = depth - 1

    for (let r = 0; r < routes.length; r += 1) {
      const route = routes[r]
      if (route.phase === 'growing') {
        route.progress += delta * speed
        if (route.progress >= maxProgress) {
          route.progress = maxProgress
          route.phase = 'shrinking'
        }
      } else {
        route.progress -= delta * speed
        if (route.progress <= 0) {
          const rand = randRef.current
          route.indices = buildRouteIndices(visibleCount, depth, rand)
          route.progress = -maxProgress * 0.4 * rand()
          route.phase = 'growing'
        }
      }
    }

    for (let r = 0; r < routes.length; r += 1) {
      const route = routes[r]
      const progress = route.progress
      const shrinkProgress = maxProgress - progress

      for (let s = 0; s < segmentsPerRoute; s += 1) {
        const segmentIndex = r * segmentsPerRoute + s
        const baseIndex = segmentIndex * 6

        const idxA = route.indices[s]
        const idxB = route.indices[s + 1]

        const a3 = idxA * 3
        const b3 = idxB * 3

        const ax = positions[a3]
        const ay = positions[a3 + 1]
        const az = positions[a3 + 2]
        const bx = positions[b3]
        const by = positions[b3 + 1]
        const bz = positions[b3 + 2]

        let t = 0
        if (route.phase === 'growing') {
          t = Math.max(0, Math.min(1, progress - s))
        } else {
          t = Math.max(0, Math.min(1, 1 - (shrinkProgress - s)))
        }

        const cx = ax + (bx - ax) * t
        const cy = ay + (by - ay) * t
        const cz = az + (bz - az) * t

        linePositions[baseIndex] = ax
        linePositions[baseIndex + 1] = ay
        linePositions[baseIndex + 2] = az
        linePositions[baseIndex + 3] = cx
        linePositions[baseIndex + 4] = cy
        linePositions[baseIndex + 5] = cz
      }
    }

    geometryRef.current.getAttribute('position').needsUpdate = true
  })

  if (visibleCount < 2 || routeCount === 0) return null

  return (
    <lineSegments>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          array={linePositions}
          itemSize={3}
          count={linePositions.length / 3}
          usage={THREE.DynamicDrawUsage}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#c7ddff" transparent opacity={0.5} />
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

    const visibleCount = Math.max(32, Math.min(MAX_SURFACE_POINT_COUNT, Math.floor(pointCount)))
    const time = clock.getElapsedTime() * gradientFlowSpeed

    for (let i = 0; i < visibleCount; i += 1) {
      const lat = sphereData.latitudes[i]
      const lon = sphereData.longitudes[i]
      const land = sphereData.landMask[i]

      const wa = 0.6 + 0.4 * Math.sin(lon + time)
      const wb = 0.6 + 0.4 * Math.sin(lat * 1.6 - time * 0.7)
      const wc = 0.6 + 0.4 * Math.sin((lon - lat) * 0.8 + time * 0.4)

      mixColors(mixed, colorA, colorB, colorC, wa, wb, wc)

      const oceanDim = 0.75
      const landBoost = 1.15
      const intensity = oceanDim + land * (landBoost - oceanDim)
      const r = Math.min(1, mixed.r * intensity)
      const g = Math.min(1, mixed.g * intensity)
      const b = Math.min(1, mixed.b * intensity)

      const i3 = i * 3
      colors[i3] = r
      colors[i3 + 1] = g
      colors[i3 + 2] = b
    }

    const attr = geometryRef.current.getAttribute('color')
    attr.needsUpdate = true
  })

  const visibleCount = Math.max(32, Math.min(MAX_SURFACE_POINT_COUNT, Math.floor(pointCount)))

  return (
    <group ref={groupRef} scale={scale}>
      <points>
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
          depthWrite={false}
        />
      </points>
      <SphereConnections
        positions={sphereData.positions}
        visibleCount={visibleCount}
        connectionRatio={connectionRatio}
        connectionDepth={connectionDepth}
        connectionGrowSpeed={connectionGrowSpeed}
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

function LogoPlane({ scale }: { scale: number }) {
  const texture = useLoader(THREE.TextureLoader, '/assets/spiski-logo-original.png')
  const cleanedTexture = useMemo(() => cleanLogoTexture(texture), [texture])

  useEffect(() => {
    return () => {
      cleanedTexture.dispose()
    }
  }, [cleanedTexture])

  const image = cleanedTexture.image as HTMLImageElement
  const aspect = image && image.width ? image.width / image.height : 1
  const width = scale * aspect
  const height = scale

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={cleanedTexture}
        transparent
        alphaTest={0.1}
        depthWrite={false}
        depthTest
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
  const stored = loadSettings() ?? {}
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
    apply,
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
      max: 2.4,
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
        <LogoPlane scale={logoScale} />
      </Canvas>
    </div>
  )
}

export default GlobalSphereBackground
