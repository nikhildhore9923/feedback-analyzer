import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Reviews from './pages/Reviews'
import Settings from './pages/Settings'

function App() {
  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">Pulse</span>
          <span className="brand-sub">feedback signal dashboard</span>
        </div>
        <div className="status-pill">
          <span className="pulse-dot" />
          Listening
        </div>
      </div>

      <Nav />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  )
}

export default App
