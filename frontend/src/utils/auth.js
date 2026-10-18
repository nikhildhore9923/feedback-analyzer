/**
 * Helper to validate JWT expiration and structure client-side
 * @param {string|null} token 
 * @returns {boolean}
 */
export function isTokenValid(token) {
  if (!token || typeof token !== 'string') return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode Base64URL string
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    // If expiration claim exists, check if expired (with a 10s buffer)
    if (payload.exp) {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      return payload.exp > (nowInSeconds + 10);
    }

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Clear authentication credentials from localStorage
 */
export function clearAuth() {
  localStorage.removeItem('pulse_jwt_token');
  localStorage.removeItem('pulse_tenant_id');
  localStorage.removeItem('pulse_user_email');
}
