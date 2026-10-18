import { Navigate, Outlet } from 'react-router-dom';
import { isTokenValid, clearAuth } from '../utils/auth';

function ProtectedRoute() {
  const token = localStorage.getItem('pulse_jwt_token');

  if (!token) {
    // Clean redirect for visitors who are not logged in
    return <Navigate to="/login" replace />;
  }

  if (!isTokenValid(token)) {
    // Token existed but has expired
    clearAuth();
    return <Navigate to="/login?expired=1" replace />;
  }

  // Render the child routes if authenticated
  return <Outlet />;
}

export default ProtectedRoute;
