import { NavLink } from 'react-router-dom'

function Nav() {
  return (
    <nav className="nav">
      <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        Dashboard
      </NavLink>
      <NavLink to="/reviews" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        Reviews
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        Settings
      </NavLink>
    </nav>
  )
}

export default Nav
