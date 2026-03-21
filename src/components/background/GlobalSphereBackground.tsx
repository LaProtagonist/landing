import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { buildFibonacciSphere } from './sphereUtils'

const MAX_SURFACE_POINT_COUNT = 6000

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

      const i3 = i * 3
      colors[i3] = Math.min(1, mixed.r * intensity)
      colors[i3 + 1] = Math.min(1, mixed.g * intensity)
      colors[i3 + 2] = Math.min(1, mixed.b * intensity)
    }

    const attr = geometryRef.current.getAttribute('color') as THREE.BufferAttribute
    attr.needsUpdate = true
  })

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
    <mesh position={[0, 0, 0]} renderOrder={2}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={cleanedTexture}
        transparent
        alphaTest={0.1}
        depthTest
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function GlobalSphereBackground() {
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
  } = useControls('Background Sphere', {
    sphereScale: {
      value: 3.2,
      min: 1,
      max: 6,
      step: 0.1,
    },
    surfacePointSize: {
      value: 0.03,
      min: 0.005,
      max: 0.08,
      step: 0.005,
    },
    surfacePointCount: {
      value: 1600,
      min: 200,
      max: 6000,
      step: 100,
    },
    rotationSpeed: {
      value: 0.15,
      min: 0,
      max: 1,
      step: 0.01,
    },
    rotationDirection: {
      value: 'counterclockwise',
      options: ['clockwise', 'counterclockwise'],
    },
    gradientColorA: {
      value: '#4b7bff',
    },
    gradientColorB: {
      value: '#8fd3ff',
    },
    gradientColorC: {
      value: '#5cf2d6',
    },
    gradientFlowSpeed: {
      value: 0.15,
      min: 0,
      max: 1,
      step: 0.01,
    },
    logoScale: {
      value: 1.4,
      min: 0.4,
      max: 2.4,
      step: 0.05,
    },
  })

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
        />
        <LogoPlane scale={logoScale} />
      </Canvas>
    </div>
  )
}

export default GlobalSphereBackground