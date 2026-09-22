import { Routes, Route, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Reviews from './pages/Reviews'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className={`min-h-screen flex flex-col ${isAuthPage ? 'bg-midnight-slate-darker' : 'bg-gray-50 dark:bg-gray-900'} transition-colors duration-200`}>
      {!isAuthPage && <Nav />}
      <main className={isAuthPage ? '' : 'flex-1 py-8'}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </main>
    </div>
  )
}

export default App
