import './index.css'
import GlobalSphereBackground from './components/background/GlobalSphereBackground'
import DevPanel from './components/dev/DevPanel'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <GlobalSphereBackground />
      <DevPanel />
    </div>
  )
}

export default App
