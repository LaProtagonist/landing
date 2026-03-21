import { Leva, useControls } from 'leva'

function DevPanel() {
  const { debugColor } = useControls({
    debugColor: '#ff0000',
  })

  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <>
      <Leva collapsed={false} />
      <div
        className="fixed bottom-4 left-4 h-12 w-12 rounded-full border border-white/20"
        style={{ background: debugColor }}
      />
    </>
  )
}

export default DevPanel